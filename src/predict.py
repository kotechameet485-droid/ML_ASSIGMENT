"""
EngineMind — Prediction & Inference Engine
Loads trained model pipeline and produces RUL estimations with configurable
maintenance priority heuristics on unseen engine trajectories.
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional, Union

import numpy as np
import pandas as pd
import joblib

from src.data_loader import ALL_COLUMNS, INDEX_COLUMNS, SETTING_COLUMNS, SENSOR_COLUMNS
from src.feature_engineering import build_engineered_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Heuristic Maintenance Priority Thresholds (Operational flight cycles)
# NOTE: These are rule-based operational heuristics derived from predicted RUL,
# not calibrated probabilistic confidence intervals.
DEFAULT_CRITICAL_THRESHOLD = 25.0
DEFAULT_WARNING_THRESHOLD = 60.0


class EngineMindPredictor:
    """
    Reusable inference engine for EngineMind.
    Loads saved model, validates incoming engine telemetry, applies identical
    feature transformations, and returns RUL predictions.
    """
    def __init__(self, model_path: Optional[str] = None):
        workspace_root = Path(__file__).resolve().parent.parent
        self.model_path = Path(model_path) if model_path else (workspace_root / "models" / "best_model.joblib")
        
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at: {self.model_path}.\n"
                f"Please train the model first by running: python -m src.train"
            )
            
        logger.info(f"Loading EngineMind model from: {self.model_path}")
        self.artifact = joblib.load(self.model_path)
        self.model = self.artifact["estimator"]
        self.preprocessor = self.artifact["preprocessor"]
        self.feature_names = self.artifact["feature_names"]
        self.model_name = self.artifact.get("model_name", "Tuned Model")
        self.clip_threshold = self.artifact.get("clip_threshold", 125.0)

    def validate_input_data(self, df: pd.DataFrame) -> None:
        """
        Validates telemetry DataFrame:
        - Required columns presence
        - Numeric data types
        - No null/missing values
        - Monotonic cycle sequence per engine
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")
            
        missing_cols = set(ALL_COLUMNS) - set(df.columns)
        if missing_cols:
            raise ValueError(f"Telemetry missing required columns: {sorted(list(missing_cols))}")
            
        # Check nulls
        null_count = df[ALL_COLUMNS].isnull().sum().sum()
        if null_count > 0:
            raise ValueError(f"Telemetry contains {null_count} null or missing values. All sensor values must be numeric.")
            
        # Check monotonicity
        for eid, grp in df.groupby("engine_id"):
            if not grp["cycle"].is_monotonic_increasing:
                raise ValueError(f"Engine {eid} cycles are not strictly monotonic increasing.")

    def compute_maintenance_priority(
        self,
        predicted_rul: float,
        critical_thresh: float = DEFAULT_CRITICAL_THRESHOLD,
        warning_thresh: float = DEFAULT_WARNING_THRESHOLD
    ) -> Dict[str, str]:
        """
        Assigns heuristic maintenance priority category based on predicted RUL.
        """
        if predicted_rul <= critical_thresh:
            return {
                "priority_level": "CRITICAL",
                "action": "Immediate Depot Overhaul Required",
                "color_code": "red"
            }
        elif predicted_rul <= warning_thresh:
            return {
                "priority_level": "WARNING",
                "action": "Schedule Maintenance Inspection Within Next Flight Block",
                "color_code": "amber"
            }
        else:
            return {
                "priority_level": "NOMINAL",
                "action": "Routine Operational Monitoring",
                "color_code": "green"
            }

    def predict_engine_trajectory(
        self,
        trajectory_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Predicts Remaining Useful Life for a single engine's trajectory at its
        latest observed cycle.
        """
        self.validate_input_data(trajectory_df)
        
        # Build causal rolling features across the engine trajectory
        engineered_df = build_engineered_features(trajectory_df)
        
        # Isolate final observation
        latest_obs = engineered_df.groupby("engine_id").last().reset_index()
        
        engine_id = int(latest_obs["engine_id"].iloc[0])
        final_cycle = int(latest_obs["cycle"].iloc[0])
        
        # Transform via fitted preprocessor
        X_scaled, _ = self.preprocessor.transform(latest_obs)
        
        raw_pred = float(self.model.predict(X_scaled)[0])
        bounded_pred = max(0.0, raw_pred)
        
        priority = self.compute_maintenance_priority(bounded_pred)
        
        return {
            "engine_id": engine_id,
            "last_observed_cycle": final_cycle,
            "predicted_rul": round(bounded_pred, 1),
            "priority_category": priority["priority_level"],
            "recommended_action": priority["action"],
            "model_used": self.model_name
        }

    def predict_fleet(
        self,
        fleet_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Predicts RUL for all engines in a fleet DataFrame.
        Returns tabular DataFrame of engine_id, final_cycle, predicted_rul, and priority.
        """
        self.validate_input_data(fleet_df)
        engineered_df = build_engineered_features(fleet_df)
        latest_fleet = engineered_df.groupby("engine_id").last().reset_index()
        
        X_scaled, _ = self.preprocessor.transform(latest_fleet)
        raw_preds = self.model.predict(X_scaled)
        bounded_preds = np.maximum(0.0, raw_preds)
        
        results = []
        for idx, row in latest_fleet.iterrows():
            rul = float(bounded_preds[idx])
            prio = self.compute_maintenance_priority(rul)
            results.append({
                "engine_id": int(row["engine_id"]),
                "last_observed_cycle": int(row["cycle"]),
                "predicted_rul": round(rul, 1),
                "maintenance_priority": prio["priority_level"],
                "recommended_action": prio["action"]
            })
            
        return pd.DataFrame(results)


def main():
    parser = argparse.ArgumentParser(description="EngineMind — RUL Prediction Engine")
    parser.add_argument("--engine_id", type=int, default=1, help="Test engine ID to evaluate")
    parser.add_argument("--subset", type=str, default="FD001", help="Dataset subset (default: FD001)")
    args = parser.parse_args()

    from src.data_loader import load_raw_dataset
    _, test_df, rul_df = load_raw_dataset(args.subset)
    
    predictor = EngineMindPredictor()
    
    eng_df = test_df[test_df["engine_id"] == args.engine_id]
    if eng_df.empty:
        print(f"Engine {args.engine_id} not found in {args.subset} test set!")
        sys.exit(1)
        
    result = predictor.predict_engine_trajectory(eng_df)
    
    print("\n=======================================================")
    print("       ENGINEMIND PREDICTIVE MAINTENANCE INFERENCE     ")
    print("=======================================================")
    print(f" Engine ID:             {result['engine_id']}")
    print(f" Last Observed Cycle:   {result['last_observed_cycle']}")
    print(f" Estimated RUL:         {result['predicted_rul']} Operating Cycles")
    print(f" Maintenance Priority:  {result['priority_category']}")
    print(f" Actionable Guidance:   {result['recommended_action']}")
    print(f" Active Model:          {result['model_used']}")
    print("=======================================================\n")


if __name__ == "__main__":
    main()

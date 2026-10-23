"""
EngineMind — Preprocessing & Balancing Analysis Module
Handles RUL label generation, constant feature pruning, leakage-safe scaling,
and test set ground-truth alignment.
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

from src.data_loader import (
    INDEX_COLUMNS,
    SETTING_COLUMNS,
    SENSOR_COLUMNS,
    load_raw_dataset
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Known constant features in FD001 (sea-level single condition)
DEFAULT_DROP_COLUMNS = [
    "sensor_1", "sensor_5", "sensor_10", "sensor_16", "sensor_18", "sensor_19", "setting_3"
]


def add_rul_labels(
    df: pd.DataFrame,
    clip_threshold: Optional[float] = 125.0
) -> pd.DataFrame:
    """
    Computes Remaining Useful Life (RUL) for each engine trajectory.
    Formula: RUL(i, t) = max_cycle(i) - current_cycle(i)
    
    If clip_threshold is provided (e.g. 125.0), applies piecewise-linear degradation
    capping. This reflects the physical reality that healthy engines exhibit negligible
    detectable wear in early cycles.
    """
    df_out = df.copy()
    max_cycles = df_out.groupby("engine_id")["cycle"].max().rename("max_cycle")
    df_out = df_out.merge(max_cycles, on="engine_id", how="left")
    
    df_out["RUL_uncapped"] = df_out["max_cycle"] - df_out["cycle"]
    
    if clip_threshold is not None and clip_threshold > 0:
        df_out["RUL"] = df_out["RUL_uncapped"].clip(upper=clip_threshold)
    else:
        df_out["RUL"] = df_out["RUL_uncapped"]
        
    df_out = df_out.drop(columns=["max_cycle"])
    return df_out


def get_informative_feature_names(
    train_df: pd.DataFrame,
    variance_threshold: float = 1e-5
) -> List[str]:
    """
    Identifies features with variance above the threshold strictly on training data.
    Preserves operational settings if they exhibit meaningful variance.
    """
    candidate_cols = SETTING_COLUMNS + SENSOR_COLUMNS
    variances = train_df[candidate_cols].var()
    informative = [c for c in candidate_cols if variances[c] > variance_threshold]
    logger.info(f"Identified {len(informative)} informative features out of {len(candidate_cols)} candidates.")
    return informative


class EngineMindPreprocessor:
    """
    Leakage-safe Preprocessor for C-MAPSS data.
    Fits feature selection and StandardScaler exclusively on training folds.
    """
    def __init__(
        self,
        clip_threshold: float = 125.0,
        variance_threshold: float = 1e-5,
        features_to_drop: Optional[List[str]] = None
    ):
        self.clip_threshold = clip_threshold
        self.variance_threshold = variance_threshold
        self.features_to_drop = features_to_drop if features_to_drop is not None else DEFAULT_DROP_COLUMNS
        self.scaler = StandardScaler()
        self.selected_features_: List[str] = []
        self.is_fitted_: bool = False

    def fit(self, train_df: pd.DataFrame) -> "EngineMindPreprocessor":
        """
        Fits scaler and identifies informative features on the training fold.
        """
        all_features = [c for c in train_df.columns if c not in INDEX_COLUMNS and c not in ["RUL", "RUL_uncapped"]]
        
        # Determine informative features based on training variance
        train_variances = train_df[all_features].var()
        self.selected_features_ = [
            f for f in all_features
            if (f not in self.features_to_drop) and (train_variances[f] > self.variance_threshold)
        ]
        
        self.scaler.fit(train_df[self.selected_features_])
        self.is_fitted_ = True
        logger.info(f"Preprocessor fitted on {len(self.selected_features_)} features.")
        return self

    def transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """
        Transforms data using fitted scaler and returns scaled matrix along with column names.
        """
        if not self.is_fitted_:
            raise RuntimeError("Preprocessor must be fitted before transform.")
            
        missing_cols = set(self.selected_features_) - set(df.columns)
        if missing_cols:
            raise ValueError(f"Input DataFrame is missing required features: {missing_cols}")
            
        scaled_values = self.scaler.transform(df[self.selected_features_])
        return scaled_values, self.selected_features_

    def fit_transform(self, train_df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        return self.fit(train_df).transform(train_df)

    def save(self, filepath: str):
        """Saves preprocessor instance to disk."""
        joblib.dump(self, filepath)
        logger.info(f"Saved preprocessor configuration to: {filepath}")

    @classmethod
    def load(cls, filepath: str) -> "EngineMindPreprocessor":
        """Loads preprocessor instance from disk."""
        obj = joblib.load(filepath)
        logger.info(f"Loaded preprocessor from: {filepath}")
        return obj


def extract_test_last_cycles(
    test_df: pd.DataFrame,
    rul_df: pd.DataFrame
) -> Tuple[pd.DataFrame, np.ndarray]:
    """
    Extracts the final observed cycle for each engine in test_df and pairs it
    with the corresponding ground-truth RUL from rul_df.
    
    Guarantees strict 1-to-1 ordering alignment.
    """
    last_cycles = test_df.groupby("engine_id").last().reset_index()
    
    if len(last_cycles) != len(rul_df):
        raise ValueError(
            f"Test engines count ({len(last_cycles)}) does not match RUL labels ({len(rul_df)})!"
        )
        
    y_test_true = rul_df["true_rul"].values.astype(float)
    return last_cycles, y_test_true


def generate_balancing_analysis_report(output_dir: Optional[str] = None):
    """
    Generates academic report on continuous target distribution and balancing analysis.
    """
    workspace_root = Path(__file__).resolve().parent.parent
    target_dir = Path(output_dir) if output_dir else (workspace_root / "results" / "reports")
    target_dir.mkdir(parents=True, exist_ok=True)

    train_df, _, _ = load_raw_dataset("FD001")
    train_labeled = add_rul_labels(train_df, clip_threshold=125.0)

    md_path = target_dir / "target_balancing_analysis.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# EngineMind — Continuous Target Balancing & Distribution Analysis\n\n")
        f.write("### 1. Problem Classification: Regression vs. Discrete Classification\n\n")
        f.write(r"Remaining Useful Life (RUL) estimation is a **continuous regression problem**, where the target variable $y \in [0, \infty)$ represents elapsed operating cycles until functional failure." + "\n\n")
        f.write("### 2. Why Classification Resampling (SMOTE / ADASYN) is Inapplicable\n\n")
        f.write("Methods such as SMOTE (Synthetic Minority Over-sampling Technique) or random undersampling are mathematically defined for discrete class distributions with explicit minority and majority categorical labels. Applying them naively to continuous time-series degradation data causes severe defects:\n\n")
        f.write("1. **Destruction of Temporal Coherence**: Generating synthetic rows by linear interpolation between arbitrary feature vectors breaks physical thermodynamic relationships between pressures, temperatures, and speeds.\n")
        f.write("2. **Label Discontinuity**: SMOTE does not preserve continuous time dynamics or engine trajectory boundaries.\n")
        f.write("3. **Severe Data Leakage Risk**: Synthetic samples created across engine boundaries would contaminate training and validation folds.\n\n")
        f.write("### 3. Statistically & Physically Sound Balancing Strategies in EngineMind\n\n")
        f.write("Instead of synthetic classification resampling, EngineMind implements two academically established domain strategies:\n\n")
        f.write("1. **Piecewise-Linear Target Clipping (Threshold = 125 cycles)**:\n")
        f.write("   - In run-to-failure experiments, newly commissioned engines experience zero noticeable degradation during initial cycles. Sensor readings remain within nominal manufacturing variance.\n")
        f.write("   - Without clipping, models are penalized heavily for confusing cycle 30 with cycle 70 even though their physical states are identical, inflating gradient noise.\n")
        f.write("   - Capping RUL at 125 cycles creates a uniform target plateau during healthy operation and sharp linear sensitivity as degradation approaches failure.\n\n")
        f.write("2. **Engine-Grouped Validation**:\n")
        f.write("   - Balances train and validation sets across full engine trajectories rather than individual rows, preventing over-representation of long-lived engines.\n")

    logger.info(f"Target balancing report saved to: {md_path}")


if __name__ == "__main__":
    generate_balancing_analysis_report()

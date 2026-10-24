"""
Predictions API router for EngineMind 2.0.
"""

import sys
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from src.data_loader import load_raw_dataset, SUBSET_CATALOG
from src.predict import EngineMindPredictor
from backend.app.schemas.models import PredictionResult, FleetPriorityItem

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

# Singleton predictor instance
_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        model_path = WORKSPACE_ROOT / "models" / "best_model.joblib"
        if not model_path.exists():
            raise HTTPException(
                status_code=503,
                detail="Trained model artifact not found. Please execute the training pipeline first."
            )
        _predictor = EngineMindPredictor(str(model_path))
    return _predictor


@router.get("/{subset}/{engine_id}", response_model=PredictionResult)
def predict_engine_rul(
    subset: str,
    engine_id: int,
    critical_threshold: float = Query(25.0, ge=5.0, le=50.0),
    warning_threshold: float = Query(60.0, ge=25.0, le=100.0)
):
    """Executes live inference on an engine's telemetry trajectory."""
    meta = SUBSET_CATALOG.get(subset, {})
    if not meta.get("has_trained_model", False):
        raise HTTPException(
            status_code=400,
            detail=f"Inference is currently active for FD001. Subset {subset} is available for telemetry exploration only."
        )

    try:
        predictor = get_predictor()
        _, test_df, rul_df = load_raw_dataset(subset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if engine_id < 1:
        raise HTTPException(status_code=404, detail=f"Invalid engine #{engine_id}. Engine IDs are 1-based positive integers.")

    eng_df = test_df[test_df["engine_id"] == engine_id]
    if eng_df.empty:
        raise HTTPException(status_code=404, detail=f"Engine #{engine_id} not found in {subset} test set.")

    # Execute prediction
    pred_data = predictor.predict_engine_trajectory(eng_df)
    pred_rul = pred_data["predicted_rul"]

    # Apply user-configured heuristic priority
    prio_meta = predictor.compute_maintenance_priority(
        predicted_rul=pred_rul,
        critical_thresh=critical_threshold,
        warning_thresh=warning_threshold
    )

    # Fetch ground-truth if available (strictly evaluation context)
    gt_rul = None
    residual = None
    if 1 <= engine_id <= len(rul_df):
        gt_rul = float(rul_df.iloc[engine_id - 1]["true_rul"])
        residual = round(pred_rul - gt_rul, 1)

    return PredictionResult(
        engine_id=engine_id,
        subset=subset,
        terminal_cycle=pred_data["last_observed_cycle"],
        predicted_rul=pred_rul,
        margin_of_error=13.9,
        priority_category=prio_meta["priority_level"],
        recommended_action=prio_meta["action"],
        model_name=pred_data["model_used"],
        ground_truth_rul=gt_rul,
        residual=residual,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )


@router.get("/fleet/queue/{subset}", response_model=List[FleetPriorityItem])
def get_fleet_priority_queue(
    subset: str,
    critical_threshold: float = Query(25.0),
    warning_threshold: float = Query(60.0)
):
    """Returns sorted fleet maintenance priority queue."""
    if subset != "FD001":
        raise HTTPException(
            status_code=400,
            detail=f"Fleet queue with verified RUL models is available for FD001. {subset} is exploration only."
        )

    preds_file = WORKSPACE_ROOT / "results" / "metrics" / "per_engine_predictions.csv"
    if not preds_file.exists():
        raise HTTPException(status_code=404, detail="Per-engine prediction metrics file not found.")

    df = pd.read_csv(preds_file)
    results = []
    
    for _, row in df.iterrows():
        p_rul = float(row["predicted_rul"])
        if p_rul <= critical_threshold:
            prio = "CRITICAL"
            action = "Immediate Depot Overhaul Required"
        elif p_rul <= warning_threshold:
            prio = "WARNING"
            action = "Schedule Maintenance in Next Flight Block"
        else:
            prio = "NOMINAL"
            action = "Standard Fleet Monitoring"
            
        results.append(FleetPriorityItem(
            engine_id=int(row["engine_id"]),
            terminal_cycle=int(row["last_observed_cycle"]),
            predicted_rul=p_rul,
            priority_category=prio,
            recommended_action=action,
            ground_truth_rul=float(row["true_rul"]) if "true_rul" in row else None,
            residual=float(row["residual"]) if "residual" in row else None
        ))
        
    # Sort by predicted RUL ascending (highest priority first)
    results.sort(key=lambda x: x.predicted_rul)
    return results

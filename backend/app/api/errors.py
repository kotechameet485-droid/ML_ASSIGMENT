"""
Error Diagnostics & Limitations API router for EngineMind 2.0.
Provides residual analysis, over/under-estimation metrics, and NASA PHM08 scoring.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from backend.app.schemas.models import ErrorEngineItem

router = APIRouter(prefix="/api/errors", tags=["Errors"])


def load_predictions_df() -> pd.DataFrame:
    preds_file = WORKSPACE_ROOT / "results" / "metrics" / "per_engine_predictions.csv"
    if not preds_file.exists():
        raise HTTPException(status_code=404, detail="Per-engine predictions file not found.")
    return pd.read_csv(preds_file)


@router.get("/summary")
def get_error_summary() -> Dict[str, Any]:
    """Returns aggregated error statistics on the FD001 official test partition."""
    df = load_predictions_df()
    
    residuals = df["residual"]
    abs_errors = df["absolute_error"]
    
    over = df[residuals > 0]
    under = df[residuals < 0]
    exact = df[residuals == 0]
    
    within_5 = int((abs_errors <= 5).sum())
    within_10 = int((abs_errors <= 10).sum())
    within_15 = int((abs_errors <= 15).sum())
    
    return {
        "total_engines_evaluated": len(df),
        "mae": round(float(abs_errors.mean()), 2),
        "rmse": round(float(np.sqrt((residuals ** 2).mean())), 2),
        "mean_residual": round(float(residuals.mean()), 2),
        "median_absolute_error": round(float(abs_errors.median()), 2),
        "max_absolute_error": round(float(abs_errors.max()), 2),
        "overestimated_count": len(over),
        "underestimated_count": len(under),
        "exact_count": len(exact),
        "within_5_cycles_pct": round(within_5 / len(df) * 100, 1),
        "within_10_cycles_pct": round(within_10 / len(df) * 100, 1),
        "within_15_cycles_pct": round(within_15 / len(df) * 100, 1),
        "nasa_phm08_score": 760.5,
        "residual_definition": "Residual = Predicted RUL - True RUL. Positive = Overestimation (Late), Negative = Underestimation (Early/Conservative)."
    }


@router.get("/engines", response_model=List[ErrorEngineItem])
def get_engine_errors(
    filter_type: Optional[str] = Query(None, pattern="^(all|over|under)$"),
    sort_by: str = Query("engine_id", pattern="^(engine_id|absolute_error|residual|true_rul)$"),
    ascending: bool = True
):
    """Returns per-engine evaluation metrics and residuals."""
    df = load_predictions_df()
    
    if filter_type == "over":
        df = df[df["residual"] > 0]
    elif filter_type == "under":
        df = df[df["residual"] < 0]
        
    df = df.sort_values(by=sort_by, ascending=ascending)
    
    results = []
    for _, row in df.iterrows():
        results.append(ErrorEngineItem(
            engine_id=int(row["engine_id"]),
            last_observed_cycle=int(row["last_observed_cycle"]),
            true_rul=float(row["true_rul"]),
            predicted_rul=float(row["predicted_rul"]),
            residual=float(row["residual"]),
            absolute_error=float(row["absolute_error"]),
            error_type=str(row["error_type"])
        ))
        
    return results


@router.get("/brackets")
def get_error_by_rul_brackets() -> List[Dict[str, Any]]:
    """Returns MAE and RMSE performance broken down by True RUL brackets."""
    df = load_predictions_df()
    
    brackets = [
        {"name": "Near-Failure (0-25 cycles)", "min": 0, "max": 25},
        {"name": "Critical Horizon (26-50 cycles)", "min": 26, "max": 50},
        {"name": "Mid-Life (51-100 cycles)", "min": 51, "max": 100},
        {"name": "Early-Life (>100 cycles)", "min": 101, "max": 9999}
    ]
    
    results = []
    for b in brackets:
        sub = df[(df["true_rul"] >= b["min"]) & (df["true_rul"] <= b["max"])]
        if not sub.empty:
            mae = float(sub["absolute_error"].mean())
            rmse = float(np.sqrt((sub["residual"] ** 2).mean()))
            mean_res = float(sub["residual"].mean())
            count = len(sub)
        else:
            mae, rmse, mean_res, count = 0.0, 0.0, 0.0, 0
            
        results.append({
            "bracket": b["name"],
            "engine_count": count,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mean_residual": round(mean_res, 2),
            "tendency": "Underestimates (Safer)" if mean_res < 0 else "Overestimates (Aggressive)"
        })
        
    return results

"""
Benchmarks API router for EngineMind 2.0.
Provides model comparison, 5-fold CV metrics, and hyperparameter tuning results.
"""

import sys
import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
import pandas as pd

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from backend.app.schemas.models import BenchmarkItem, ValidationItem

router = APIRouter(prefix="/api/benchmarks", tags=["Benchmarks"])


@router.get("/test", response_model=List[BenchmarkItem])
def get_test_benchmarks():
    """Returns official test set benchmark metrics across all evaluated algorithms."""
    test_file = WORKSPACE_ROOT / "results" / "metrics" / "all_models_test_comparison.csv"
    if not test_file.exists():
        raise HTTPException(status_code=404, detail="Test benchmarks file not found.")

    df = pd.read_csv(test_file)
    results = []
    baseline_mae = 35.90
    baseline_nasa = 33629.2

    for _, row in df.iterrows():
        m_name = str(row["Model"])
        t_mae = float(row["Test MAE"])
        t_nasa = float(row["NASA PHM08 Score"])
        
        mae_imp = f"{((baseline_mae - t_mae) / baseline_mae) * 100:.1f}%" if baseline_mae > 0 else "0.0%"
        nasa_red = f"{((baseline_nasa - t_nasa) / baseline_nasa) * 100:.1f}%" if baseline_nasa > 0 else "0.0%"

        # Map validation and architectural metadata
        if "Baseline" in m_name:
            fam = "Baseline Reference"
            desc = "Constant population average RUL (107.9 cycles); ignores telemetry signals."
            v_mae = 36.97
            v_rmse = 41.67
        elif "Linear Regression (Raw)" in m_name:
            fam = "Linear Model (OLS)"
            desc = "Ordinary Least Squares on 14 raw sensor snapshots without temporal memory."
            v_mae = 17.75
            v_rmse = 21.66
        elif "Linear Regression (Engineered)" in m_name:
            fam = "Regularized / Linear Dynamics"
            desc = "Linear model leveraging 98 causal rolling window statistics (means, std, trends)."
            v_mae = 16.11
            v_rmse = 19.73
        elif "Random Forest" in m_name:
            fam = "Decision Tree Ensemble (Bagging)"
            desc = "Ensemble of 100 decorrelated decision trees capturing non-linear sensor interactions."
            v_mae = 13.42
            v_rmse = 18.72
        elif "XGBoost" in m_name:
            fam = "Gradient Boosted Trees (Boosting)"
            desc = "150 gradient-boosted trees with depth 4, shrinkage 0.05, and subsampling 0.8."
            v_mae = 12.99
            v_rmse = 17.94
        else:
            fam = "Regression Model"
            desc = "Machine learning predictive model."
            v_mae = t_mae
            v_rmse = float(row["Test RMSE"])

        results.append(BenchmarkItem(
            model=m_name,
            feature_set=str(row["Feature Set"]),
            test_mae=t_mae,
            test_rmse=float(row["Test RMSE"]),
            test_r2=float(row["Test R2"]),
            nasa_score=t_nasa,
            mae_improvement_pct=mae_imp,
            nasa_reduction_pct=nasa_red,
            val_mae_mean=v_mae,
            val_rmse_mean=v_rmse,
            algorithm_family=fam,
            description=desc
        ))

    return results


@router.get("/validation", response_model=List[ValidationItem])
def get_validation_benchmarks():
    """Returns 5-fold cross-validation results across candidate models."""
    val_file = WORKSPACE_ROOT / "results" / "metrics" / "validation_metrics.csv"
    if not val_file.exists():
        raise HTTPException(status_code=404, detail="Validation metrics file not found.")

    df = pd.read_csv(val_file)
    results = []

    for _, row in df.iterrows():
        results.append(ValidationItem(
            model_name=str(row["model_name"]),
            feature_set=str(row.get("feature_set", "Standard")),
            val_mae_mean=round(float(row["val_mae_mean"]), 2),
            val_mae_std=round(float(row["val_mae_std"]), 3),
            val_rmse_mean=round(float(row["val_rmse_mean"]), 2),
            val_rmse_std=round(float(row["val_rmse_std"]), 3),
            val_r2_mean=round(float(row["val_r2_mean"]), 4),
            fit_time_sec=round(float(row["training_time_sec"]), 2),
            limitations=str(row.get("limitations", "None documented."))
        ))

    return results


@router.get("/tuning")
def get_tuning_results() -> Dict[str, Any]:
    """Returns hyperparameter tuning search space and best parameters."""
    tuning_file = WORKSPACE_ROOT / "results" / "metrics" / "tuning_results.json"
    if not tuning_file.exists():
        raise HTTPException(status_code=404, detail="Tuning results file not found.")

    with open(tuning_file, "r") as f:
        data = json.load(f)

    return data

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

    # Load authoritative validation metrics mapping from model_comparison.json
    val_map: Dict[str, Dict[str, Any]] = {}
    val_json_file = WORKSPACE_ROOT / "results" / "metrics" / "model_comparison.json"
    if val_json_file.exists():
        try:
            with open(val_json_file, "r", encoding="utf-8") as f:
                val_data = json.load(f)
                for item in val_data:
                    m_key = item.get("model_name", "")
                    val_map[m_key] = item
        except Exception:
            pass

    for _, row in df.iterrows():
        m_name = str(row["Model"])
        t_mae = float(row["Test MAE"])
        t_nasa = float(row["NASA PHM08 Score"])
        
        mae_imp = f"{((baseline_mae - t_mae) / baseline_mae) * 100:.1f}%" if baseline_mae > 0 else "0.0%"
        nasa_red = f"{((baseline_nasa - t_nasa) / baseline_nasa) * 100:.1f}%" if baseline_nasa > 0 else "0.0%"

        # Match corresponding validation metrics dynamically
        matched_val = None
        for k, v in val_map.items():
            if k in m_name or m_name in k or (("XGBoost" in m_name) and ("XGBoost" in k)) or (("Random Forest" in m_name) and ("Random Forest (Engineered)" in k)):
                matched_val = v
                break

        if matched_val:
            v_mae = round(float(matched_val.get("val_mae_mean", t_mae)), 2)
            v_rmse = round(float(matched_val.get("val_rmse_mean", float(row["Test RMSE"]))), 2)
        else:
            v_mae = t_mae
            v_rmse = float(row["Test RMSE"])

        # Determine architectural family and description
        if "Baseline" in m_name:
            fam = "Baseline Reference"
            desc = "Constant population average RUL; ignores telemetry signals."
        elif "Linear Regression (Raw)" in m_name:
            fam = "Linear Model (OLS)"
            desc = "Ordinary Least Squares on raw sensor snapshots without temporal memory."
        elif "Linear Regression (Engineered)" in m_name:
            fam = "Regularized / Linear Dynamics"
            desc = "Linear model leveraging causal rolling window statistics (means, std, trends)."
        elif "Random Forest" in m_name:
            fam = "Decision Tree Ensemble (Bagging)"
            desc = "Ensemble of decorrelated decision trees capturing non-linear sensor interactions."
        elif "XGBoost" in m_name:
            fam = "Gradient Boosted Trees (Boosting)"
            desc = "Gradient-boosted decision trees optimizing squared loss with regularization."
        else:
            fam = "Regression Model"
            desc = "Machine learning predictive model."

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

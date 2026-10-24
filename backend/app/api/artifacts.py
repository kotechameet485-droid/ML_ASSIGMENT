"""
Artifacts and System Health API router for EngineMind 2.0.
Verifies file provenance, ML pipeline artifacts, and system health.
"""

import sys
import platform
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from backend.app.schemas.models import ArtifactStatusItem

router = APIRouter(prefix="/api/artifacts", tags=["Artifacts & Health"])


@router.get("/status", response_model=List[ArtifactStatusItem])
def get_artifacts_status():
    """Audits the existence and validity of all project pipeline artifacts."""
    target_artifacts = [
        ("NASA C-MAPSS FD001 Dataset", "data/train_FD001.txt", "Primary modeling training set (100 engines)"),
        ("NASA C-MAPSS FD001 Test Set", "data/test_FD001.txt", "Official blind trajectories (100 engines)"),
        ("NASA C-MAPSS FD001 Ground Truth RUL", "data/RUL_FD001.txt", "Official ground-truth terminal RUL labels"),
        ("NASA C-MAPSS FD002 Dataset", "data/train_FD002.txt", "Multi-condition 6-setting training set (260 engines)"),
        ("NASA C-MAPSS FD003 Dataset", "data/train_FD003.txt", "Two-fault-mode training set (100 engines)"),
        ("NASA C-MAPSS FD004 Dataset", "data/train_FD004.txt", "Multi-condition multi-fault training set (249 engines)"),
        ("Serialized ML Pipeline", "models/best_model.joblib", "Winning Tuned XGBoost Pipeline with Preprocessor"),
        ("Test Benchmark Metrics", "results/metrics/all_models_test_comparison.csv", "Comparative test evaluation across 4 candidate models"),
        ("Validation 5-Fold CV Metrics", "results/metrics/validation_metrics.csv", "GroupKFold cross-validation results"),
        ("Hyperparameter Tuning Log", "results/metrics/tuning_results.json", "RandomizedSearchCV search history & best parameters"),
        ("Per-Engine Test Predictions", "results/metrics/per_engine_predictions.csv", "Engine-level residuals and classification"),
        ("Global Feature Importances", "results/metrics/feature_importances.csv", "Engineered feature gain rankings"),
        ("SHAP Summary Plot", "results/figures/shap_summary.png", "Beeswarm plot of feature impact on RUL predictions"),
        ("Residual Distribution Plot", "results/figures/residual_distribution.png", "Error frequency distribution vs zero line"),
        ("Actual vs Predicted Plot", "results/figures/actual_vs_predicted.png", "Scatter plot against ideal 45-degree parity line"),
        ("Degradation Trajectories Plot", "results/figures/sensor_trends_representative_engines.png", "Raw telemetry degradation patterns over cycle life")
    ]

    results = []
    for name, rel_path, desc in target_artifacts:
        full_path = WORKSPACE_ROOT / rel_path
        results.append(ArtifactStatusItem(
            name=name,
            path=rel_path,
            exists=full_path.exists(),
            description=desc
        ))

    return results


@router.get("/health")
def health_check() -> Dict[str, Any]:
    """Returns application health, liveness, dataset status, and inference readiness."""
    model_path = WORKSPACE_ROOT / "models" / "best_model.joblib"
    data_path = WORKSPACE_ROOT / "data" / "train_FD001.txt"
    test_data_path = WORKSPACE_ROOT / "data" / "test_FD001.txt"
    
    model_artifact_exists = model_path.exists()
    dataset_exists = data_path.exists()
    inference_ready = model_artifact_exists and test_data_path.exists()

    # Check memory load state without forcing cold load
    from backend.app.api import predictions
    in_memory = predictions._predictor is not None

    status_str = "healthy" if (dataset_exists and model_artifact_exists) else "degraded"

    return {
        "status": status_str,
        "api_live": True,
        "dataset_available": dataset_exists,
        "model_artifact_available": model_artifact_exists,
        "model_loaded_in_memory": in_memory,
        "inference_ready": inference_ready,
        "service": "EngineMind 2.0 Analytical API",
        "version": "2.0.0",
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "workspace_root": str(WORKSPACE_ROOT),
        "model_loaded": model_artifact_exists,
        "model_file_size_bytes": model_path.stat().st_size if model_artifact_exists else 0,
        "timestamp": datetime.now().isoformat()
    }

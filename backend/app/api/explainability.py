"""
Explainability API router for EngineMind 2.0.
Provides feature importances, SHAP insights, and sensor physical metadata.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from src.data_loader import SENSOR_METADATA
from backend.app.schemas.models import FeatureImportanceItem, SensorMetadataItem

router = APIRouter(prefix="/api/explainability", tags=["Explainability"])


@router.get("/features", response_model=List[FeatureImportanceItem])
def get_feature_importances(limit: int = Query(20, ge=1, le=100)):

    """Returns top N global feature importances from the trained winning model."""
    fi_file = WORKSPACE_ROOT / "results" / "metrics" / "feature_importances.csv"
    if not fi_file.exists():
        raise HTTPException(status_code=404, detail="Feature importances file not found.")

    df = pd.read_csv(fi_file)
    top_df = df.head(limit)
    
    results = []
    for idx, row in top_df.iterrows():
        results.append(FeatureImportanceItem(
            rank=int(idx + 1),
            feature=str(row["feature"]),
            importance=round(float(row["importance"]), 4),
            physical_description=str(row.get("physical_description", "Turbofan Telemetry"))
        ))

    return results


@router.get("/sensors", response_model=List[SensorMetadataItem])
def get_sensor_catalog():
    """Returns physical specifications and sensor descriptions for all 21 sensors."""
    results = []
    for s_id, s_info in SENSOR_METADATA.items():
        results.append(SensorMetadataItem(
            sensor_id=s_id,
            description=s_info["desc"],
            unit=s_info["unit"],
            constant_in_fd001=bool(s_info.get("constant_in_fd001", False))
        ))

    return results

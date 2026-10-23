"""
Datasets API router for EngineMind 2.0.
"""

import sys
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

# Ensure workspace root is in sys.path to import src modules
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from src.data_loader import (
    load_raw_dataset,
    get_available_subsets,
    SUBSET_CATALOG,
    SENSOR_METADATA,
    INDEX_COLUMNS,
    SETTING_COLUMNS,
    SENSOR_COLUMNS
)
from backend.app.schemas.models import DatasetOverview, EngineSummary

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])


@router.get("", response_model=List[dict])
def list_datasets():
    """Returns catalog of all available C-MAPSS subsets with metadata."""
    available = get_available_subsets()
    result = []
    for s in ["FD001", "FD002", "FD003", "FD004"]:
        meta = SUBSET_CATALOG.get(s, {})
        result.append({
            "subset": s,
            "is_available": s in available,
            "conditions": meta.get("conditions", ""),
            "fault_modes": meta.get("fault_modes", ""),
            "train_engines": meta.get("train_engines", 0),
            "test_engines": meta.get("test_engines", 0),
            "has_trained_model": meta.get("has_trained_model", False),
            "model_status": meta.get("model_status", ""),
            "description": meta.get("description", "")
        })
    return result


@router.get("/{subset}/overview", response_model=DatasetOverview)
def get_dataset_overview(subset: str):
    """Calculates dataset summary metrics dynamically from the raw files."""
    if subset not in SUBSET_CATALOG:
        raise HTTPException(status_code=404, detail=f"Subset {subset} not recognized.")
        
    try:
        train_df, test_df, rul_df = load_raw_dataset(subset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset files for {subset}: {str(e)}")
        
    meta = SUBSET_CATALOG[subset]
    train_max = train_df.groupby("engine_id")["cycle"].max()
    
    return DatasetOverview(
        subset=subset,
        conditions=meta["conditions"],
        fault_modes=meta["fault_modes"],
        train_engines=int(train_df["engine_id"].nunique()),
        test_engines=int(test_df["engine_id"].nunique()),
        train_observations=int(len(train_df)),
        test_observations=int(len(test_df)),
        sensor_count=21,
        operating_settings_count=3,
        missing_values=int(train_df.isnull().sum().sum()),
        duplicate_cycles=int(train_df.duplicated(subset=["engine_id", "cycle"]).sum()),
        train_lifespan_min=int(train_max.min()),
        train_lifespan_max=int(train_max.max()),
        train_lifespan_mean=round(float(train_max.mean()), 1),
        has_trained_model=meta["has_trained_model"],
        model_status=meta["model_status"],
        description=meta["description"]
    )


@router.get("/{subset}/engines")
def list_engines(subset: str, partition: str = Query("test", pattern="^(train|test)$")):
    """Returns engine IDs and observed cycle counts for the given partition."""
    try:
        train_df, test_df, rul_df = load_raw_dataset(subset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading {subset}: {str(e)}")
        
    target_df = test_df if partition == "test" else train_df
    grouped = target_df.groupby("engine_id")["cycle"].agg(["min", "max", "count"]).reset_index()
    
    result = []
    for _, row in grouped.iterrows():
        eid = int(row["engine_id"])
        item = {
            "engine_id": eid,
            "min_cycle": int(row["min"]),
            "max_cycle": int(row["max"]),
            "total_cycles": int(row["count"])
        }
        if partition == "test" and eid <= len(rul_df):
            item["ground_truth_rul"] = float(rul_df.iloc[eid - 1]["true_rul"])
        result.append(item)
        
    return {"subset": subset, "partition": partition, "total_engines": len(result), "engines": result}


@router.get("/{subset}/engines/{engine_id}/telemetry")
def get_engine_telemetry(
    subset: str,
    engine_id: int,
    partition: str = Query("test", pattern="^(train|test)$"),
    min_cycle: Optional[int] = None,
    max_cycle: Optional[int] = None
):
    """Returns time-series telemetry records for a single engine."""
    try:
        train_df, test_df, rul_df = load_raw_dataset(subset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading {subset}: {str(e)}")
        
    target_df = test_df if partition == "test" else train_df
    eng_df = target_df[target_df["engine_id"] == engine_id].sort_values("cycle")
    
    if eng_df.empty:
        raise HTTPException(status_code=404, detail=f"Engine {engine_id} not found in {subset} {partition} partition.")
        
    if min_cycle is not None:
        eng_df = eng_df[eng_df["cycle"] >= min_cycle]
    if max_cycle is not None:
        eng_df = eng_df[eng_df["cycle"] <= max_cycle]
        
    records = eng_df.to_dict(orient="records")
    
    # Ground truth for test engine
    gt_rul = None
    if partition == "test" and engine_id <= len(rul_df):
        gt_rul = float(rul_df.iloc[engine_id - 1]["true_rul"])
        
    return {
        "engine_id": engine_id,
        "subset": subset,
        "partition": partition,
        "ground_truth_rul": gt_rul,
        "record_count": len(records),
        "telemetry": records
    }

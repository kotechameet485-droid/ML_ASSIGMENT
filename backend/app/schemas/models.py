"""
Pydantic schemas for EngineMind 2.0 API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DatasetOverview(BaseModel):
    subset: str
    conditions: str
    fault_modes: str
    train_engines: int
    test_engines: int
    train_observations: int
    test_observations: int
    sensor_count: int
    operating_settings_count: int
    missing_values: int
    duplicate_cycles: int
    train_lifespan_min: int
    train_lifespan_max: int
    train_lifespan_mean: float
    has_trained_model: bool
    model_status: str
    description: str


class EngineSummary(BaseModel):
    engine_id: int
    subset: str
    partition: str
    observed_cycles: int
    first_cycle: int
    last_cycle: int
    ground_truth_rul: Optional[float] = None
    predicted_rul: Optional[float] = None
    priority_category: Optional[str] = None


class TelemetryRow(BaseModel):
    cycle: int
    setting_1: float
    setting_2: float
    setting_3: float
    sensors: Dict[str, float]


class PredictionResult(BaseModel):
    engine_id: int
    subset: str
    terminal_cycle: int
    predicted_rul: float
    margin_of_error: float
    priority_category: str
    recommended_action: str
    model_name: str
    ground_truth_rul: Optional[float] = None
    residual: Optional[float] = None
    timestamp: str


class FleetPriorityItem(BaseModel):
    engine_id: int
    terminal_cycle: int
    predicted_rul: float
    priority_category: str
    recommended_action: str
    ground_truth_rul: Optional[float] = None
    residual: Optional[float] = None


class BenchmarkItem(BaseModel):
    model: str
    feature_set: str
    test_mae: float
    test_rmse: float
    test_r2: float
    nasa_score: float
    mae_improvement_pct: Optional[str] = None
    nasa_reduction_pct: Optional[str] = None
    val_mae_mean: Optional[float] = None
    val_rmse_mean: Optional[float] = None
    algorithm_family: Optional[str] = None
    description: Optional[str] = None



class ValidationItem(BaseModel):
    model_name: str
    feature_set: str
    val_mae_mean: float
    val_mae_std: float
    val_rmse_mean: float
    val_rmse_std: float
    val_r2_mean: float
    fit_time_sec: float
    limitations: str


class FeatureImportanceItem(BaseModel):
    rank: int
    feature: str
    importance: float
    physical_description: str


class SensorMetadataItem(BaseModel):
    sensor_id: str
    description: str
    unit: str
    constant_in_fd001: bool


class ErrorEngineItem(BaseModel):
    engine_id: int
    last_observed_cycle: int
    true_rul: float
    predicted_rul: float
    residual: float
    absolute_error: float
    error_type: str


class ArtifactStatusItem(BaseModel):
    name: str
    path: str
    exists: bool
    description: str

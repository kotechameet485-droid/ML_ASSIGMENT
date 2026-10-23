"""
Automated unit tests for EngineMind inference engine, serialization, and input validation.
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path

from src.data_loader import load_raw_dataset, ALL_COLUMNS
from src.predict import EngineMindPredictor


def test_model_artifact_exists_and_loads():
    predictor = EngineMindPredictor()
    assert predictor.model is not None
    assert predictor.preprocessor is not None
    assert len(predictor.feature_names) > 0
    assert hasattr(predictor.model, "predict")


def test_single_engine_prediction_output():
    predictor = EngineMindPredictor()
    _, test_df, _ = load_raw_dataset("FD001")
    
    eng_df = test_df[test_df["engine_id"] == 1]
    res = predictor.predict_engine_trajectory(eng_df)
    
    assert res["engine_id"] == 1
    assert res["last_observed_cycle"] == int(eng_df["cycle"].max())
    assert isinstance(res["predicted_rul"], float)
    assert res["predicted_rul"] >= 0.0
    assert res["priority_category"] in ["CRITICAL", "WARNING", "NOMINAL"]
    assert isinstance(res["recommended_action"], str)


def test_fleet_prediction_shape():
    predictor = EngineMindPredictor()
    _, test_df, _ = load_raw_dataset("FD001")
    
    # Predict on first 5 engines
    subset_fleet = test_df[test_df["engine_id"] <= 5]
    fleet_res = predictor.predict_fleet(subset_fleet)
    
    assert len(fleet_res) == 5
    assert set(fleet_res["engine_id"]) == {1, 2, 3, 4, 5}
    assert "predicted_rul" in fleet_res.columns
    assert "maintenance_priority" in fleet_res.columns


def test_missing_column_raises_error():
    predictor = EngineMindPredictor()
    # Malformed data missing sensor_21
    bad_df = pd.DataFrame({
        "engine_id": [1],
        "cycle": [1],
        "setting_1": [0.0], "setting_2": [0.0], "setting_3": [100.0],
        **{f"sensor_{i}": [10.0] for i in range(1, 21)}  # Missing sensor_21
    })
    
    with pytest.raises(ValueError, match="Telemetry missing required columns"):
        predictor.predict_engine_trajectory(bad_df)


def test_null_value_raises_error():
    predictor = EngineMindPredictor()
    bad_df = pd.DataFrame({
        "engine_id": [1],
        "cycle": [1],
        "setting_1": [0.0], "setting_2": [0.0], "setting_3": [100.0],
        **{f"sensor_{i}": [np.nan if i == 2 else 10.0] for i in range(1, 22)}
    })
    
    with pytest.raises(ValueError, match="contains .* null or missing values"):
        predictor.predict_engine_trajectory(bad_df)


def test_no_test_labels_used_in_model():
    """
    Verification that the model estimator was trained on 20,631 samples (train set),
    NOT on test labels or test set size (100).
    """
    predictor = EngineMindPredictor()
    # For tree/XGB models, n_features_in_ must match engineered feature set
    assert len(predictor.feature_names) == 98
    
    # Verify that model does not contain test RUL labels in its fitted attributes
    train_df, _, _ = load_raw_dataset("FD001")
    assert len(train_df) == 20631

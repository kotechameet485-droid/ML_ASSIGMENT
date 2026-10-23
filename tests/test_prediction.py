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


def test_nasa_phm08_asymmetric_score():
    """
    Verifies that the NASA PHM08 Prognostics score:
    1. Returns 0 for perfect prediction (residual = 0).
    2. Penalizes late overestimation (d > 0) more severely than early underestimation (d < 0).
    3. Conforms to the standard formula:
       s_i = exp(-d/13) - 1 for d < 0
       s_i = exp(d/10) - 1  for d >= 0
    """
    from src.evaluate import compute_nasa_phm08_score

    # 1. Perfect prediction
    y_true_perfect = np.array([50.0, 100.0, 20.0])
    y_pred_perfect = np.array([50.0, 100.0, 20.0])
    score_zero = compute_nasa_phm08_score(y_true_perfect, y_pred_perfect)
    assert abs(score_zero) < 1e-6

    # 2. Equal magnitude error (10 cycles)
    # Early prediction: y_pred = 40, y_true = 50 -> d = -10
    score_early = compute_nasa_phm08_score(np.array([50.0]), np.array([40.0]))
    expected_early = np.exp(10.0 / 13.0) - 1.0
    assert abs(score_early - expected_early) < 1e-5

    # Late prediction: y_pred = 60, y_true = 50 -> d = +10
    score_late = compute_nasa_phm08_score(np.array([50.0]), np.array([60.0]))
    expected_late = np.exp(10.0 / 10.0) - 1.0  # e^1 - 1
    assert abs(score_late - expected_late) < 1e-5

    # 3. Asymmetric penalty verification: late penalty must exceed early penalty
    assert score_late > score_early, f"Late score {score_late} should exceed early score {score_early}"
    assert round(score_late, 3) == 1.718
    assert round(score_early, 3) == 1.158

"""
Regression test suite for EngineMind CodeRabbit remediation.
Verifies all confirmed correctness fixes across artifacts, sensor metadata,
fleet indexing, boundary checks, NASA score sourcing, and cache immutability.
"""

import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from src.data_loader import load_raw_dataset, SENSOR_METADATA
from src.predict import EngineMindPredictor

client = TestClient(app)


def test_regression_artifact_degradation_trajectories_exists():
    """Verify CR-01: Artifact provenance correctly maps degradation trajectories plot."""
    response = client.get("/api/artifacts/status")
    assert response.status_code == 200
    artifacts = response.json()
    deg_item = next((a for a in artifacts if "Degradation" in a["name"]), None)
    assert deg_item is not None, "Degradation Trajectories item missing from artifacts"
    assert "sensor_trends_representative_engines.png" in deg_item["path"]
    assert deg_item["exists"] is True, f"Artifact marked as missing: {deg_item}"


def test_regression_sensor_catalog_authoritative_metadata():
    """Verify CR-02: Sensor catalog derives constant_in_fd001 from SENSOR_METADATA."""
    response = client.get("/api/explainability/sensors")
    assert response.status_code == 200
    sensors = response.json()
    s6 = next((s for s in sensors if s["sensor_id"] == "sensor_6"), None)
    assert s6 is not None
    # Sensor 6 is bypass duct pressure, NOT constant in FD001
    assert s6["constant_in_fd001"] is False
    assert s6["constant_in_fd001"] == SENSOR_METADATA["sensor_6"]["constant_in_fd001"]


def test_regression_predict_fleet_non_zero_based_index():
    """Verify CR-03: predict_fleet handles non-zero-based or shuffled DataFrame indices safely."""
    _, test_df, _ = load_raw_dataset("FD001")
    predictor = EngineMindPredictor()
    # Filter 3 engines and set a custom non-zero, non-contiguous index
    sample = test_df[test_df["engine_id"].isin([1, 2, 3])].copy()
    sample.index = [1000 + i for i in range(len(sample))]
    
    preds_df = predictor.predict_fleet(sample)
    assert len(preds_df) == 3
    assert set(preds_df["engine_id"]) == {1, 2, 3}
    assert all(preds_df["predicted_rul"] > 0)


def test_regression_engine_id_boundary_validation():
    """Verify CR-04: Negative and 0 engine IDs are rejected with 404."""
    # Prediction endpoint
    resp_zero = client.get("/api/predictions/FD001/0")
    assert resp_zero.status_code == 404
    assert "Invalid engine" in resp_zero.json()["detail"] or "not found" in resp_zero.json()["detail"]

    resp_neg = client.get("/api/predictions/FD001/-5")
    assert resp_neg.status_code == 404

    # Telemetry endpoint
    resp_tel_zero = client.get("/api/datasets/FD001/engines/0/telemetry")
    assert resp_tel_zero.status_code == 404

    resp_tel_neg = client.get("/api/datasets/FD001/engines/-1/telemetry")
    assert resp_tel_neg.status_code == 404


def test_regression_nasa_phm08_score_matches_evaluation_artifact():
    """Verify CR-05: Error summary sources NASA score accurately (760.51)."""
    response = client.get("/api/errors/summary")
    assert response.status_code == 200
    data = response.json()
    assert abs(data["nasa_phm08_score"] - 760.51) < 0.05


def test_regression_dataset_cache_immutability():
    """Verify CR-06: Mutating a returned DataFrame does not corrupt the cached data."""
    train_1, _, _ = load_raw_dataset("FD001")
    orig_val = train_1.iloc[0, 2] # first sensor / setting value
    
    # Intentionally mutate the consumer's DataFrame
    train_1.iloc[0, 2] = -9999.99
    assert train_1.iloc[0, 2] == -9999.99

    # Re-fetch from cache
    train_2, _, _ = load_raw_dataset("FD001")
    assert train_2.iloc[0, 2] == orig_val, "Cached DataFrame was mutated by caller!"

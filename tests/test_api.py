"""
Test suite for EngineMind 2.0 FastAPI endpoints.
Tests datasets, predictions, benchmarks, explainability, errors, and health endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["version"] == "2.0.0"


def test_list_datasets():
    response = client.get("/api/datasets")
    assert response.status_code == 200
    subsets = response.json()
    assert len(subsets) == 4
    names = [s["subset"] for s in subsets]
    assert "FD001" in names
    assert "FD004" in names


def test_dataset_overview_fd001():
    response = client.get("/api/datasets/FD001/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["subset"] == "FD001"
    assert data["train_engines"] == 100
    assert data["test_engines"] == 100
    assert data["sensor_count"] == 21
    assert data["has_trained_model"] is True


def test_dataset_overview_invalid():
    response = client.get("/api/datasets/FD999/overview")
    assert response.status_code == 404


def test_list_engines():
    response = client.get("/api/datasets/FD001/engines?partition=test")
    assert response.status_code == 200
    data = response.json()
    assert data["total_engines"] == 100
    assert len(data["engines"]) == 100
    assert data["engines"][0]["engine_id"] == 1
    assert "ground_truth_rul" in data["engines"][0]


def test_engine_telemetry():
    response = client.get("/api/datasets/FD001/engines/1/telemetry?partition=test")
    assert response.status_code == 200
    data = response.json()
    assert data["engine_id"] == 1
    assert data["record_count"] == 31
    assert len(data["telemetry"]) == 31


def test_predict_fd001_engine():
    response = client.get("/api/predictions/FD001/1?critical_threshold=25&warning_threshold=60")
    assert response.status_code == 200
    data = response.json()
    assert data["engine_id"] == 1
    assert data["subset"] == "FD001"
    assert data["predicted_rul"] > 0
    assert data["priority_category"] in ["CRITICAL", "WARNING", "NOMINAL"]
    assert data["ground_truth_rul"] == 112.0
    assert data["residual"] is not None


def test_predict_unsupported_subset():
    response = client.get("/api/predictions/FD002/1")
    assert response.status_code == 400
    assert "exploration only" in response.json()["detail"].lower()


def test_fleet_priority_queue():
    response = client.get("/api/predictions/fleet/queue/FD001")
    assert response.status_code == 200
    queue = response.json()
    assert len(queue) == 100
    # verify queue is sorted ascending by predicted RUL
    for i in range(len(queue) - 1):
        assert queue[i]["predicted_rul"] <= queue[i + 1]["predicted_rul"]


def test_test_benchmarks():
    response = client.get("/api/benchmarks/test")
    assert response.status_code == 200
    benchmarks = response.json()
    assert len(benchmarks) >= 4
    models = [b["model"] for b in benchmarks]
    assert any("Baseline" in m for m in models)
    assert any("XGBoost" in m for m in models)


def test_validation_benchmarks():
    response = client.get("/api/benchmarks/validation")
    assert response.status_code == 200
    val = response.json()
    assert len(val) >= 4


def test_feature_importances():
    response = client.get("/api/explainability/features?limit=10")
    assert response.status_code == 200
    features = response.json()
    assert len(features) == 10
    assert features[0]["rank"] == 1
    assert features[0]["importance"] > 0


def test_sensor_catalog():
    response = client.get("/api/explainability/sensors")
    assert response.status_code == 200
    sensors = response.json()
    assert len(sensors) == 21


def test_error_summary():
    response = client.get("/api/errors/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_engines_evaluated"] == 100
    assert summary["mae"] == pytest.approx(13.94, abs=0.05)
    assert summary["overestimated_count"] + summary["underestimated_count"] == 100


def test_artifacts_status():
    response = client.get("/api/artifacts/status")
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 10
    # Core items must exist
    for it in items:
        if "best_model.joblib" in it["path"] or "train_FD001.txt" in it["path"]:
            assert it["exists"] is True


def test_predict_threshold_order_validation():
    """Verify that critical_threshold >= warning_threshold is rejected with 422."""
    response = client.get("/api/predictions/FD001/1?critical_threshold=60&warning_threshold=25")
    assert response.status_code == 422
    assert "critical_threshold" in response.json()["detail"].lower()


def test_fleet_queue_threshold_order_validation():
    """Verify that fleet queue validates critical_threshold < warning_threshold."""
    response = client.get("/api/predictions/fleet/queue/FD001?critical_threshold=50&warning_threshold=30")
    assert response.status_code == 422
    assert "critical_threshold" in response.json()["detail"].lower()


def test_predict_contains_test_mae_reference_cycles():
    """Verify prediction response includes verified reference test MAE and not calibrated interval."""
    response = client.get("/api/predictions/FD001/1")
    assert response.status_code == 200
    data = response.json()
    assert "test_mae_reference_cycles" in data
    assert abs(data["test_mae_reference_cycles"] - 13.94) < 0.1


def test_api_health_readiness_fields():
    """Verify health endpoint distinguishes liveness, dataset, artifact, and inference readiness."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["api_live"] is True
    assert data["dataset_available"] is True
    assert data["model_artifact_available"] is True
    assert data["inference_ready"] is True
    assert "status" in data

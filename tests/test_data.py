"""
Automated unit and integration tests for EngineMind data loading and validation.
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path

from src.data_loader import (
    load_raw_dataset,
    validate_dataset,
    resolve_data_directory,
    ALL_COLUMNS,
    INDEX_COLUMNS,
    SETTING_COLUMNS,
    SENSOR_COLUMNS
)


def test_resolve_data_directory():
    data_dir = resolve_data_directory()
    assert data_dir.exists()
    assert (data_dir / "train_FD001.txt").exists()
    assert (data_dir / "test_FD001.txt").exists()
    assert (data_dir / "RUL_FD001.txt").exists()


def test_load_raw_dataset_shapes_and_types():
    train_df, test_df, rul_df = load_raw_dataset("FD001")
    
    assert train_df.shape == (20631, 26)
    assert test_df.shape == (13096, 26)
    assert rul_df.shape == (100, 1)
    
    assert list(train_df.columns) == ALL_COLUMNS
    assert list(test_df.columns) == ALL_COLUMNS
    
    # Assert all columns are numeric
    for col in ALL_COLUMNS:
        assert np.issubdtype(train_df[col].dtype, np.number)
        assert np.issubdtype(test_df[col].dtype, np.number)


def test_no_null_or_missing_values():
    train_df, test_df, rul_df = load_raw_dataset("FD001")
    assert train_df.isnull().sum().sum() == 0
    assert test_df.isnull().sum().sum() == 0
    assert rul_df.isnull().sum().sum() == 0


def test_engine_counts_and_cycles():
    train_df, test_df, rul_df = load_raw_dataset("FD001")
    
    assert train_df["engine_id"].nunique() == 100
    assert test_df["engine_id"].nunique() == 100
    assert len(rul_df) == 100
    
    # Check monotonicity of cycles
    for _, grp in train_df.groupby("engine_id"):
        assert grp["cycle"].is_monotonic_increasing
        assert grp["cycle"].diff().dropna().eq(1).all()


def test_dataset_validation_report_structure():
    train_df, test_df, rul_df = load_raw_dataset("FD001")
    report = validate_dataset(train_df, test_df, rul_df)
    
    assert report["train_missing_values"] == 0
    assert report["test_missing_values"] == 0
    assert report["train_cycles_strictly_sequential"] is True
    assert report["test_cycles_strictly_sequential"] is True
    assert report["rul_alignment_valid"] is True
    assert len(report["constant_sensors"]) >= 6


def test_available_subsets_and_catalog():
    from src.data_loader import get_available_subsets, SUBSET_CATALOG
    subsets = get_available_subsets()
    assert "FD001" in subsets
    assert "FD002" in subsets
    assert "FD003" in subsets
    assert "FD004" in subsets
    assert len(SUBSET_CATALOG) == 4
    assert SUBSET_CATALOG["FD001"]["has_trained_model"] is True
    assert SUBSET_CATALOG["FD002"]["has_trained_model"] is False

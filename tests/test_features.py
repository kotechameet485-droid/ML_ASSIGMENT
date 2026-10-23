"""
Automated unit tests for EngineMind feature engineering, RUL generation,
and causal temporal integrity.
"""

import pytest
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

from src.preprocessing import add_rul_labels, DEFAULT_DROP_COLUMNS
from src.feature_engineering import build_engineered_features, prepare_feature_matrices


def test_rul_label_generation_logic():
    # Synthetic trajectory fixture: 2 engines with known cycles
    synthetic_data = pd.DataFrame({
        "engine_id": [1, 1, 1, 2, 2],
        "cycle": [1, 2, 3, 1, 2],
        "setting_1": [0.0]*5, "setting_2": [0.0]*5, "setting_3": [100.0]*5,
        **{f"sensor_{i}": [10.0 + i]*5 for i in range(1, 22)}
    })
    
    labeled = add_rul_labels(synthetic_data, clip_threshold=None)
    
    # Engine 1 max cycle is 3: RUL should be 2, 1, 0
    e1_rul = labeled[labeled["engine_id"] == 1]["RUL"].tolist()
    assert e1_rul == [2, 1, 0]
    
    # Engine 2 max cycle is 2: RUL should be 1, 0
    e2_rul = labeled[labeled["engine_id"] == 2]["RUL"].tolist()
    assert e2_rul == [1, 0]


def test_rul_clipping_behavior():
    synthetic_data = pd.DataFrame({
        "engine_id": [1, 1, 1, 1],
        "cycle": [1, 2, 3, 4],  # Max cycle is 4 -> unclipped RUL is 3, 2, 1, 0
        "setting_1": [0.0]*4, "setting_2": [0.0]*4, "setting_3": [100.0]*4,
        **{f"sensor_{i}": [10.0]*4 for i in range(1, 22)}
    })
    
    clipped = add_rul_labels(synthetic_data, clip_threshold=1.5)
    ruls = clipped["RUL"].tolist()
    # 3 clipped to 1.5, 2 clipped to 1.5, 1 stays 1, 0 stays 0
    assert ruls == [1.5, 1.5, 1.0, 0.0]


def test_no_future_leakage_in_rolling_features():
    """
    CRITICAL TEST: Verifies that future cycles do NOT alter features of past cycles.
    If we compute rolling features on cycles 1..10, then add cycles 11..20,
    the computed features for cycles 1..10 MUST REMAIN EXACTLY IDENTICAL.
    """
    np.random.seed(42)
    cycles_1_to_10 = pd.DataFrame({
        "engine_id": [1] * 10,
        "cycle": list(range(1, 11)),
        "setting_1": [0.0]*10, "setting_2": [0.0]*10, "setting_3": [100.0]*10,
        **{f"sensor_{i}": np.random.randn(10) for i in range(1, 22)}
    })
    
    cycles_1_to_20 = pd.DataFrame({
        "engine_id": [1] * 20,
        "cycle": list(range(1, 21)),
        "setting_1": [0.0]*20, "setting_2": [0.0]*20, "setting_3": [100.0]*20,
        **{f"sensor_{i}": np.concatenate([cycles_1_to_10[f"sensor_{i}"].values, np.random.randn(10)]) for i in range(1, 22)}
    })
    
    feat_10 = build_engineered_features(cycles_1_to_10, window_sizes=[5])
    feat_20 = build_engineered_features(cycles_1_to_20, window_sizes=[5])
    
    # Check that for the first 10 cycles, all engineered features are identical
    cols_to_check = [c for c in feat_10.columns if "roll" in c or "trend" in c]
    for col in cols_to_check:
        np.testing.assert_allclose(
            feat_10[col].values,
            feat_20[col].iloc[:10].values,
            err_msg=f"Future leakage detected in feature: {col}!"
        )


def test_engine_level_group_separation():
    """
    Verifies that GroupKFold strictly prevents engine trajectory leakage across folds.
    """
    engine_ids = np.repeat(np.arange(1, 101), 20)  # 100 engines, 20 cycles each
    dummy_X = pd.DataFrame({"feat": np.random.randn(len(engine_ids))})
    dummy_y = np.random.randn(len(engine_ids))
    
    gkf = GroupKFold(n_splits=5)
    for fold, (train_idx, val_idx) in enumerate(gkf.split(dummy_X, dummy_y, groups=engine_ids)):
        train_engines = set(engine_ids[train_idx])
        val_engines = set(engine_ids[val_idx])
        
        # Zero intersection of engine IDs
        overlap = train_engines.intersection(val_engines)
        assert len(overlap) == 0, f"Fold {fold} has engine overlap: {overlap}!"

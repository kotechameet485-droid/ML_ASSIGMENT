"""
EngineMind — Feature Engineering Pipeline
Constructs time-aware degradation indicators with strict causal integrity (no future lookahead).
"""

import os
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import numpy as np
import pandas as pd

from src.data_loader import (
    INDEX_COLUMNS,
    SETTING_COLUMNS,
    SENSOR_COLUMNS
)
from src.preprocessing import DEFAULT_DROP_COLUMNS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def extract_base_features(
    df: pd.DataFrame,
    drop_columns: Optional[List[str]] = None
) -> pd.DataFrame:
    """
    Extracts raw informative sensors and active operational settings.
    Excludes constant and uninformative columns.
    """
    drop_cols = drop_columns if drop_columns is not None else DEFAULT_DROP_COLUMNS
    cols_to_keep = [c for c in df.columns if c not in drop_cols]
    return df[cols_to_keep].copy()


def build_engineered_features(
    df: pd.DataFrame,
    window_sizes: List[int] = [5, 15],
    drop_columns: Optional[List[str]] = None,
    include_cycle: bool = True
) -> pd.DataFrame:
    """
    Constructs causal time-series features grouped by engine_id:
    - Strictly backward-looking rolling means (smoothing sensor noise)
    - Strictly backward-looking rolling standard deviations (detecting instability)
    - Trend / instantaneous rate-of-change: current_val - rolling_mean
    
    Guarantees zero future leakage by operating within groupby('engine_id')
    with min_periods=1.
    """
    drop_cols = drop_columns if drop_columns is not None else DEFAULT_DROP_COLUMNS
    active_sensors = [s for s in SENSOR_COLUMNS if s not in drop_cols and s in df.columns]
    
    df_out = df.copy()
    
    # Sort deterministically by engine_id and cycle
    df_out = df_out.sort_values(by=["engine_id", "cycle"]).reset_index(drop=True)
    
    engineered_dfs = [df_out]
    
    for w in window_sizes:
        # Grouped rolling operations ensure no cross-engine contamination
        rolling_grp = df_out.groupby("engine_id")[active_sensors].rolling(window=w, min_periods=1)
        
        # Rolling mean
        roll_mean = rolling_grp.mean().reset_index(level=0, drop=True)
        roll_mean.columns = [f"{col}_roll_mean_{w}" for col in active_sensors]
        
        # Rolling standard deviation (fill NaN with 0 for first observation)
        roll_std = rolling_grp.std().reset_index(level=0, drop=True).fillna(0.0)
        roll_std.columns = [f"{col}_roll_std_{w}" for col in active_sensors]
        
        # Trend / drift from short-term baseline
        trend = (df_out[active_sensors] - roll_mean.values)
        trend.columns = [f"{col}_trend_{w}" for col in active_sensors]
        
        engineered_dfs.extend([roll_mean, roll_std, trend])

    result_df = pd.concat(engineered_dfs, axis=1)
    
    # Drop constant features
    cols_to_drop = [c for c in drop_cols if c in result_df.columns]
    result_df = result_df.drop(columns=cols_to_drop, errors="ignore")
    
    logger.info(f"Engineered feature set generated with {result_df.shape[1]} total columns.")
    return result_df


def prepare_feature_matrices(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    use_engineered_features: bool = True,
    window_sizes: List[int] = [5, 15]
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Constructs unified feature sets for both training and test trajectories,
    ensuring identical feature names and ordering.
    """
    if use_engineered_features:
        logger.info("Building engineered feature matrices (rolling means, std, trends)...")
        train_feat = build_engineered_features(train_df, window_sizes=window_sizes)
        test_feat = build_engineered_features(test_df, window_sizes=window_sizes)
    else:
        logger.info("Building baseline raw feature matrices...")
        train_feat = extract_base_features(train_df)
        test_feat = extract_base_features(test_df)

    # Verify column parity
    train_cols = [c for c in train_feat.columns if c not in ["RUL", "RUL_uncapped"]]
    test_cols = list(test_feat.columns)
    
    if set(train_cols) != set(test_cols):
        raise ValueError("Mismatch between train and test feature columns!")
        
    # Standardize column order
    test_feat = test_feat[train_cols]
    
    return train_feat, test_feat


if __name__ == "__main__":
    from src.data_loader import load_raw_dataset
    tr, te, _ = load_raw_dataset("FD001")
    tr_eng, te_eng = prepare_feature_matrices(tr, te, use_engineered_features=True)
    print("Train engineered shape:", tr_eng.shape)
    print("Test engineered shape:", te_eng.shape)

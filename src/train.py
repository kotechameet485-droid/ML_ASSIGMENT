"""
EngineMind — Leakage-Safe Model Training & Hyperparameter Tuning Pipeline
Implements GroupKFold engine-level cross-validation, multiple model architectures,
hyperparameter optimization, and artifact serialization.
"""

import os
import time
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import GroupKFold, RandomizedSearchCV
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from src.data_loader import load_raw_dataset, INDEX_COLUMNS
from src.preprocessing import add_rul_labels, EngineMindPreprocessor
from src.feature_engineering import prepare_feature_matrices

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


def evaluate_model_cv(
    model_name: str,
    estimator_factory,
    X_df: pd.DataFrame,
    y: np.ndarray,
    groups: np.ndarray,
    n_splits: int = 5,
    clip_threshold: float = 125.0
) -> Dict[str, Any]:
    """
    Evaluates an estimator using GroupKFold cross-validation.
    Crucially fits preprocessing ONLY within each training fold to eliminate data leakage.
    """
    gkf = GroupKFold(n_splits=n_splits)
    
    val_mae_list = []
    val_rmse_list = []
    val_r2_list = []
    train_mae_list = []
    train_rmse_list = []
    train_r2_list = []
    
    start_time = time.time()
    
    for fold, (train_idx, val_idx) in enumerate(gkf.split(X_df, y, groups=groups)):
        X_train_fold, X_val_fold = X_df.iloc[train_idx], X_df.iloc[val_idx]
        y_train_fold, y_val_fold = y[train_idx], y[val_idx]
        
        # Fit preprocessor strictly on training fold
        prep = EngineMindPreprocessor(clip_threshold=clip_threshold)
        X_train_scaled, feat_cols = prep.fit_transform(X_train_fold)
        X_val_scaled, _ = prep.transform(X_val_fold)
        
        # Instantiate and fit model
        model = estimator_factory()
        model.fit(X_train_scaled, y_train_fold)
        
        # Evaluate validation
        y_val_pred = model.predict(X_val_scaled)
        val_mae = mean_absolute_error(y_val_fold, y_val_pred)
        val_rmse = np.sqrt(mean_squared_error(y_val_fold, y_val_pred))
        val_r2 = r2_score(y_val_fold, y_val_pred)
        
        # Evaluate train (overfitting diagnostics)
        y_train_pred = model.predict(X_train_scaled)
        train_mae = mean_absolute_error(y_train_fold, y_train_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train_fold, y_train_pred))
        train_r2 = r2_score(y_train_fold, y_train_pred)
        
        val_mae_list.append(val_mae)
        val_rmse_list.append(val_rmse)
        val_r2_list.append(val_r2)
        train_mae_list.append(train_mae)
        train_rmse_list.append(train_rmse)
        train_r2_list.append(train_r2)
        
    elapsed_sec = time.time() - start_time
    
    return {
        "model_name": model_name,
        "val_mae_mean": float(np.mean(val_mae_list)),
        "val_mae_std": float(np.std(val_mae_list)),
        "val_rmse_mean": float(np.mean(val_rmse_list)),
        "val_rmse_std": float(np.std(val_rmse_list)),
        "val_r2_mean": float(np.mean(val_r2_list)),
        "val_r2_std": float(np.std(val_r2_list)),
        "train_mae_mean": float(np.mean(train_mae_list)),
        "train_rmse_mean": float(np.mean(train_rmse_list)),
        "train_r2_mean": float(np.mean(train_r2_list)),
        "training_time_sec": round(elapsed_sec, 2)
    }


def tune_random_forest(
    X_train_scaled: np.ndarray,
    y_train: np.ndarray,
    groups: np.ndarray,
    n_iter: int = 12
) -> Tuple[RandomForestRegressor, Dict[str, Any]]:
    """
    Optimizes Random Forest hyperparameters using GroupKFold cross-validation.
    """
    logger.info("Starting Random Forest hyperparameter tuning (GroupKFold)...")
    param_dist = {
        "n_estimators": [50, 100, 150],
        "max_depth": [10, 15, 20, None],
        "min_samples_split": [5, 10, 15],
        "min_samples_leaf": [2, 4, 8],
        "max_features": ["sqrt", 0.5, 0.7]
    }
    
    base_rf = RandomForestRegressor(random_state=RANDOM_SEED, n_jobs=-1)
    gkf = GroupKFold(n_splits=4)
    
    search = RandomizedSearchCV(
        base_rf,
        param_distributions=param_dist,
        n_iter=n_iter,
        cv=gkf,
        scoring="neg_root_mean_squared_error",
        random_state=RANDOM_SEED,
        n_jobs=-1,
        verbose=1
    )
    
    search.fit(X_train_scaled, y_train, groups=groups)
    logger.info(f"Best RF params: {search.best_params_} (CV RMSE: {-search.best_score_:.2f})")
    
    return search.best_estimator_, {
        "best_params": search.best_params_,
        "best_cv_rmse": float(-search.best_score_),
        "search_space": {k: [str(x) for x in v] if isinstance(v, list) else v for k, v in param_dist.items()}
    }


def tune_xgboost(
    X_train_scaled: np.ndarray,
    y_train: np.ndarray,
    groups: np.ndarray,
    n_iter: int = 12
) -> Tuple[Any, Dict[str, Any]]:
    """
    Optimizes XGBoost hyperparameters using GroupKFold cross-validation.
    """
    if not HAS_XGBOOST:
        logger.warning("XGBoost not installed; skipping XGBoost tuning.")
        return None, {}
        
    logger.info("Starting XGBoost hyperparameter tuning (GroupKFold)...")
    param_dist = {
        "n_estimators": [60, 100, 140],
        "max_depth": [3, 5, 7],
        "learning_rate": [0.03, 0.07, 0.12],
        "subsample": [0.7, 0.85, 1.0],
        "colsample_bytree": [0.6, 0.8, 1.0],
        "reg_lambda": [1.0, 5.0, 10.0]
    }
    
    base_xgb = xgb.XGBRegressor(
        random_state=RANDOM_SEED,
        n_jobs=-1,
        objective="reg:squarederror"
    )
    gkf = GroupKFold(n_splits=4)
    
    search = RandomizedSearchCV(
        base_xgb,
        param_distributions=param_dist,
        n_iter=n_iter,
        cv=gkf,
        scoring="neg_root_mean_squared_error",
        random_state=RANDOM_SEED,
        n_jobs=-1,
        verbose=1
    )
    
    search.fit(X_train_scaled, y_train, groups=groups)
    logger.info(f"Best XGB params: {search.best_params_} (CV RMSE: {-search.best_score_:.2f})")
    
    return search.best_estimator_, {
        "best_params": search.best_params_,
        "best_cv_rmse": float(-search.best_score_),
        "search_space": {k: [str(x) for x in v] if isinstance(v, list) else v for k, v in param_dist.items()}
    }


def run_training_pipeline(
    clip_threshold: float = 125.0,
    tune_models: bool = True
) -> Dict[str, Any]:
    """
    Executes the complete leakage-safe model training and comparison benchmark:
    1. Loads raw FD001 dataset
    2. Constructs base and engineered feature matrices
    3. Evaluates Model A (Dummy Mean), Model B (Linear Regression),
       Model C (Random Forest), and Model D (XGBoost)
    4. Performs GroupKFold hyperparameter tuning on top models
    5. Retrains best model on full training set with preprocessor
    6. Serializes artifacts to models/ and results/metrics/
    """
    workspace_root = Path(__file__).resolve().parent.parent
    models_dir = workspace_root / "models"
    metrics_dir = workspace_root / "results" / "metrics"
    models_dir.mkdir(parents=True, exist_ok=True)
    metrics_dir.mkdir(parents=True, exist_ok=True)

    logger.info("=== STEP 1: DATA INGESTION & RUL LABELING ===")
    train_df, test_df, rul_df = load_raw_dataset("FD001")
    train_labeled = add_rul_labels(train_df, clip_threshold=clip_threshold)
    
    y = train_labeled["RUL"].values
    groups = train_labeled["engine_id"].values
    
    logger.info("=== STEP 2: CAUSAL FEATURE MATRICES ===")
    train_base, _ = prepare_feature_matrices(train_df, test_df, use_engineered_features=False)
    train_eng, _ = prepare_feature_matrices(train_df, test_df, use_engineered_features=True)
    
    models_to_benchmark = [
        # Model A: Mean-RUL baseline
        {
            "name": "Model A: Mean-RUL Baseline",
            "feature_set": "Raw Features",
            "X_df": train_base,
            "factory": lambda: DummyRegressor(strategy="mean"),
            "limitations": "Zero sensitivity to sensor measurements; predicts constant population average."
        },
        # Model B: Linear Regression (Raw Features)
        {
            "name": "Model B1: Linear Regression (Raw)",
            "feature_set": "Raw Features",
            "X_df": train_base,
            "factory": lambda: Ridge(alpha=10.0, random_state=RANDOM_SEED),
            "limitations": "Assumes strictly linear relationship between sensor readings and degradation."
        },
        # Model B2: Linear Regression (Engineered Features)
        {
            "name": "Model B2: Linear Regression (Engineered)",
            "feature_set": "Engineered Features",
            "X_df": train_eng,
            "factory": lambda: Ridge(alpha=100.0, random_state=RANDOM_SEED),
            "limitations": "Linear combination of rolling statistics; cannot capture complex multi-sensor nonlinear bifurcations."
        },
        # Model C1: Random Forest (Raw Features)
        {
            "name": "Model C1: Random Forest (Raw)",
            "feature_set": "Raw Features",
            "X_df": train_base,
            "factory": lambda: RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_leaf=4, random_state=RANDOM_SEED, n_jobs=-1),
            "limitations": "Captures sensor interactions but lacks temporal smoothing from rolling dynamics."
        },
        # Model C2: Random Forest (Engineered Features)
        {
            "name": "Model C2: Random Forest (Engineered)",
            "feature_set": "Engineered Features",
            "X_df": train_eng,
            "factory": lambda: RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_leaf=4, random_state=RANDOM_SEED, n_jobs=-1),
            "limitations": "Ensemble of decision trees; piecewise constant step predictions, computationally heavier."
        }
    ]
    
    if HAS_XGBOOST:
        models_to_benchmark.extend([
            {
                "name": "Model D1: XGBoost (Raw)",
                "feature_set": "Raw Features",
                "X_df": train_base,
                "factory": lambda: xgb.XGBRegressor(n_estimators=80, max_depth=4, learning_rate=0.08, subsample=0.8, random_state=RANDOM_SEED, n_jobs=-1),
                "limitations": "Gradient-boosted decision trees on raw snapshots; sensitive to sensor noise without rolling features."
            },
            {
                "name": "Model D2: XGBoost (Engineered)",
                "feature_set": "Engineered Features",
                "X_df": train_eng,
                "factory": lambda: xgb.XGBRegressor(n_estimators=80, max_depth=4, learning_rate=0.08, subsample=0.8, colsample_bytree=0.8, random_state=RANDOM_SEED, n_jobs=-1),
                "limitations": "Gradient boosting can overfit near-failure outliers if regularization is insufficient."
            }
        ])

    logger.info("=== STEP 3: LEAKAGE-SAFE ENGINE-LEVEL CROSS-VALIDATION ===")
    results_list = []
    for m in models_to_benchmark:
        logger.info(f"Evaluating {m['name']} with GroupKFold...")
        res = evaluate_model_cv(
            model_name=m["name"],
            estimator_factory=m["factory"],
            X_df=m["X_df"],
            y=y,
            groups=groups,
            n_splits=5,
            clip_threshold=clip_threshold
        )
        res["feature_set"] = m["feature_set"]
        res["limitations"] = m["limitations"]
        results_list.append(res)
        logger.info(f"-> {m['name']}: Val MAE={res['val_mae_mean']:.2f} ± {res['val_mae_std']:.2f}, RMSE={res['val_rmse_mean']:.2f} ± {res['val_rmse_std']:.2f}, R2={res['val_r2_mean']:.3f}")

    # Build comparison DataFrame
    comparison_df = pd.DataFrame(results_list)
    csv_path = metrics_dir / "model_comparison.csv"
    json_path = metrics_dir / "model_comparison.json"
    comparison_df.to_csv(csv_path, index=False)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results_list, f, indent=4)
    logger.info(f"Saved model benchmark results to: {csv_path} and {json_path}")

    # Step 4: Hyperparameter Tuning
    tuning_record: Dict[str, Any] = {}
    best_estimator = None
    best_model_name = ""
    
    # Fit preprocessor on full engineered train set for final training
    full_preprocessor = EngineMindPreprocessor(clip_threshold=clip_threshold)
    X_train_eng_scaled, feature_names = full_preprocessor.fit_transform(train_eng)
    
    if tune_models:
        logger.info("=== STEP 4: HYPERPARAMETER TUNING ON WINNING CANDIDATES ===")
        # Tune Random Forest on engineered features
        rf_tuned, rf_tuning_info = tune_random_forest(X_train_eng_scaled, y, groups=groups, n_iter=10)
        tuning_record["RandomForest"] = rf_tuning_info
        
        if HAS_XGBOOST:
            xgb_tuned, xgb_tuning_info = tune_xgboost(X_train_eng_scaled, y, groups=groups, n_iter=10)
            tuning_record["XGBoost"] = xgb_tuning_info
            
            # Select overall best by CV RMSE
            if xgb_tuning_info["best_cv_rmse"] < rf_tuning_info["best_cv_rmse"]:
                best_estimator = xgb_tuned
                best_model_name = "Tuned XGBoost Regressor (Engineered Features)"
            else:
                best_estimator = rf_tuned
                best_model_name = "Tuned Random Forest Regressor (Engineered Features)"
        else:
            best_estimator = rf_tuned
            best_model_name = "Tuned Random Forest Regressor (Engineered Features)"
            
        with open(metrics_dir / "tuning_results.json", "w", encoding="utf-8") as f:
            json.dump(tuning_record, f, indent=4)
        logger.info(f"Saved tuning metadata to: {metrics_dir / 'tuning_results.json'}")
    else:
        # Default to RF engineered
        best_estimator = RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_leaf=4, random_state=RANDOM_SEED, n_jobs=-1)
        best_estimator.fit(X_train_eng_scaled, y)
        best_model_name = "Random Forest Regressor (Engineered Features)"

    logger.info("=== STEP 5: FINAL MODEL FITTING & SERIALIZATION ===")
    best_estimator.fit(X_train_eng_scaled, y)
    
    pipeline_artifact = {
        "model_name": best_model_name,
        "estimator": best_estimator,
        "preprocessor": full_preprocessor,
        "feature_names": feature_names,
        "clip_threshold": clip_threshold,
        "random_seed": RANDOM_SEED,
        "training_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    model_save_path = models_dir / "best_model.joblib"
    joblib.dump(pipeline_artifact, model_save_path)
    logger.info(f"Successfully saved winning pipeline to: {model_save_path}")
    
    return {
        "best_model_name": best_model_name,
        "comparison_results": results_list,
        "feature_count": len(feature_names),
        "model_save_path": str(model_save_path)
    }


if __name__ == "__main__":
    run_training_pipeline()

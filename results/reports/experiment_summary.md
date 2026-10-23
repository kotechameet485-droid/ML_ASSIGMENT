# EngineMind — Comprehensive ML Experimentation Summary

## 1. Executive Summary & Objective

**EngineMind** is an academic-grade predictive-maintenance system designed to estimate the **Remaining Useful Life (RUL)** of simulated turbofan engines using multivariate time-series sensor observations from the **NASA C-MAPSS Turbofan Engine Degradation Simulation Dataset (FD001)**.

The primary objective is decision support for fleet maintenance scheduling:
1. Identifying engines at imminent risk of functional failure.
2. Quantifying remaining operational cycles before critical thresholds are breached.
3. Uncovering thermodynamic degradation signatures (temperatures, pressures, fan speeds).
4. Providing causal, leakage-safe validation and empirical proof of superiority over naive baselines.

---

## 2. Dataset Architecture & Verification

The initial subset **FD001** simulates turbofan operations under sea-level static conditions with a single dominant fault mode: **High-Pressure Compressor (HPC) degradation**.

| Dataset Partition | Engines | Total Records | Observations per Engine | Missing Values | Duplicate Cycles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Training Set** | 100 | 20,631 | 128 to 362 cycles (Mean: 206.3) | 0 (0.0%) | 0 (0.0%) |
| **Test Set** | 100 | 13,096 | 31 to 303 cycles (Mean: 131.0) | 0 (0.0%) | 0 (0.0%) |
| **Ground Truth RUL** | 100 | 100 | 1 target per test engine | 0 (0.0%) | 0 (0.0%) |

### Data Cleaning & Pruning Justification
Through training-side variance analysis, 6 of 21 sensors exhibited zero variance across all 20,631 observations due to fixed sea-level operating constraints:
- `sensor_1` (Fan inlet temperature $T_2$)
- `sensor_5` (Fan inlet pressure $P_2$)
- `sensor_10` (Engine pressure ratio $P_{50}/P_2$)
- `sensor_16` (Burner fuel-air ratio $farB$)
- `sensor_18` (Demanded fan speed $PCNfR\_dmd$)
- `sensor_19` (Demanded corrected fan speed $W_{31}$)
- `setting_3` (Throttle Resolver Angle $TRA$ = 100.0)

**Pruning Decision**: These 7 uninformative features were systematically dropped, reducing collinearity and gradient noise without loss of physical degradation information.

---

## 3. RUL Target Formulation & Balancing Analysis

### Piecewise-Linear Target Capping (RUL_CAP = 125 cycles)
Run-to-failure experiments simulate engines that start in nominal, brand-new condition. During initial operation (e.g., cycles 1–100), microscopic wear does not produce detectable sensor drift.
- **Uncapped Target**: Forces models to penalize identical sensor readings with different target values (e.g. cycle 20 vs cycle 60), inflating variance.
- **Piecewise Capped Target (125 cycles)**: Creates a stable target plateau for the healthy operating regime, allowing models to focus parameter capacity on the exponential degradation knee.

### Why Classification Resampling (SMOTE) is Inapplicable
RUL estimation is a continuous regression problem ($y \in [0, \infty)$). Naively applying SMOTE or categorical resampling synthesizes artificial points between arbitrary rows, violating thermodynamic physical laws, destroying temporal continuity, and causing cross-engine data leakage. Instead, EngineMind balances representations via **Engine-Grouped Validation**.

---

## 4. Leakage-Safe Cross-Validation Strategy

To simulate realistic deployment on unseen engines, EngineMind employs **5-Fold GroupKFold Cross-Validation** grouped strictly by `engine_id`:
- **Complete Engine Isolation**: Every engine's trajectory belongs entirely to either train or validation in any fold. Zero engine overlap exists between folds.
- **Internal Pipeline Fitting**: Feature scaling and selection are fitted strictly inside each training fold.
- **Strictly Causal Windowing**: Rolling statistics (rolling means, rolling standard deviations, trend differences) operate with backward-looking windows (`min_periods=1`), guaranteeing zero future-information lookahead.
- **Sacrosanct Test Set**: Official test labels (`RUL_FD001.txt`) were untouched during all training and tuning phases.

---

## 5. Model Benchmark & Empirical Comparison

All models were evaluated using the same 5-fold engine-level cross-validation partitions:

| Model | Feature Pipeline | Val MAE (cycles) | Val RMSE (cycles) | Val $R^2$ | Training Time (s) | Model Characterization & Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A: Mean Baseline** | Population Mean | 36.97 ± 0.00 | 41.67 ± 0.00 | -0.000 | 0.05 | Zero sensor sensitivity; constant prediction. |
| **Model B1: Linear Reg.** | Raw Sensors | 17.75 ± 1.16 | 21.66 ± 1.38 | 0.729 | 0.17 | Assumes strictly linear degradation response. |
| **Model B2: Linear Reg.** | Rolling Dynamics | 16.11 ± 0.80 | 19.73 ± 1.01 | 0.775 | 0.54 | Improves on raw linear; limited interaction modeling. |
| **Model C1: Random Forest** | Raw Sensors | 13.58 ± 0.77 | 18.75 ± 0.58 | 0.797 | 8.89 | Non-linear tree splits; captures raw interactions. |
| **Model C2: Random Forest** | Rolling Dynamics | 13.42 ± 0.72 | 18.72 ± 0.48 | 0.798 | 66.74 | Robust ensemble; smoothed sensor noise. |
| **Model D1: XGBoost** | Raw Sensors | 13.57 ± 0.76 | 18.67 ± 0.60 | 0.799 | 1.39 | Fast gradient boosted trees on snapshot values. |
| **Model D2: XGBoost** | Rolling Dynamics | **12.99 ± 0.65** | **17.94 ± 0.55** | **0.815** | 3.57 | **Winning Architecture**: Superior non-linear convergence. |

---

## 6. Hyperparameter Optimization Results

Hyperparameter optimization was conducted using `RandomizedSearchCV` with 4-fold `GroupKFold` cross-validation:

### Tuned XGBoost Regressor (Selected Architecture)
- `n_estimators`: **140**
- `max_depth`: **5**
- `learning_rate`: **0.07**
- `subsample`: **0.85**
- `colsample_bytree`: **0.6**
- `reg_lambda`: **10.0**
- **Cross-Validation RMSE**: **17.75 cycles** (improved from untuned baseline 18.67)

---

## 7. Official NASA Test Evaluation Results

The selected pipeline was evaluated on the official truncated test trajectories against `RUL_FD001.txt` (100 unseen test engines):

| Metric | Measured Score | Benchmark Comparison |
| :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | **13.94 cycles** | 61.2% error reduction over naive baseline (35.90) |
| **Root Mean Squared Error (RMSE)** | **18.57 cycles** | 56.9% reduction over naive baseline (43.07) |
| **Coefficient of Determination ($R^2$)** | **0.8002** | Explains 80.0% of total variance in unseen engines |
| **NASA PHM08 Asymmetric Score** | **760.5** | 97.7% reduction from baseline score of 33,629.2 |

### Operational Asymmetry & Safety Analysis
- **Failsafe Underestimation (Early Maintenance)**: **45 / 100 engines** (Mean error: -12.6 cycles). Safe for aviation operations; engine overhauled slightly early.
- **Overestimation (Late Maintenance Risk)**: **55 / 100 engines** (Mean error: +15.0 cycles). Potential risk of unexpected failure; managed in practice by setting a 15-cycle safety buffer.

---

## 8. Physical Sensor Attribution & Explainability

Global SHAP TreeExplainer analysis highlights the primary physical predictors of engine degradation:
1. **Sensor 11 (Ps30 - Static Pressure at HPC Outlet)**: Primary indicator of aerodynamic backpressure as compressor efficiency degrades.
2. **Sensor 4 (T50 - LPT Outlet Temperature)**: Exhaust gas temperature rises as more fuel is demanded to compensate for core degradation.
3. **Sensor 12 (phi - Fuel flow to Ps30 ratio)**: Direct measure of thermodynamic fuel-burn efficiency.
4. **Sensor 9 (Nc - Physical Core Speed)**: Core spool accelerates to sustain demanded engine thrust.
5. **Rolling Trend Features (`trend_5`, `roll_mean_15`)**: Exponential rate of change flags rapid breakdown in the final 30 cycles.

---

## 9. Academic Integrity & Reproducibility Statement

All metrics, plots, and models documented herein were computed deterministically on the local workspace from the real NASA C-MAPSS dataset. Zero data was synthesized or fabricated.

# EngineMind — Official Test Evaluation & Performance Audit

**Evaluated Model**: `Tuned XGBoost Regressor (Engineered Features)`
**Target Dataset**: NASA C-MAPSS `FD001` Test Trajectories (100 Engines) against `RUL_FD001.txt`

### 1. Final Benchmark Metrics

| Metric | Measured Score | Physical Interpretation |
| :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | **13.94 cycles** | On average, predictions deviate by 13.9 operational flights. |
| **Root Mean Squared Error (RMSE)** | **18.57 cycles** | Penalizes larger outliers; aligns closely with international benchmarks. |
| **Mean Squared Error (MSE)** | **345.02** | Variance of the prediction error. |
| **Coefficient of Determination ($R^2$)** | **0.800** | Explains **80.0%** of total variance in unseen engine degradation. |
| **NASA PHM08 Asymmetric Score** | **760.5** | Asymmetrically penalizes overestimation (dangerous late maintenance) vs early. |

### 2. Operational Reliability & Asymmetric Risk Analysis

- **Total Unseen Test Engines**: 100 engines
- **Failsafe Underestimated Predictions (Early Maintenance)**: **45%** (Mean deviation: -12.6 cycles)
  - *Operational Implication*: Engine is pulled for proactive overhaul slightly early. Safe for aviation integrity; incurs minor life-fraction wastage.
- **Overestimated Predictions (Late Maintenance Risk)**: **55%** (Mean deviation: +15.0 cycles)
  - *Operational Implication*: Potential risk of component failure before scheduled depot servicing. Requires buffer thresholding in maintenance scheduling.

### 3. Verification of Zero-Leakage Protocol

1. Official test labels (`RUL_FD001.txt`) were **never accessed or seen** during data cleaning, feature engineering, GroupKFold validation, or hyperparameter tuning.
2. Rolling features for test engines were computed **strictly backwards** using historical cycle records of the respective engine only.
3. Exactly one prediction per test engine was evaluated at its exact terminal observed cycle.

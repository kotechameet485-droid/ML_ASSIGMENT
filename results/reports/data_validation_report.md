# EngineMind — Data Validation & Reproducibility Report

**Dataset Subset**: NASA C-MAPSS `FD001` (Single Operating Condition: Sea Level, Single Fault Mode: HPC Degradation)

### 1. Dataset Dimensions & Completeness

| Split | Trajectories (Engines) | Total Records | Columns | Missing Values | Duplicate Cycles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Training** | 100 | 20,631 | 26 | 0 | 0 |
| **Testing** | 100 | 13,096 | 26 | 0 | 0 |
| **Ground Truth RUL** | 100 | 100 | 1 | 0 | 0 |

- **Strict Cycle Continuity**: Train: `True`, Test: `True`
- **Test-RUL Engine Alignment Validated**: `True` (1:1 correspondence between test engines and RUL labels)

### 2. Operational Lifespans

- **Training Fleet Run-to-Failure**: Min = 128 cycles, Max = 362 cycles, Mean = 206.3 ± 46.3 cycles
- **Test Fleet Truncated Cycles**: Min = 31 cycles, Max = 303 cycles, Mean = 131.0 cycles
- **Test Ground Truth Remaining Useful Life**: Min = 7 cycles, Max = 145 cycles, Mean = 75.5 cycles

### 3. Feature Variance & Information Content

- **Zero-Variance Sensors (Uninformative in FD001)**: `['sensor_1', 'sensor_5', 'sensor_10', 'sensor_16', 'sensor_18', 'sensor_19']`
  - *Justification for Pruning*: Sensors 1, 5, 10, 16, 18, 19 exhibit zero variance across all 20,631 observations due to sea-level static simulation bounds. Retaining them introduces zero information and adds unneeded collinear parameters.
- **Constant Operating Settings**: `['setting_2', 'setting_3']` (`setting_3` is constant 100.0 in sea-level FD001).
- **Informative Sensors Retained**: `['sensor_2', 'sensor_3', 'sensor_4', 'sensor_7', 'sensor_9', 'sensor_11', 'sensor_12', 'sensor_14', 'sensor_17', 'sensor_20', 'sensor_21']` (11 sensors show strong physical degradation signatures).

### 4. Integrity Statement

This summary was computed deterministically from the workspace files without synthesizing or fabricating rows.

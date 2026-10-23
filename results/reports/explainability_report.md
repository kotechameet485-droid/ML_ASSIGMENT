# EngineMind — Model Interpretability & Attribution Analysis

### 1. Primary Degradation Predictors

The most influential features driving remaining useful life predictions are:

| Rank | Feature | Physical Meaning | Direction of Influence |
| :--- | :--- | :--- | :--- |
| 1 | `sensor_4_roll_mean_5` | LPT outlet temperature (T50) | High rolling levels indicate progressive thermo-mechanical distress |
| 2 | `sensor_4_roll_mean_15` | LPT outlet temperature (T50) | High rolling levels indicate progressive thermo-mechanical distress |
| 3 | `sensor_11_roll_mean_5` | Static pressure at HPC outlet (Ps30) | High rolling levels indicate progressive thermo-mechanical distress |
| 4 | `sensor_3_roll_mean_15` | HPC outlet temperature (T30) | High rolling levels indicate progressive thermo-mechanical distress |
| 5 | `sensor_15_roll_mean_15` | Bypass ratio (BPR) | High rolling levels indicate progressive thermo-mechanical distress |
| 6 | `sensor_15_roll_mean_5` | Bypass ratio (BPR) | High rolling levels indicate progressive thermo-mechanical distress |
| 7 | `sensor_9_roll_mean_5` | Physical core speed (Nc) | High rolling levels indicate progressive thermo-mechanical distress |
| 8 | `sensor_9_roll_mean_15` | Physical core speed (Nc) | High rolling levels indicate progressive thermo-mechanical distress |

### 2. Physical Engine Degradation Mechanics

- **Sensor 11 (Ps30 - Static Pressure at HPC Outlet)**: As High Pressure Compressor (HPC) blades erode and aerodynamic efficiency degrades, static pressure shifts significantly to maintain required combustor inlet mass flow.
- **Sensor 4 (T50 - Low Pressure Turbine Outlet Temperature)**: Drop in compressor efficiency forces increased fuel scheduling, elevating turbine exhaust gas temperature (EGT / T50).
- **Sensor 12 (phi - Ratio of Fuel Flow to Ps30)**: Degrading combustion and compression requires higher specific fuel injection per unit pressure, acting as a clear indicator of thermodynamic distress.
- **Rolling Trend Features**: Temporal derivatives (`trend_5`, `roll_mean_15`) mitigate instantaneous sensor noise and highlight the exponential knee in degradation during the final 30-50 operating cycles.

### 3. Critical Academic Boundary: Attribution vs. Causation

> [!WARNING]
> **Attribution Is Not Standalone Causality**: While SHAP and Gini importances identify which sensor channels most heavily shift the mathematical output of the model, they do **not** imply that altering that sensor measurement will change engine physical longevity. The true root causes are microscopic seal wear, aerodynamic fouling, blade tip clearance increases, and thermal barrier coating spallation. Sensors merely report symptomatic thermodynamic responses.

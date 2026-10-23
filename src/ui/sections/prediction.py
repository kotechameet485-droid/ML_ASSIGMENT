"""
EngineMind — RUL Prediction Engine Section
Interactive inference workflow, configurable maintenance heuristics, audit mode,
and session history logging.
"""

from pathlib import Path
from typing import Dict, Any
from datetime import datetime
import streamlit as st
import pandas as pd
import numpy as np

from src.data_loader import load_raw_dataset, SENSOR_METADATA, SUBSET_CATALOG
from src.predict import EngineMindPredictor
from src.ui.components import render_page_header, render_dataset_banner, export_dataframe_button


def render_prediction_section(
    subset: str,
    artifacts: Dict[str, Any],
    workspace_root: Path
):
    render_page_header(
        title="Remaining Useful Life Prediction Engine",
        subtitle="Execute verified inference on unseen engine trajectories with heuristic maintenance decision thresholds.",
        badge_label="REAL-TIME INFERENCE",
        badge_type="active"
    )
    
    render_dataset_banner(subset)

    # 1. Dataset compatibility check
    meta = SUBSET_CATALOG.get(subset, {})
    if not meta.get("has_trained_model", False):
        st.warning(
            f"⚠️ **Inference Unavailable for {subset}**: A verified trained model pipeline is currently active "
            f"for **FD001**. Subsets {subset} simulate multi-condition / multi-fault flight envelopes. "
            f"To evaluate live RUL predictions, please select **FD001** from the sidebar dataset selector."
        )
        return

    # 2. Load predictor
    try:
        predictor = EngineMindPredictor()
    except Exception as e:
        st.error(f"Failed to load EngineMind prediction pipeline: {e}")
        st.info("Run `python -m src.train` to train and serialize the model.")
        return

    # Load test data
    try:
        _, test_df, rul_df = load_raw_dataset(subset)
    except Exception as e:
        st.error(f"Failed to load dataset: {e}")
        return

    # 3. Prediction Configuration Form
    st.markdown("#### 1. Telemetry Selection & Priority Heuristic Thresholds")
    
    ctrl_col1, ctrl_col2, ctrl_col3 = st.columns([1, 1, 1])
    
    with ctrl_col1:
        test_engine_ids = sorted(test_df["engine_id"].unique())
        selected_engine_id = st.selectbox(
            "Select Test Engine Trajectory",
            test_engine_ids,
            index=30  # Default to Engine 31 (Critical near failure)
        )
        
    with ctrl_col2:
        critical_thresh = st.number_input(
            "Critical Priority Threshold (Cycles)",
            min_value=5.0,
            max_value=50.0,
            value=25.0,
            step=5.0,
            help="Engines with predicted RUL at or below this threshold are flagged for immediate depot overhaul."
        )
        
    with ctrl_col3:
        warning_thresh = st.number_input(
            "Warning Priority Threshold (Cycles)",
            min_value=25.0,
            max_value=100.0,
            value=60.0,
            step=5.0,
            help="Engines with predicted RUL below this threshold are flagged for inspection in the next flight block."
        )

    # 4. Run Prediction
    eng_trajectory = test_df[test_df["engine_id"] == selected_engine_id].sort_values("cycle")
    final_cycle = int(eng_trajectory["cycle"].max())
    
    with st.spinner("Generating time-aware rolling features and computing RUL..."):
        pred_result = predictor.predict_engine_trajectory(eng_trajectory)
        
    pred_rul = pred_result["predicted_rul"]
    prio_data = predictor.compute_maintenance_priority(
        predicted_rul=pred_rul,
        critical_thresh=critical_thresh,
        warning_thresh=warning_thresh
    )
    priority = prio_data["priority_level"]

    # Log to session prediction history
    if "prediction_history" not in st.session_state:
        st.session_state["prediction_history"] = []
        
    log_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "subset": subset,
        "engine_id": selected_engine_id,
        "terminal_cycle": final_cycle,
        "predicted_rul": round(pred_rul, 1),
        "maintenance_priority": priority,
        "model_used": predictor.model_name
    }
    # Avoid duplicate sequential entries
    if not st.session_state["prediction_history"] or st.session_state["prediction_history"][-1]["engine_id"] != selected_engine_id:
        st.session_state["prediction_history"].append(log_entry)

    st.markdown("---")
    st.markdown("#### 2. Prediction Intelligence & Decision Support Output")
    
    r_col1, r_col2, r_col3, r_col4 = st.columns(4)
    r_col1.metric("Engine Unit ID", f"Engine #{selected_engine_id}")
    r_col2.metric("Terminal Observed Cycle", f"Cycle {final_cycle}", delta="Latest Available Flight")
    r_col3.metric("Estimated RUL", f"{pred_rul:.1f} Cycles", delta="Point Prediction")
    r_col4.metric("Empirical Error Margin", "± 13.9 Cycles", delta="Fleet MAE (N=100)")

    # Priority Alert Card
    if priority == "CRITICAL":
        st.markdown(f"""
        <div style="background-color: rgba(239, 68, 68, 0.12); border-left: 4px solid #EF4444; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
            <div style="font-size: 1.1rem; font-weight: 700; color: #F87171;">
                🚨 MAINTENANCE PRIORITY: CRITICAL (Estimated RUL: {pred_rul:.1f} Cycles)
            </div>
            <div style="font-size: 0.88rem; color: #E2E8F0; margin-top: 6px;">
                <b>Recommended Engineering Action</b>: {prio_data['action']}.
                The High-Pressure Compressor is experiencing severe thermodynamic erosion. 
                Applying the standard 15-cycle flight buffer indicates this engine has breached safe operational reserve margins.
            </div>
        </div>
        """, unsafe_allow_html=True)
    elif priority == "WARNING":
        st.markdown(f"""
        <div style="background-color: rgba(245, 158, 11, 0.12); border-left: 4px solid #F59E0B; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
            <div style="font-size: 1.1rem; font-weight: 700; color: #FBBF24;">
                ⚠️ MAINTENANCE PRIORITY: WARNING (Estimated RUL: {pred_rul:.1f} Cycles)
            </div>
            <div style="font-size: 0.88rem; color: #E2E8F0; margin-top: 6px;">
                <b>Recommended Engineering Action</b>: {prio_data['action']}.
                Degradation indicators are accelerating. Schedule borescope inspection and compressor wash during the next hangar rotation.
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div style="background-color: rgba(16, 185, 129, 0.12); border-left: 4px solid #10B981; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
            <div style="font-size: 1.1rem; font-weight: 700; color: #34D399;">
                ✅ MAINTENANCE PRIORITY: NOMINAL (Estimated RUL: {pred_rul:.1f} Cycles)
            </div>
            <div style="font-size: 0.88rem; color: #E2E8F0; margin-top: 6px;">
                <b>Recommended Engineering Action</b>: {prio_data['action']}.
                Turbine exhaust temperatures and compressor pressures remain within nominal design bounds. Continue standard fleet monitoring.
            </div>
        </div>
        """, unsafe_allow_html=True)

    # 5. Collapsible Ground Truth Audit Container
    true_rul_val = float(rul_df.iloc[selected_engine_id - 1]["true_rul"])
    residual = pred_rul - true_rul_val
    
    with st.expander("Ground Truth Audit & Verification View (Evaluation Mode Only)", expanded=False):
        st.markdown("""
        > [!NOTE]
        > **Strict Separation Notice**: The true RUL value below is provided from `RUL_FD001.txt` solely for post-hoc verification. 
        > This ground truth is **never** accessible to the model or feature pipeline during inference.
        """)
        
        a1, a2, a3 = st.columns(3)
        a1.metric("Ground Truth RUL", f"{true_rul_val:.0f} Cycles")
        a2.metric("Model Prediction", f"{pred_rul:.1f} Cycles")
        a3.metric(
            "Residual (Pred - True)",
            f"{residual:+.1f} Cycles",
            delta="Safe Underestimation" if residual < 0 else "Overestimated (Late Risk)",
            delta_color="inverse"
        )

    st.markdown("---")

    # 6. Session Prediction History Table
    st.markdown("#### 3. Session Prediction Audit History")
    
    history_df = pd.DataFrame(st.session_state["prediction_history"])
    st.dataframe(history_df, use_container_width=True)
    
    if len(history_df) > 0:
        export_dataframe_button(
            df=history_df,
            filename=f"enginemind_session_predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            label="Download Session Prediction Audit Log (CSV)"
        )

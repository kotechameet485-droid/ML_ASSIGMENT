"""
EngineMind — Engine Fleet Explorer Section
Interactive telemetry visualizer, sensor trajectory comparator, and raw data exporter.
"""

from pathlib import Path
from typing import Dict, Any, List
import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from src.data_loader import load_raw_dataset, SENSOR_METADATA, SUBSET_CATALOG
from src.ui.components import render_page_header, render_dataset_banner, export_dataframe_button


def render_explorer_section(
    subset: str,
    artifacts: Dict[str, Any],
    workspace_root: Path
):
    render_page_header(
        title="Engine Fleet Telemetry Explorer",
        subtitle="Multi-sensor degradation trajectories, operational settings inspection, and raw data audit.",
        badge_label="INTERACTIVE TELEMETRY",
        badge_type="active"
    )
    
    render_dataset_banner(subset)

    # Load dataset for current subset
    try:
        train_df, test_df, rul_df = load_raw_dataset(subset)
    except Exception as e:
        st.error(f"Failed to load dataset {subset}: {e}")
        return

    # Filter Controls
    f_col1, f_col2, f_col3 = st.columns([1, 1, 2])
    
    with f_col1:
        partition = st.radio("Dataset Partition", ["Test Fleet (Censored)", "Training Fleet (Run-to-Failure)"], horizontal=False)
        current_df = test_df if "Test" in partition else train_df
        
    all_engines = sorted(current_df["engine_id"].unique())
    
    with f_col2:
        selected_engine = st.selectbox("Select Engine Unit ID", all_engines, index=0)
        
    engine_telemetry = current_df[current_df["engine_id"] == selected_engine].sort_values("cycle")
    min_c = int(engine_telemetry["cycle"].min())
    max_c = int(engine_telemetry["cycle"].max())
    
    with f_col3:
        cycle_range = st.slider("Cycle Range Filter", min_value=min_c, max_value=max_c, value=(min_c, max_c), step=1)
        
    filtered_telemetry = engine_telemetry[
        (engine_telemetry["cycle"] >= cycle_range[0]) & (engine_telemetry["cycle"] <= cycle_range[1])
    ]

    # Engine Status Summary Card
    st.markdown("#### Engine Unit Overview & Operational Summary")
    
    sc1, sc2, sc3, sc4 = st.columns(4)
    sc1.metric("Engine Unit ID", f"Engine #{selected_engine}")
    sc2.metric("Observed Cycle Range", f"Cycles {cycle_range[0]} – {cycle_range[1]}", delta=f"{max_c} Total Cycles")
    
    if "Test" in partition:
        true_rul_val = int(rul_df.iloc[selected_engine - 1]["true_rul"])
        sc3.metric("Ground Truth RUL (Terminal)", f"{true_rul_val} Cycles", delta="Evaluation Context Only")
        
        # Check if predicted RUL exists for this engine
        engine_preds_df = artifacts.get("engine_preds_df")
        if engine_preds_df is not None and subset == "FD001":
            match = engine_preds_df[engine_preds_df["engine_id"] == selected_engine]
            if not match.empty:
                pred_rul = float(match["predicted_rul"].iloc[0])
                sc4.metric("Predicted RUL (EngineMind)", f"{pred_rul:.1f} Cycles", delta=f"{pred_rul - true_rul_val:+.1f} Error")
            else:
                sc4.metric("Predicted RUL", "Not Evaluated")
        else:
            sc4.metric("Predicted RUL", "N/A (FD001 Only)")
    else:
        sc3.metric("Trajectory Lifespan", f"{max_c} Cycles to Failure", delta="Run-to-Failure Endpoint")
        sc4.metric("Initial Condition", "Nominal Health", delta="Break-in Phase")

    st.markdown("---")

    # Multivariate Sensor Selection and Plotting
    st.markdown("#### Multivariate Sensor Degradation Trajectories")
    
    active_sensor_keys = [s for s in SENSOR_METADATA.keys() if not SENSOR_METADATA[s]["constant_in_fd001"]]
    default_selection = ["sensor_2", "sensor_3", "sensor_4", "sensor_11"]
    
    selected_sensors = st.multiselect(
        "Select Sensor Channels to Display",
        options=active_sensor_keys,
        default=default_selection,
        format_func=lambda s: f"{s} — {SENSOR_METADATA.get(s, {}).get('desc', s)} [{SENSOR_METADATA.get(s, {}).get('unit', '')}]"
    )
    
    if selected_sensors:
        fig, axes = plt.subplots(len(selected_sensors), 1, figsize=(12, 2.5 * len(selected_sensors)), sharex=True)
        if len(selected_sensors) == 1:
            axes = [axes]
            
        fig.patch.set_facecolor('#0B0F17')
        
        for ax, s in zip(axes, selected_sensors):
            ax.set_facecolor('#131B2B')
            meta = SENSOR_METADATA.get(s, {})
            desc = meta.get("desc", s)
            unit = meta.get("unit", "")
            
            ax.plot(
                filtered_telemetry["cycle"],
                filtered_telemetry[s],
                color="#38BDF8",
                linewidth=1.6,
                marker="o",
                markersize=2.5,
                label=f"Observed {s}"
            )
            ax.set_title(f"{s}: {desc} ({unit})", fontsize=10, fontweight="bold", color="#F8FAFC", loc="left")
            ax.set_ylabel(unit, fontsize=9, color="#94A3B8")
            ax.tick_params(colors="#94A3B8", labelsize=8)
            ax.grid(True, linestyle="--", alpha=0.3, color="#334155")
            for spine in ax.spines.values():
                spine.set_color('#1E293B')
                
        axes[-1].set_xlabel("Operational Flight Cycles", fontsize=9, color="#94A3B8")
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
    else:
        st.warning("Please select at least one sensor channel to plot.")

    st.markdown("---")

    # Raw Data Table with Search and Export
    st.markdown("#### Filtered Telemetry Records & CSV Export")
    
    st.dataframe(
        filtered_telemetry,
        use_container_width=True,
        height=280
    )
    
    export_dataframe_button(
        df=filtered_telemetry,
        filename=f"enginemind_{subset}_engine_{selected_engine}_cycles_{cycle_range[0]}_{cycle_range[1]}.csv",
        label=f"Export Telemetry for Engine #{selected_engine} ({len(filtered_telemetry)} rows)"
    )

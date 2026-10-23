"""
EngineMind — Sensor & Explainability Section
Tree feature importance rankings, SHAP global/local attributions, and thermodynamic degradation physics.
"""

from pathlib import Path
from typing import Dict, Any
import streamlit as st
import pandas as pd
import numpy as np

from src.data_loader import SENSOR_METADATA
from src.ui.components import render_page_header, render_dataset_banner, export_dataframe_button


def render_explainability_section(
    subset: str,
    artifacts: Dict[str, Any],
    workspace_root: Path
):
    render_page_header(
        title="Sensor Diagnostics & Explainability (SHAP)",
        subtitle="Deconstruct model decisions through global feature importances, SHAP attributions, and local engine explanations.",
        badge_label="PHYSICAL INTERPRETABILITY",
        badge_type="active"
    )
    
    render_dataset_banner(subset)

    # 1. Feature Importance Rankings
    feat_imp_df = artifacts.get("feat_imp_df")
    fig_dir = workspace_root / "results" / "figures"

    col_fi1, col_fi2 = st.columns([1, 1])

    with col_fi1:
        st.markdown("#### Top 20 Degradation Predictors (Tree Gain)")
        if (fig_dir / "feature_importance.png").exists():
            st.image(str(fig_dir / "feature_importance.png"), use_container_width=True)
            
    with col_fi2:
        st.markdown("#### Feature Importance Data Table")
        if feat_imp_df is not None and not feat_imp_df.empty:
            st.dataframe(feat_imp_df.head(15), use_container_width=True, height=350)
            export_dataframe_button(
                df=feat_imp_df,
                filename="enginemind_feature_importances.csv",
                label="Download Full Feature Importances (CSV)"
            )
        else:
            st.info("Feature importance data not found. Run `python -m src.explainability`.")

    st.markdown("---")

    # 2. Global SHAP Summary Analysis
    st.markdown("#### Global SHAP Beeswarm Summary (Directional Feature Impact)")
    st.markdown("""
    Each dot represents an observation in the test fleet. 
    **Color represents feature value** (Red = High, Blue = Low). 
    **Position along the X-axis** indicates whether that feature increases or decreases the estimated RUL.
    """)

    if (fig_dir / "shap_summary.png").exists():
        st.image(str(fig_dir / "shap_summary.png"), caption="SHAP Summary: Feature Value vs. Impact on Predicted RUL", use_container_width=True)
    else:
        st.info("SHAP summary plot not found. Run `python -m src.explainability` to generate.")

    st.markdown("---")

    # 3. Local Engine Explanations (Waterfall Comparisons)
    st.markdown("#### Local Engine Decision Explanations (SHAP Waterfall)")
    st.markdown("""
    Compare how the model attributes risk for an engine nearing functional failure versus an engine in nominal health.
    """)

    col_w1, col_w2 = st.columns(2)
    with col_w1:
        wf_near = fig_dir / "shap_waterfall_engine_near_failure.png"
        if wf_near.exists():
            st.image(str(wf_near), caption="Engine Near Failure: High rolling pressure and temperature drive negative RUL shift", use_container_width=True)
            
    with col_w2:
        wf_health = fig_dir / "shap_waterfall_engine_healthy.png"
        if wf_health.exists():
            st.image(str(wf_health), caption="Healthy Engine: Low temperatures and stable pressures preserve positive RUL", use_container_width=True)

    st.markdown("---")

    # 4. Critical Academic Distinction: Attribution vs. Causality
    st.markdown("#### Physical Degradation Mechanics vs. Statistical Attribution")
    
    st.markdown("""
    <div style="background-color: rgba(245, 158, 11, 0.08); border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 4px; margin-bottom: 16px;">
        <span style="font-weight: 700; color: #FBBF24;">CRITICAL ACADEMIC BOUNDARY: ATTRIBUTION IS NOT STANDALONE CAUSATION</span>
        <p style="font-size: 0.86rem; color: #E2E8F0; margin-top: 6px;">
            A high SHAP attribution value for <code>sensor_11</code> (Ps30 - HPC static pressure) indicates that 
            pressure deviations provide the strongest mathematical signal for predicting RUL. 
            However, <b>the sensor measurement itself is not the physical cause of degradation</b>.
        </p>
        <p style="font-size: 0.84rem; color: #94A3B8; margin-top: 4px;">
            The true root causes of failure in the C-MAPSS simulation are <b>aerodynamic compressor blade tip clearance erosion</b>, 
            <b>airfoil surface roughness increases</b>, and <b>labyrinth seal leakages</b>. 
            Sensors merely report symptomatic thermodynamic responses. Intervening to artificially alter a sensor reading 
            would not restore engine structural longevity.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # 5. Sensor Catalog & Engineering Units
    with st.expander("Explore Verified C-MAPSS Sensor Telemetry Catalog", expanded=False):
        sensor_records = []
        for s_id, s_meta in SENSOR_METADATA.items():
            sensor_records.append({
                "Sensor Channel": s_id,
                "Physical Description": s_meta["desc"],
                "Engineering Units": s_meta["unit"],
                "FD001 Variance Status": "Constant (Pruned)" if s_meta["constant_in_fd001"] else "Active (Informative)"
            })
        st.dataframe(pd.DataFrame(sensor_records), use_container_width=True)

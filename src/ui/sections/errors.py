"""
EngineMind — Error Analysis & Limitations Section
Audits residual distributions, largest over/underestimations, and documents engineering constraints.
"""

from pathlib import Path
from typing import Dict, Any
import streamlit as st
import pandas as pd
import numpy as np

from src.ui.components import render_page_header, render_dataset_banner, export_dataframe_button


def render_error_analysis_section(
    subset: str,
    artifacts: Dict[str, Any],
    workspace_root: Path
):
    render_page_header(
        title="Error Diagnostics, Risk Audit & Limitations",
        subtitle="Rigorous inspection of model residual patterns, asymmetric aviation risk, and simulation boundary conditions.",
        badge_label="RISK AUDIT",
        badge_type="warning"
    )
    
    render_dataset_banner(subset)

    # 1. Error Definition & Convention Callout
    st.markdown("""
    <div style="background-color: #131B2B; border: 1px solid #1E293B; border-radius: 4px; padding: 12px 18px; margin-bottom: 16px;">
        <span style="font-weight: 700; color: #38BDF8;">RESIDUAL CONVENTION & FLIGHT SAFETY IMPLICATIONS</span>
        <div style="font-size: 0.84rem; color: #E2E8F0; margin-top: 4px;">
            $$\\text{Residual Error} = \\text{Predicted RUL} - \\text{Ground Truth RUL}$$
            <ul>
                <li><b style="color: #F87171;">Positive Residual (Overestimation)</b>: Model predicts <i>more</i> remaining cycles than actually exist. In aviation, this introduces potential in-flight failure risk if maintenance is delayed.</li>
                <li><b style="color: #34D399;">Negative Residual (Underestimation)</b>: Model predicts <i>fewer</i> remaining cycles. Failsafe for flight safety; incurs minor life-fraction loss by overhauling slightly early.</li>
            </ul>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 2. Per-Engine Error Audit Table
    preds_df = artifacts.get("engine_preds_df")
    fig_dir = workspace_root / "results" / "figures"

    if preds_df is not None and not preds_df.empty:
        st.markdown("#### Test Fleet Prediction Error Breakdown (N=100 Engines)")
        
        # Filter controls
        f1, f2 = st.columns([1, 1])
        with f1:
            error_filter = st.radio(
                "Filter Fleet by Error Direction",
                ["All 100 Engines", "Overestimated Engines (Late Risk)", "Underestimated Engines (Safe/Early)"],
                horizontal=True
            )
        with f2:
            min_abs_err = st.slider("Minimum Absolute Error Threshold (Cycles)", min_value=0, max_value=40, value=0, step=5)
            
        filtered_errors = preds_df.copy()
        if "Overestimated" in error_filter:
            filtered_errors = filtered_errors[filtered_errors["residual"] > 0]
        elif "Underestimated" in error_filter:
            filtered_errors = filtered_errors[filtered_errors["residual"] < 0]
            
        filtered_errors = filtered_errors[filtered_errors["absolute_error"] >= min_abs_err]
        filtered_errors = filtered_errors.sort_values(by="absolute_error", ascending=False)
        
        st.dataframe(
            filtered_errors,
            use_container_width=True,
            height=280
        )
        
        export_dataframe_button(
            df=filtered_errors,
            filename=f"enginemind_error_audit_{subset}.csv",
            label=f"Export Error Audit Table ({len(filtered_errors)} engines)"
        )
    else:
        st.warning("Per-engine prediction data not found. Run `python -m src.evaluate` to generate.")

    st.markdown("---")

    # 3. Residual Error Visualizations
    st.markdown("#### Residual Diagnostics & Heteroscedasticity Analysis")
    
    col_d1, col_d2 = st.columns(2)
    with col_d1:
        res_vs_pred = fig_dir / "residual_vs_predicted.png"
        if res_vs_pred.exists():
            st.image(str(res_vs_pred), caption="Residual vs. Predicted RUL: Checking for variance fanning and systematic bias", use_container_width=True)
            
    with col_d2:
        per_eng_err = fig_dir / "per_engine_errors.png"
        if per_eng_err.exists():
            st.image(str(per_eng_err), caption="Individual Engine Prediction Residuals across Test Fleet (1 to 100)", use_container_width=True)

    st.markdown("---")

    # 4. Documented Engineering Limitations
    st.markdown("#### Documented Academic & Engineering Limitations")
    
    lim_col1, lim_col2 = st.columns(2)
    with lim_col1:
        st.markdown("""
        <div class="industrial-card">
            <div style="font-weight: 700; color: #F59E0B;">1. Sea-Level Static Operational Envelope (FD001)</div>
            <p style="font-size: 0.82rem; color: #94A3B8; margin-top: 4px;">
                The FD001 model assumes constant sea-level static ambient conditions. Real aircraft fly multi-altitude missions 
                spanning climb, cruise, and descent with variable Mach numbers. Adapting to FD002/FD004 requires regime normalization 
                or operational regime clustering.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="industrial-card">
            <div style="font-weight: 700; color: #F59E0B;">2. Single-Mode Degradation Assumption</div>
            <p style="font-size: 0.82rem; color: #94A3B8; margin-top: 4px;">
                Only High-Pressure Compressor (HPC) degradation is simulated in FD001. Dual-mode failure scenarios (such as fan blade 
                degradation in FD003/FD004) require multi-target survival models or hierarchical classification before RUL estimation.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with lim_col2:
        st.markdown("""
        <div class="industrial-card">
            <div style="font-weight: 700; color: #F59E0B;">3. Simulated vs. Physical Sensor Degradation</div>
            <p style="font-size: 0.82rem; color: #94A3B8; margin-top: 4px;">
                C-MAPSS models sensor noise via Gaussian perturbations over thermodynamic equations (Saxena et al., 2008). 
                Real aircraft data contains sensor dropouts, intermittent wiring faults, and calibration drift not represented here.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown(r"""
        <div class="industrial-card">
            <div style="font-weight: 700; color: #F59E0B;">4. Point Prediction vs. Calibrated Uncertainty</div>
            <p style="font-size: 0.82rem; color: #94A3B8; margin-top: 4px;">
                The current architecture produces point expectations ($\hat{y}_i$). While empirical fleet MAE is ±13.9 cycles, 
                operational safety requires conservative buffer margins (15 cycles) rather than assuming a single deterministic failure date.
            </p>
        </div>
        """, unsafe_allow_html=True)

"""
EngineMind — Reusable Industrial UI Components
Provides standard page headers, metric cards, artifact audit panels, and exporters.
"""

from pathlib import Path
from typing import Optional, Dict, Any
import streamlit as st
import pandas as pd

from src.data_loader import SUBSET_CATALOG


def render_page_header(
    title: str,
    subtitle: str,
    badge_label: Optional[str] = None,
    badge_type: str = "neutral"
):
    """Renders a standard, professional industrial section header."""
    badge_html = ""
    if badge_label:
        badge_html = f'<span class="badge badge-{badge_type}" style="margin-left: 12px; vertical-align: middle;">{badge_label}</span>'

    st.markdown(f"""
    <div class="page-header">
        <div style="display: flex; align-items: baseline;">
            <h1 class="page-title">{title}</h1>
            {badge_html}
        </div>
        <div class="page-subtitle">{subtitle}</div>
    </div>
    """, unsafe_allow_html=True)


def render_kpi_card(
    title: str,
    value: str,
    delta: Optional[str] = None,
    delta_positive: bool = True
):
    """Renders a high-contrast industrial metric card."""
    delta_color = "#34D399" if delta_positive else "#F87171"
    delta_html = f'<div class="kpi-delta" style="color: {delta_color};">{delta}</div>' if delta else ""
    
    st.markdown(f"""
    <div class="industrial-card">
        <div class="kpi-title">{title}</div>
        <div class="kpi-value">{value}</div>
        {delta_html}
    </div>
    """, unsafe_allow_html=True)


def render_dataset_banner(subset: str):
    """
    Renders status banner for the selected C-MAPSS subset.
    Explicitly clarifies whether a verified trained model is active or if the subset
    is available for telemetry exploration only.
    """
    meta = SUBSET_CATALOG.get(subset, {})
    has_model = meta.get("has_trained_model", False)
    
    if has_model:
        st.markdown(f"""
        <div style="background-color: rgba(16, 185, 129, 0.08); border-left: 4px solid #10B981; padding: 10px 16px; border-radius: 4px; margin-bottom: 16px;">
            <span style="font-weight: 700; color: #34D399;">DATASET ACTIVE: {subset}</span> — {meta.get('description', '')}
            <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 2px;">
                Operational Condition: <b>{meta.get('conditions')}</b> | Fault Modes: <b>{meta.get('fault_modes')}</b> | Status: <span class="badge badge-nominal">Model Active & Verified</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div style="background-color: rgba(245, 158, 11, 0.08); border-left: 4px solid #F59E0B; padding: 10px 16px; border-radius: 4px; margin-bottom: 16px;">
            <span style="font-weight: 700; color: #FBBF24;">EXPLORATION MODE: {subset}</span> — {meta.get('description', '')}
            <div style="font-size: 0.8rem; color: #CBD5E1; margin-top: 2px;">
                Operating Envelope: <b>{meta.get('conditions')}</b> | Fault Modes: <b>{meta.get('fault_modes')}</b> | Status: <span class="badge badge-warning">Exploration Only</span>
            </div>
            <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 4px;">
                ⚠️ <i>Notice: A trained ML model exists for FD001. Subsets FD002–FD004 represent multi-condition flight envelopes requiring regime-clustering pipelines before certified inference can be supported. Raw sensor trajectories and lifespan distributions are fully available for exploration.</i>
            </div>
        </div>
        """, unsafe_allow_html=True)


def render_academic_disclaimer():
    """Renders academic prototype boundary statement."""
    st.markdown("""
    <div style="background-color: #111827; border: 1px solid #1E293B; border-radius: 4px; padding: 10px 14px; margin-top: 24px; font-size: 0.78rem; color: #64748B;">
        <span style="font-weight: 600; color: #94A3B8;">ENGINEERING PROTOTYPE BOUNDARY</span>: 
        EngineMind is an academic decision-support framework trained on the NASA C-MAPSS simulation dataset.
        Predictions and maintenance categories represent statistical point estimations and heuristic decision bounds, 
        not certified civil or defense aviation airworthiness releases.
    </div>
    """, unsafe_allow_html=True)


def render_artifact_status_panel(workspace_root: Path):
    """Renders a collapsible diagnostic panel checking the presence of all generated ML artifacts."""
    artifacts = {
        "Trained Model Artifact": workspace_root / "models" / "best_model.joblib",
        "Official Test Metrics": workspace_root / "results" / "metrics" / "test_metrics.json",
        "Model Benchmark Table": workspace_root / "results" / "metrics" / "all_models_test_comparison.csv",
        "Per-Engine Test Predictions": workspace_root / "results" / "metrics" / "per_engine_predictions.csv",
        "Feature Importance Weights": workspace_root / "results" / "metrics" / "feature_importances.csv",
        "SHAP Summary Visualizations": workspace_root / "results" / "figures" / "shap_summary.png",
        "Data Validation Audit": workspace_root / "results" / "reports" / "data_validation_report.md",
    }
    
    with st.expander("System Artifacts & Telemetry Verification", expanded=False):
        for name, path in artifacts.items():
            exists = path.exists()
            dot_class = "status-dot-green" if exists else "status-dot-amber"
            status_text = "VERIFIED (Available)" if exists else "PENDING (Run pipeline to generate)"
            st.markdown(f"""
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #1E293B; font-size: 0.8rem;">
                <div><span class="status-dot {dot_class}"></span>{name}</div>
                <div style="color: {'#34D399' if exists else '#FBBF24'}; font-family: monospace;">{status_text}</div>
            </div>
            """, unsafe_allow_html=True)


def export_dataframe_button(df: pd.DataFrame, filename: str, label: str = "Export Data to CSV"):
    """Provides a clean CSV download button."""
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label=f"📥 {label}",
        data=csv,
        file_name=filename,
        mime="text/csv",
    )

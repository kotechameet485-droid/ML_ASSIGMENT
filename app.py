"""
EngineMind — Industrial Analytics Decision-Support Platform
Master Streamlit Application wiring modular UI sections and real ML artifacts.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any

import streamlit as st
import pandas as pd
import numpy as np

from src.data_loader import get_available_subsets, SUBSET_CATALOG
from src.ui.styles import apply_industrial_theme
from src.ui.components import (
    render_artifact_status_panel,
    render_academic_disclaimer
)
from src.ui.sections.overview import render_overview_section
from src.ui.sections.explorer import render_explorer_section
from src.ui.sections.prediction import render_prediction_section
from src.ui.sections.benchmark import render_benchmark_section
from src.ui.sections.explainability import render_explainability_section
from src.ui.sections.errors import render_error_analysis_section

# 1. Page Configuration
st.set_page_config(
    page_title="EngineMind — Industrial Turbofan Analytics",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. Inject Industrial Theme CSS
apply_industrial_theme()

# Paths
WORKSPACE_ROOT = Path(__file__).resolve().parent
METRICS_DIR = WORKSPACE_ROOT / "results" / "metrics"
FIGURES_DIR = WORKSPACE_ROOT / "results" / "figures"
REPORTS_DIR = WORKSPACE_ROOT / "results" / "reports"


# 3. Artifact Caching
@st.cache_data(show_spinner=False)
def load_all_artifacts() -> Dict[str, Any]:
    """Loads all real evaluation artifacts, benchmark tables, and predictions."""
    artifacts = {}
    
    # Test metrics
    test_metrics_path = METRICS_DIR / "test_metrics.json"
    if test_metrics_path.exists():
        try:
            with open(test_metrics_path, "r", encoding="utf-8") as f:
                artifacts["test_metrics"] = json.load(f)
        except Exception:
            pass
            
    # All models comparison
    benchmarks_path = METRICS_DIR / "all_models_test_comparison.csv"
    if benchmarks_path.exists():
        try:
            artifacts["benchmarks_df"] = pd.read_csv(benchmarks_path)
        except Exception:
            pass
            
    # Validation metrics
    val_metrics_path = METRICS_DIR / "validation_metrics.csv"
    if val_metrics_path.exists():
        try:
            artifacts["val_df"] = pd.read_csv(val_metrics_path)
        except Exception:
            pass
            
    # Per-engine test predictions
    engine_preds_path = METRICS_DIR / "per_engine_predictions.csv"
    if engine_preds_path.exists():
        try:
            artifacts["engine_preds_df"] = pd.read_csv(engine_preds_path)
        except Exception:
            pass
            
    # Feature importances
    feat_imp_path = METRICS_DIR / "feature_importances.csv"
    if feat_imp_path.exists():
        try:
            artifacts["feat_imp_df"] = pd.read_csv(feat_imp_path)
        except Exception:
            pass
            
    return artifacts


artifacts = load_all_artifacts()

# 4. Sidebar Configuration
st.sidebar.markdown("""
<div style="padding: 4px 0 16px 0;">
    <div style="font-size: 1.15rem; font-weight: 800; color: #38BDF8; letter-spacing: 0.05em; font-family: monospace;">
        ENGINEMIND // 01
    </div>
    <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px;">
        Turbofan Predictive Intelligence
    </div>
</div>
""", unsafe_allow_html=True)

# Dataset Subset Selector
available_subsets = get_available_subsets()
subset_format = {
    "FD001": "FD001 — Sea-Level (Active Model)",
    "FD002": "FD002 — 6 Regimes (Explore Only)",
    "FD003": "FD003 — Dual Fault (Explore Only)",
    "FD004": "FD004 — Multi-Regime/Fault (Explore Only)"
}

selected_subset = st.sidebar.selectbox(
    "Dataset Environment",
    options=available_subsets,
    index=0,
    format_func=lambda s: subset_format.get(s, s)
)

st.sidebar.markdown("---")

# Navigation items
nav_options = [
    "A. Executive Overview",
    "B. Engine Fleet Explorer",
    "C. RUL Prediction Engine",
    "D. Multi-Model Benchmark",
    "E. Sensor & Explainability",
    "F. Error Analysis & Limitations"
]

if "nav_selection" not in st.session_state:
    st.session_state["nav_selection"] = nav_options[0]

# Sidebar Navigation Control
selected_nav = st.sidebar.radio(
    "Operations Navigation",
    options=nav_options,
    index=nav_options.index(st.session_state["nav_selection"]) if st.session_state["nav_selection"] in nav_options else 0,
    key="sidebar_radio"
)
st.session_state["nav_selection"] = selected_nav

st.sidebar.markdown("---")

# Telemetry and Artifact Status Panel
render_artifact_status_panel(WORKSPACE_ROOT)

st.sidebar.markdown("""
<div style="font-size: 0.72rem; color: #64748B; margin-top: 20px;">
    NASA C-MAPSS Simulation Benchmark<br>
    Decision Support Framework v1.0<br>
    Environment: CPU-Tuned Local
</div>
""", unsafe_allow_html=True)


# 5. Section Routing
if selected_nav == "A. Executive Overview":
    render_overview_section(selected_subset, artifacts, WORKSPACE_ROOT)
elif selected_nav == "B. Engine Fleet Explorer":
    render_explorer_section(selected_subset, artifacts, WORKSPACE_ROOT)
elif selected_nav == "C. RUL Prediction Engine":
    render_prediction_section(selected_subset, artifacts, WORKSPACE_ROOT)
elif selected_nav == "D. Multi-Model Benchmark":
    render_benchmark_section(selected_subset, artifacts, WORKSPACE_ROOT)
elif selected_nav == "E. Sensor & Explainability":
    render_explainability_section(selected_subset, artifacts, WORKSPACE_ROOT)
elif selected_nav == "F. Error Analysis & Limitations":
    render_error_analysis_section(selected_subset, artifacts, WORKSPACE_ROOT)

# 6. Global Academic Boundary Footer
render_academic_disclaimer()

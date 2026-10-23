"""
EngineMind — Industrial Analytics UI Design System & Styling
Provides CSS styling, typography, status badges, and layout primitives.
"""

import streamlit as st


def apply_industrial_theme():
    """Injects custom CSS for an industrial analytics interface."""
    st.markdown("""
    <style>
        /* Base page and font configuration */
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');
        
        html, body, [class*="css"] {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #E2E8F0;
        }
        
        .stApp {
            background-color: #0B0F17;
        }

        /* Sidebar styling */
        section[data-testid="stSidebar"] {
            background-color: #0E1420;
            border-right: 1px solid #1E293B;
        }
        section[data-testid="stSidebar"] hr {
            border-color: #1E293B;
        }
        
        /* Metric and information cards */
        .industrial-card {
            background-color: #131B2B;
            border: 1px solid #1E293B;
            border-radius: 6px;
            padding: 16px 20px;
            margin-bottom: 14px;
        }
        
        .kpi-title {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #94A3B8;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .kpi-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: #F8FAFC;
            font-family: 'JetBrains Mono', monospace;
            line-height: 1.2;
        }
        
        .kpi-delta {
            font-size: 0.8rem;
            margin-top: 4px;
            font-weight: 500;
        }
        
        /* Semantic priority badges */
        .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 4px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        
        .badge-critical {
            background-color: rgba(239, 68, 68, 0.15);
            color: #F87171;
            border: 1px solid rgba(239, 68, 68, 0.35);
        }
        
        .badge-warning {
            background-color: rgba(245, 158, 11, 0.15);
            color: #FBBF24;
            border: 1px solid rgba(245, 158, 11, 0.35);
        }
        
        .badge-nominal {
            background-color: rgba(16, 185, 129, 0.15);
            color: #34D399;
            border: 1px solid rgba(16, 185, 129, 0.35);
        }
        
        .badge-neutral {
            background-color: rgba(100, 116, 139, 0.15);
            color: #94A3B8;
            border: 1px solid rgba(100, 116, 139, 0.35);
        }

        .badge-active {
            background-color: rgba(56, 189, 248, 0.15);
            color: #38BDF8;
            border: 1px solid rgba(56, 189, 248, 0.35);
        }

        /* Section headers */
        .page-header {
            border-bottom: 1px solid #1E293B;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        
        .page-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: #F8FAFC;
            margin: 0;
            letter-spacing: -0.01em;
        }
        
        .page-subtitle {
            font-size: 0.88rem;
            color: #94A3B8;
            margin-top: 4px;
        }

        /* Status indicators */
        .status-dot {
            height: 8px;
            width: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
        }
        .status-dot-green { background-color: #10B981; }
        .status-dot-amber { background-color: #F59E0B; }
        .status-dot-red { background-color: #EF4444; }

        /* Tables & DataFrames */
        .dataframe {
            background-color: #111827 !important;
            border: 1px solid #1E293B !important;
            font-size: 0.84rem !important;
        }

        /* Buttons */
        .stButton button {
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.84rem;
            border: 1px solid #334155;
            background-color: #1E293B;
            color: #E2E8F0;
            transition: all 0.15s ease-in-out;
        }
        .stButton button:hover {
            border-color: #38BDF8;
            color: #38BDF8;
            background-color: #0F172A;
        }
        
        /* Code / Monospace text */
        code {
            font-family: 'JetBrains Mono', monospace !important;
            background-color: #1E293B !important;
            color: #38BDF8 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-size: 0.82rem !important;
        }
    </style>
    """, unsafe_allow_html=True)

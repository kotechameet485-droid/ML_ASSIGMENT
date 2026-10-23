"""
EngineMind — Exploratory Data Analysis (EDA) Module
Generates analytical, publication-quality visualizations for C-MAPSS FD001 dataset.
"""

import os
import logging
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from src.data_loader import (
    load_raw_dataset,
    INDEX_COLUMNS,
    SETTING_COLUMNS,
    SENSOR_COLUMNS,
    SENSOR_METADATA,
    validate_dataset
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Academic publication aesthetics
plt.rcParams["font.sans-serif"] = "DejaVu Sans"
plt.rcParams["axes.edgecolor"] = "#333333"
plt.rcParams["axes.linewidth"] = 0.8
plt.rcParams["grid.color"] = "#E0E0E0"
plt.rcParams["grid.linestyle"] = "--"
plt.rcParams["grid.alpha"] = 0.6


def compute_training_rul(df: pd.DataFrame, clip_threshold: float = None) -> pd.DataFrame:
    """
    Computes ground truth RUL for each training engine observation:
    RUL(i, t) = max_cycle(i) - current_cycle(i)
    """
    df_copy = df.copy()
    max_cycles = df_copy.groupby("engine_id")["cycle"].max().rename("max_cycle")
    df_copy = df_copy.merge(max_cycles, on="engine_id", how="left")
    df_copy["RUL_uncapped"] = df_copy["max_cycle"] - df_copy["cycle"]
    
    if clip_threshold is not None:
        df_copy["RUL_capped"] = df_copy["RUL_uncapped"].clip(upper=clip_threshold)
    else:
        df_copy["RUL_capped"] = df_copy["RUL_uncapped"]
        
    return df_copy


def run_eda(output_dir: str = None, clip_threshold: float = 125.0):
    """
    Generates all required EDA figures and saves them into results/figures/.
    """
    workspace_root = Path(__file__).resolve().parent.parent
    fig_dir = Path(output_dir) if output_dir else (workspace_root / "results" / "figures")
    fig_dir.mkdir(parents=True, exist_ok=True)

    train_df, test_df, rul_df = load_raw_dataset("FD001")
    train_labeled = compute_training_rul(train_df, clip_threshold=clip_threshold)
    report = validate_dataset(train_df, test_df, rul_df)

    informative_sensors = report["informative_sensors"]
    constant_sensors = report["constant_sensors"]

    logger.info("Generating Figure 1: Dataset Overview & Lifespan Summary...")
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    
    # Train failure cycles vs Test observed cycles
    train_max = train_df.groupby("engine_id")["cycle"].max()
    test_max = test_df.groupby("engine_id")["cycle"].max()
    
    axes[0].boxplot([train_max.values, test_max.values], tick_labels=["Train (Failure Endpoint)", "Test (Censored Trajectory)"], patch_artist=True,
                    boxprops=dict(facecolor="#2b5c8f", alpha=0.7), medianprops=dict(color="red", linewidth=2))
    axes[0].set_ylabel("Operating Cycles", fontsize=11)
    axes[0].set_title("Fleet Operational Cycles: Train vs Test", fontsize=12, fontweight="bold")
    axes[0].grid(True)

    # Test Ground Truth RUL distribution
    sns.histplot(rul_df["true_rul"], kde=True, ax=axes[1], color="#d95f02", bins=15)
    axes[1].axvline(rul_df["true_rul"].mean(), color="black", linestyle="--", label=f"Mean: {rul_df['true_rul'].mean():.1f}")
    axes[1].axvline(rul_df["true_rul"].median(), color="blue", linestyle=":", label=f"Median: {rul_df['true_rul'].median():.1f}")
    axes[1].set_xlabel("Ground Truth RUL at Last Observed Cycle", fontsize=11)
    axes[1].set_ylabel("Engine Count", fontsize=11)
    axes[1].set_title("Test Fleet Ground Truth Remaining Useful Life", fontsize=12, fontweight="bold")
    axes[1].legend()
    axes[1].grid(True)

    plt.tight_layout()
    fig.savefig(fig_dir / "dataset_overview.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 2: Engine Lifespan Distribution...")
    fig, ax = plt.subplots(figsize=(8, 5))
    sns.histplot(train_max, kde=True, color="#1f78b4", bins=20, ax=ax)
    ax.axvline(train_max.mean(), color="red", linestyle="--", linewidth=1.5, label=f"Mean: {train_max.mean():.1f} cycles")
    ax.axvline(train_max.min(), color="orange", linestyle=":", linewidth=1.5, label=f"Min: {train_max.min()} cycles")
    ax.axvline(train_max.max(), color="green", linestyle=":", linewidth=1.5, label=f"Max: {train_max.max()} cycles")
    ax.set_title("Training Fleet Run-to-Failure Lifespan Distribution (N=100 Engines)", fontsize=12, fontweight="bold")
    ax.set_xlabel("Engine Lifespan (Total Cycles to Failure)", fontsize=11)
    ax.set_ylabel("Frequency", fontsize=11)
    ax.legend()
    ax.grid(True)
    plt.tight_layout()
    fig.savefig(fig_dir / "engine_lifespan_distribution.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 3: RUL Target Distribution (Uncapped vs Capped)...")
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    sns.histplot(train_labeled["RUL_uncapped"], bins=30, kde=True, ax=axes[0], color="#7570b3")
    axes[0].set_title("Uncapped RUL Distribution\n(Linear assumption across entire lifespan)", fontsize=11, fontweight="bold")
    axes[0].set_xlabel("Remaining Useful Life (Cycles)", fontsize=11)
    axes[0].set_ylabel("Observation Count", fontsize=11)
    axes[0].grid(True)

    sns.histplot(train_labeled["RUL_capped"], bins=30, kde=False, ax=axes[1], color="#1b9e77")
    axes[1].axvline(clip_threshold, color="red", linestyle="--", label=f"Clipping Threshold = {clip_threshold}")
    axes[1].set_title(f"Piecewise-Linear Capped RUL (Threshold={clip_threshold})\n(Healthy state capped; degradation monitored afterwards)", fontsize=11, fontweight="bold")
    axes[1].set_xlabel("Remaining Useful Life (Cycles)", fontsize=11)
    axes[1].set_ylabel("Observation Count", fontsize=11)
    axes[1].legend()
    axes[1].grid(True)
    plt.tight_layout()
    fig.savefig(fig_dir / "rul_target_distribution_uncapped_vs_capped.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 4: Sensor Distributions (Informative Sensors)...")
    top_sensors = informative_sensors[:8]
    fig, axes = plt.subplots(2, 4, figsize=(16, 8))
    axes = axes.flatten()
    for idx, s in enumerate(top_sensors):
        sns.boxplot(y=train_df[s], ax=axes[idx], color="#a6cee3", width=0.4)
        desc = SENSOR_METADATA.get(s, {}).get("desc", s)
        unit = SENSOR_METADATA.get(s, {}).get("unit", "")
        axes[idx].set_title(f"{s}\n({desc})", fontsize=9, fontweight="bold")
        axes[idx].set_ylabel(unit, fontsize=9)
        axes[idx].grid(True)
    plt.suptitle("Distribution and Outlier Profile of Primary Informative Sensors", fontsize=13, fontweight="bold")
    plt.tight_layout()
    fig.savefig(fig_dir / "sensor_distributions.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 5: Sensor Correlation Heatmap...")
    corr_cols = informative_sensors + ["RUL_uncapped"]
    corr_matrix = train_labeled[corr_cols].corr()
    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap="coolwarm", cbar=True, ax=ax,
                linewidths=0.5, annot_kws={"size": 8})
    ax.set_title("Pearson Correlation Heatmap: Informative Sensors vs Target RUL", fontsize=12, fontweight="bold")
    plt.tight_layout()
    fig.savefig(fig_dir / "sensor_correlation_heatmap.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 6: Sensor Trends Across Operating Cycles...")
    # Representative engines: Short life (e.g., Engine 39), Medium life (e.g., Engine 1), Long life (e.g., Engine 69)
    sample_engines = [39, 1, 69]
    trend_sensors = ["sensor_2", "sensor_3", "sensor_4", "sensor_11"]  # T24, T30, T50, Ps30
    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    axes = axes.flatten()

    colors = {39: "#e41a1c", 1: "#377eb8", 69: "#4daf4a"}
    for idx, s in enumerate(trend_sensors):
        ax = axes[idx]
        desc = SENSOR_METADATA.get(s, {}).get("desc", s)
        unit = SENSOR_METADATA.get(s, {}).get("unit", "")
        for eid in sample_engines:
            eng_data = train_labeled[train_labeled["engine_id"] == eid]
            ax.plot(eng_data["cycle"], eng_data[s], label=f"Engine {eid} (Fail @ {eng_data['cycle'].max()})",
                    color=colors[eid], alpha=0.85, linewidth=1.2)
        ax.set_title(f"{s}: {desc} [{unit}]", fontsize=10, fontweight="bold")
        ax.set_xlabel("Operating Cycle", fontsize=9)
        ax.set_ylabel(unit, fontsize=9)
        ax.grid(True)
        if idx == 0:
            ax.legend(fontsize=8)

    plt.suptitle("Degradation Signatures: Sensor Trajectories Leading to Engine Run-to-Failure", fontsize=13, fontweight="bold")
    plt.tight_layout()
    fig.savefig(fig_dir / "sensor_trends_representative_engines.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 7: Operating Settings Distribution...")
    fig, axes = plt.subplots(1, 3, figsize=(14, 4))
    for idx, setting in enumerate(SETTING_COLUMNS):
        sns.histplot(train_df[setting], ax=axes[idx], color="#e7298a", bins=20)
        axes[idx].set_title(f"{setting} (Var = {train_df[setting].var():.2e})", fontsize=10, fontweight="bold")
        axes[idx].grid(True)
    plt.suptitle("Analysis of Operational Settings in FD001 (Sea Level Condition)", fontsize=12, fontweight="bold")
    plt.tight_layout()
    fig.savefig(fig_dir / "operating_settings_distribution.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 8: Constant & Low-Variance Sensor Variance Analysis...")
    fig, ax = plt.subplots(figsize=(12, 5))
    variances = train_df[SENSOR_COLUMNS].var().sort_values()
    bar_colors = ["#e41a1c" if s in constant_sensors else "#377eb8" for s in variances.index]
    variances.plot(kind="bar", color=bar_colors, ax=ax, logy=True)
    ax.axhline(1e-5, color="black", linestyle="--", label="Variance Threshold (1e-5)")
    ax.set_title("Sensor Variance Spectrum (Log Scale) Identifying Uninformative Features in FD001", fontsize=11, fontweight="bold")
    ax.set_ylabel("Variance (Log Scale)", fontsize=10)
    ax.set_xlabel("Sensor Channels", fontsize=10)
    ax.legend(["Zero/Low Variance Threshold", "Constant Sensor (Pruned)", "Informative Sensor (Retained)"])
    ax.grid(True, which="both")
    plt.tight_layout()
    fig.savefig(fig_dir / "constant_sensors_variance_analysis.png", dpi=200)
    plt.close()

    logger.info("Generating Figure 9: Relationships between Key Sensors and RUL...")
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
    key_sensors = ["sensor_11", "sensor_4", "sensor_12"]
    for idx, s in enumerate(key_sensors):
        desc = SENSOR_METADATA.get(s, {}).get("desc", s)
        sns.regplot(data=train_labeled.sample(n=2000, random_state=42), x=s, y="RUL_uncapped",
                    ax=axes[idx], scatter_kws={"alpha": 0.2, "color": "#2c7bb6"}, line_kws={"color": "red"})
        axes[idx].set_title(f"{s}: {desc}\nvs RUL", fontsize=10, fontweight="bold")
        axes[idx].set_ylabel("Ground Truth RUL", fontsize=9)
        axes[idx].grid(True)
    plt.suptitle("Direct Sensor Correlation with Engine Remaining Useful Life", fontsize=12, fontweight="bold")
    plt.tight_layout()
    fig.savefig(fig_dir / "sensor_vs_rul_scatter.png", dpi=200)
    plt.close()

    logger.info("All EDA analytical charts successfully saved to results/figures/.")


if __name__ == "__main__":
    run_eda()

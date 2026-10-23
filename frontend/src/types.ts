export interface DatasetOverview {
  subset: string;
  conditions: string;
  fault_modes: string;
  train_engines: number;
  test_engines: number;
  train_observations: number;
  test_observations: number;
  sensor_count: number;
  operating_settings_count: number;
  missing_values: number;
  duplicate_cycles: number;
  train_lifespan_min: number;
  train_lifespan_max: number;
  train_lifespan_mean: number;
  has_trained_model: boolean;
  model_status: string;
  description: string;
}

export interface DatasetItem {
  subset: string;
  is_available: boolean;
  conditions: string;
  fault_modes: string;
  train_engines: number;
  test_engines: number;
  has_trained_model: boolean;
  model_status: string;
  description: string;
}

export interface EngineItem {
  engine_id: number;
  min_cycle: number;
  max_cycle: number;
  total_cycles: number;
  ground_truth_rul?: number;
}

export interface PredictionResult {
  engine_id: number;
  subset: string;
  terminal_cycle: number;
  predicted_rul: number;
  margin_of_error: number;
  priority_category: 'CRITICAL' | 'WARNING' | 'NOMINAL';
  recommended_action: string;
  model_name: string;
  ground_truth_rul?: number;
  residual?: number;
  timestamp: string;
}

export interface FleetPriorityItem {
  engine_id: number;
  terminal_cycle: number;
  predicted_rul: number;
  priority_category: 'CRITICAL' | 'WARNING' | 'NOMINAL';
  recommended_action: string;
  ground_truth_rul?: number;
  residual?: number;
}

export interface BenchmarkItem {
  model: string;
  feature_set: string;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  nasa_score: number;
  mae_improvement_pct?: string;
  nasa_reduction_pct?: string;
  val_mae_mean?: number;
  val_rmse_mean?: number;
  algorithm_family?: string;
  description?: string;
}

export interface ValidationItem {
  model_name: string;
  feature_set: string;
  val_mae_mean: number;
  val_mae_std: number;
  val_rmse_mean: number;
  val_rmse_std: number;
  val_r2_mean: number;
  fit_time_sec: number;
  limitations: string;
}

export interface FeatureImportanceItem {
  rank: number;
  feature: string;
  importance: number;
  physical_description: string;
}

export interface SensorMetadataItem {
  sensor_id: string;
  description: string;
  unit: string;
  constant_in_fd001: boolean;
}

export interface ErrorSummary {
  total_engines_evaluated: number;
  mae: number;
  rmse: number;
  mean_residual: number;
  median_absolute_error: number;
  max_absolute_error: number;
  overestimated_count: number;
  underestimated_count: number;
  exact_count: number;
  within_5_cycles_pct: number;
  within_10_cycles_pct: number;
  within_15_cycles_pct: number;
  nasa_phm08_score: number;
  residual_definition: string;
}

export interface ErrorEngineItem {
  engine_id: number;
  last_observed_cycle: number;
  true_rul: number;
  predicted_rul: number;
  residual: number;
  absolute_error: number;
  error_type: string;
}

export interface RulBracketItem {
  bracket: string;
  engine_count: number;
  mae: number;
  rmse: number;
  mean_residual: number;
  tendency: string;
}

export interface ArtifactStatusItem {
  name: string;
  path: string;
  exists: boolean;
  description: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  python_version: string;
  platform: string;
  workspace_root: string;
  model_loaded: boolean;
  model_file_size_bytes: number;
  timestamp: string;
}

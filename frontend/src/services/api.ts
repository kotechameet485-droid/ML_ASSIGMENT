import type {
  DatasetItem,
  DatasetOverview,
  EngineItem,
  PredictionResult,
  FleetPriorityItem,
  BenchmarkItem,
  ValidationItem,
  FeatureImportanceItem,
  SensorMetadataItem,
  ErrorSummary,
  ErrorEngineItem,
  RulBracketItem,
  ArtifactStatusItem,
  HealthStatus
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDatasets(): Promise<DatasetItem[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error(`Failed to list datasets: ${res.statusText}`);
  return res.json();
}

export async function fetchDatasetOverview(subset: string): Promise<DatasetOverview> {
  const res = await fetch(`${API_BASE}/datasets/${subset}/overview`);
  if (!res.ok) throw new Error(`Failed to load dataset overview: ${res.statusText}`);
  return res.json();
}

export async function fetchEngines(subset: string, partition: 'train' | 'test' = 'test'): Promise<{ total_engines: number; engines: EngineItem[] }> {
  const res = await fetch(`${API_BASE}/datasets/${subset}/engines?partition=${partition}`);
  if (!res.ok) throw new Error(`Failed to list engines: ${res.statusText}`);
  return res.json();
}

export async function fetchTelemetry(
  subset: string,
  engineId: number,
  partition: 'train' | 'test' = 'test'
): Promise<{ engine_id: number; telemetry: Record<string, any>[]; ground_truth_rul?: number }> {
  const res = await fetch(`${API_BASE}/datasets/${subset}/engines/${engineId}/telemetry?partition=${partition}`);
  if (!res.ok) throw new Error(`Failed to load engine telemetry: ${res.statusText}`);
  return res.json();
}

export async function predictEngineRul(
  subset: string,
  engineId: number,
  critThresh: number = 25,
  warnThresh: number = 60
): Promise<PredictionResult> {
  const res = await fetch(
    `${API_BASE}/predictions/${subset}/${engineId}?critical_threshold=${critThresh}&warning_threshold=${warnThresh}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function fetchFleetPriorityQueue(
  subset: string,
  critThresh: number = 25,
  warnThresh: number = 60
): Promise<FleetPriorityItem[]> {
  const res = await fetch(
    `${API_BASE}/predictions/fleet/queue/${subset}?critical_threshold=${critThresh}&warning_threshold=${warnThresh}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch fleet priority queue');
  }
  return res.json();
}

export async function fetchTestBenchmarks(): Promise<BenchmarkItem[]> {
  const res = await fetch(`${API_BASE}/benchmarks/test`);
  if (!res.ok) throw new Error('Failed to load test benchmarks');
  return res.json();
}

export async function fetchValidationBenchmarks(): Promise<ValidationItem[]> {
  const res = await fetch(`${API_BASE}/benchmarks/validation`);
  if (!res.ok) throw new Error('Failed to load validation benchmarks');
  return res.json();
}

export async function fetchTuningResults(): Promise<any> {
  const res = await fetch(`${API_BASE}/benchmarks/tuning`);
  if (!res.ok) throw new Error('Failed to load tuning results');
  return res.json();
}

export async function fetchFeatureImportances(limit: number = 20): Promise<FeatureImportanceItem[]> {
  const res = await fetch(`${API_BASE}/explainability/features?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load feature importances');
  return res.json();
}

export async function fetchSensorCatalog(): Promise<SensorMetadataItem[]> {
  const res = await fetch(`${API_BASE}/explainability/sensors`);
  if (!res.ok) throw new Error('Failed to load sensor catalog');
  return res.json();
}

export async function fetchErrorSummary(): Promise<ErrorSummary> {
  const res = await fetch(`${API_BASE}/errors/summary`);
  if (!res.ok) throw new Error('Failed to load error summary');
  return res.json();
}

export async function fetchEngineErrors(filterType: 'all' | 'over' | 'under' = 'all'): Promise<ErrorEngineItem[]> {
  const param = filterType === 'all' ? '' : `?filter_type=${filterType}`;
  const res = await fetch(`${API_BASE}/errors/engines${param}`);
  if (!res.ok) throw new Error('Failed to load engine errors');
  return res.json();
}

export async function fetchRulBrackets(): Promise<RulBracketItem[]> {
  const res = await fetch(`${API_BASE}/errors/brackets`);
  if (!res.ok) throw new Error('Failed to load RUL bracket errors');
  return res.json();
}

export async function fetchArtifactsStatus(): Promise<ArtifactStatusItem[]> {
  const res = await fetch(`${API_BASE}/artifacts/status`);
  if (!res.ok) throw new Error('Failed to load artifact statuses');
  return res.json();
}

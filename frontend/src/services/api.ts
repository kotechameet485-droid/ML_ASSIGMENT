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

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson && typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (errJson && Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail || fallbackMessage);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthStatus>(res, 'Health check failed');
}

export async function fetchDatasets(): Promise<DatasetItem[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  return handleResponse<DatasetItem[]>(res, 'Failed to list datasets');
}

export async function fetchDatasetOverview(subset: string): Promise<DatasetOverview> {
  const res = await fetch(`${API_BASE}/datasets/${subset}/overview`);
  return handleResponse<DatasetOverview>(res, `Failed to load dataset overview for ${subset}`);
}

export async function fetchEngines(subset: string, partition: 'train' | 'test' = 'test'): Promise<{ total_engines: number; engines: EngineItem[] }> {
  const res = await fetch(`${API_BASE}/datasets/${subset}/engines?partition=${partition}`);
  return handleResponse<{ total_engines: number; engines: EngineItem[] }>(res, `Failed to list ${partition} engines`);
}

export async function fetchTelemetry(
  subset: string,
  engineId: number,
  partition: 'train' | 'test' = 'test'
): Promise<{ engine_id: number; telemetry: Record<string, any>[]; ground_truth_rul?: number }> {
  const res = await fetch(`${API_BASE}/datasets/${subset}/engines/${engineId}/telemetry?partition=${partition}`);
  return handleResponse<{ engine_id: number; telemetry: Record<string, any>[]; ground_truth_rul?: number }>(
    res,
    `Failed to load telemetry for engine #${engineId}`
  );
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
  return handleResponse<PredictionResult>(res, `Prediction failed for engine #${engineId}`);
}

export async function fetchFleetPriorityQueue(
  subset: string,
  critThresh: number = 25,
  warnThresh: number = 60
): Promise<FleetPriorityItem[]> {
  const res = await fetch(
    `${API_BASE}/predictions/fleet/queue/${subset}?critical_threshold=${critThresh}&warning_threshold=${warnThresh}`
  );
  return handleResponse<FleetPriorityItem[]>(res, 'Failed to fetch fleet priority queue');
}

export async function fetchTestBenchmarks(): Promise<BenchmarkItem[]> {
  const res = await fetch(`${API_BASE}/benchmarks/test`);
  return handleResponse<BenchmarkItem[]>(res, 'Failed to load test benchmarks');
}

export async function fetchValidationBenchmarks(): Promise<ValidationItem[]> {
  const res = await fetch(`${API_BASE}/benchmarks/validation`);
  return handleResponse<ValidationItem[]>(res, 'Failed to load validation benchmarks');
}

export async function fetchTuningResults(): Promise<any> {
  const res = await fetch(`${API_BASE}/benchmarks/tuning`);
  return handleResponse<any>(res, 'Failed to load tuning results');
}

export async function fetchFeatureImportances(limit: number = 20): Promise<FeatureImportanceItem[]> {
  const res = await fetch(`${API_BASE}/explainability/features?limit=${limit}`);
  return handleResponse<FeatureImportanceItem[]>(res, 'Failed to load feature importances');
}

export async function fetchSensorCatalog(): Promise<SensorMetadataItem[]> {
  const res = await fetch(`${API_BASE}/explainability/sensors`);
  return handleResponse<SensorMetadataItem[]>(res, 'Failed to load sensor catalog');
}

export async function fetchErrorSummary(): Promise<ErrorSummary> {
  const res = await fetch(`${API_BASE}/errors/summary`);
  return handleResponse<ErrorSummary>(res, 'Failed to load error summary');
}

export async function fetchEngineErrors(filterType: 'all' | 'over' | 'under' = 'all'): Promise<ErrorEngineItem[]> {
  const param = filterType === 'all' ? '' : `?filter_type=${filterType}`;
  const res = await fetch(`${API_BASE}/errors/engines${param}`);
  return handleResponse<ErrorEngineItem[]>(res, 'Failed to load engine errors');
}

export async function fetchRulBrackets(): Promise<RulBracketItem[]> {
  const res = await fetch(`${API_BASE}/errors/brackets`);
  return handleResponse<RulBracketItem[]>(res, 'Failed to load RUL bracket errors');
}

export async function fetchArtifactsStatus(): Promise<ArtifactStatusItem[]> {
  const res = await fetch(`${API_BASE}/artifacts/status`);
  return handleResponse<ArtifactStatusItem[]>(res, 'Failed to load artifact statuses');
}

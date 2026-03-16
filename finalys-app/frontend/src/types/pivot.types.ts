// /frontend/src/types/pivot.types.ts

// The request payload that the UI will build and send to the API
export interface PivotRequestParams {
  datasetIds: string[]; // <-- Updated to array for multi-dataset selection
  dimensions: string[];
  measures: string[];
  filters?: Record<string, any>;
  includeAdjustments?: boolean;
}

// The shape of a single row returned from the BigQuery API
export interface PivotRow {
  datasetId: string; // <-- BigQuery now returns this to distinguish datasets
  amount: number;
  [key: string]: any; // Allows for dynamic dimensions (e.g., dim01, dim02, period_id)
}

// The exact response format coming from your Express route
export interface PivotDataResponse {
  rows: PivotRow[];
}
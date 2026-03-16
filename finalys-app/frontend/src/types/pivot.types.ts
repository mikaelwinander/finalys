// /frontend/src/types/pivot.types.ts

export interface PivotRequestParams {
  datasetId: string;
  dimensions: string[];
  measures: string[];
  filters?: Record<string, string>;
  includeAdjustments?: boolean; // Add this line!
}

export interface PivotRow {
  [key: string]: any;
}
  
  export interface PivotDataResponse {
    rows: PivotRow[];
  }
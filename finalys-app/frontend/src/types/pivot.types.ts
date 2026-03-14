// /frontend/src/types/pivot.types.ts

export interface PivotRequestParams {
    datasetId: string;
    dimensions: string[];
    measures: string[];
    filters?: Record<string, any>;
  }
  
  export interface PivotRow {
    [key: string]: string | number;
  }
  
  export interface PivotDataResponse {
    rows: PivotRow[];
  }
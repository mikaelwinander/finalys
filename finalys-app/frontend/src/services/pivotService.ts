// /frontend/src/services/pivotService.ts
import type { PivotRequestParams, PivotDataResponse } from '../types/pivot.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const pivotService = {
  /**
   * Fetches summarized analytics data from the API layer.
   */
  async getPivotData(params: PivotRequestParams, token: string): Promise<PivotDataResponse> {
    // Convert arrays/objects to JSON strings for the GET request query parameters
    const queryParams = new URLSearchParams({
      datasetId: params.datasetId,
      dimensions: JSON.stringify(params.dimensions),
      measures: JSON.stringify(params.measures),
      ...(params.filters && { filters: JSON.stringify(params.filters) }),
    });

    const response = await fetch(`${API_BASE_URL}/pivot-data?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Identity Platform token
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    return response.json();
  }
};
import type { PivotRequestParams, PivotDataResponse } from '../types/pivot.types';

const API_BASE_URL = '/api';

export const pivotService = {
  async getPivotData(params: PivotRequestParams, token: string): Promise<PivotDataResponse> {
    const queryParams = new URLSearchParams({
      datasetIds: JSON.stringify(params.datasetIds), 
      dimensions: JSON.stringify(params.dimensions),
      measures: JSON.stringify(params.measures),
      _t: Date.now().toString() // Cache buster forces a fresh request
    });

    // --- NEW: Add the AI Adjustments Toggle Flag ---
    // If includeAdjustments is explicitly false, send 'false'. Otherwise default to 'true'.
    const shouldInclude = params.includeAdjustments !== false;
    queryParams.append('includeAdjustments', String(shouldInclude));
    // -----------------------------------------------

    // Only append filters if it actually has keys (prevents sending %7B%7D)
    if (params.filters && Object.keys(params.filters).length > 0) {
      queryParams.append('filters', JSON.stringify(params.filters));
    }

    const response = await fetch(`${API_BASE_URL}/pivot-data?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    return response.json();
  },

  async getDimensionMapping(token: string): Promise<Record<string, string>> {
    const response = await fetch(`${API_BASE_URL}/dimensions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    
    // Explicitly pull the flattened dictionary from the new payload
    return json.dictionary || {};
  }
};
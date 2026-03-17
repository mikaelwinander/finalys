// finalys-app/frontend/src/services/simulationService.ts

const API_BASE_URL = '/api';

export const simulationService = {
  /**
   * Sends the adjustment request to the backend API
   */
  async processAdjustment(data: {
    datasetId: string;
    coordinates: Record<string, string>;
    oldValue: number;
    userInput: string;
  }, authToken: string) { // <-- Strictly typed as string
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // <-- UNCOMMENTED AND ACTIVE
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process simulation');
    }

    return await response.json();
  },

  /**
   * Fetches the history of adjustments
   */
  async getHistory(datasetId: string, authToken: string) { // <-- Added authToken
    const response = await fetch(`${API_BASE_URL}/adjustments?datasetId=${datasetId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}` // <-- ADDED HEADER
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  },

  /**
   * Undoes a specific adjustment batch
   */
  async undoAdjustment(datasetId: string, timestampId: string, authToken: string) { // <-- Fixed 'p0' to 'authToken'
    const response = await fetch(`${API_BASE_URL}/adjustments/${encodeURIComponent(timestampId)}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // <-- ADDED HEADER
      },
      body: JSON.stringify({ datasetId })
    });
    
    if (!response.ok) throw new Error('Failed to undo adjustment');
    return await response.json();
  }
};
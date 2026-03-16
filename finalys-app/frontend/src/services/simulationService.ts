const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'https://9000-firebase-finalys-1773513026000.cluster-2a24trvdezeggvmpy7fccga2ee.cloudworkstations.dev/api';

export const simulationService = {
  /**
   * Sends the adjustment request to the backend API
   */
  async processAdjustment(data: {
    datasetId: string;
    coordinates: Record<string, string>;
    oldValue: number;
    userInput: string;
  }) {
    // Removed /pivot - now it correctly points to /api/simulate
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}` // Assuming handled globally or add token if needed
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
  async getHistory(datasetId: string) {
    // Removed /pivot - now it correctly points to /api/adjustments
    const response = await fetch(`${API_BASE_URL}/adjustments?datasetId=${datasetId}`);
    
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  },

  /**
   * Undoes a specific adjustment batch
   */
  async undoAdjustment(datasetId: string, timestampId: string) {
    // Removed /pivot - now it correctly points to /api/adjustments/12345
    const response = await fetch(`${API_BASE_URL}/adjustments/${encodeURIComponent(timestampId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId })
    });
    
    if (!response.ok) throw new Error('Failed to undo adjustment');
    return await response.json();
  }
};
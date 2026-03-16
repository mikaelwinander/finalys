// Use "as string" to tell TypeScript this will be a valid string at runtime
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
    // We assume the user's token is handled by a global interceptor or passed here
    const response = await fetch(`${API_BASE_URL}/pivot/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}` // Add this when you enable Auth
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process simulation');
    }

    return await response.json();
  }
};
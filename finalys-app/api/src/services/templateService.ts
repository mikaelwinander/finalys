import { logger } from '../utils/logger';

export interface PivotTemplate {
  templateId: string;
  datasetId: string;
  name: string;
  allowedDimensions: string[]; 
  allowedMeasures: string[];   
  mandatoryFilters?: Record<string, string>; 
}

export const templateService = {
  /**
   * Retrieves the template definition from Azure SQL.
   * Mocked for now.
   */
  async getTemplate(clientId: string, templateId: string): Promise<PivotTemplate | null> {
    logger.debug(`Fetching template ${templateId} for client ${clientId} from Azure SQL`);
    
    // MOCK IMPLEMENTATION:
    // In production, execute a query against Azure SQL here.
    if (templateId === 'demo-template-1') {
      return {
        templateId: 'demo-template-1',
        datasetId: 'dataset-123',
        name: 'Basic Regional View',
        allowedDimensions: ['dim01', 'dim02', 'period_id'], // Explicitly restrictive
        allowedMeasures: ['amount'],
        mandatoryFilters: {
          'status': 'active' // Example of an admin-enforced background filter
        }
      };
    }

    return null;
  }
};
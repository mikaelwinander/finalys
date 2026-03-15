// /api/src/services/bigqueryService.ts
import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../utils/logger';

const bqClient = new BigQuery({ projectId: 'snbx-efcpa-effectplan-vcdm' });

// --- STRICT ALLOWLIST FOR SQL INJECTION PREVENTION ---
const ALLOWED_DIMENSIONS = [
  'period_id', 
  'amount_type_id', 
  'dim01', 'dim02', 'dim03', 'dim04', 'dim05', 'dim06', 
  'dim07', 'dim08', 'dim09', 'dim10', 'dim11', 'dim12'
];
const ALLOWED_MEASURES = ['amount'];

export interface PivotQueryRequest {
  tenantId: string;
  userId: string;
  datasetId: string;
  dimensions: string[];
  measures: string[];
}

export const bigqueryService = {
  // 1. Fetch Aggregated Pivot Data (Renamed to match controller and using the interface)
  async getPivotAggregation(request: PivotQueryRequest): Promise<any[]> {
    // Destructure the properties from the request object
    const { tenantId, datasetId, dimensions, measures } = request;

    try {
      const safeDimensions = dimensions.filter(dim => ALLOWED_DIMENSIONS.includes(dim));
      const safeMeasures = measures.filter(measure => ALLOWED_MEASURES.includes(measure));

      if (safeDimensions.length === 0 || safeMeasures.length === 0) {
        throw new Error('Invalid dimensions or measures requested');
      }

      const selectColumns = safeDimensions.join(', ');
      const groupByColumns = safeDimensions.join(', ');
      const selectMeasures = safeMeasures.map(m => `SUM(${m}) AS ${m}`).join(', ');

      const query = `
        SELECT 
          ${selectColumns},
          ${selectMeasures}
        FROM 
          \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
        WHERE 
          tenant_id = @tenantId
          AND dataset_id = @datasetId
        GROUP BY 
          ${groupByColumns}
      `;

      const options = {
        query: query,
        params: { tenantId, datasetId },
      };

      const [job] = await bqClient.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      return rows;
    } catch (error: any) {
      logger.error('BigQuery execution failed', { error, query: error?.query, params: error?.params });
      throw new Error('Analytics database query failed');
    }
  },

  // 2. Fetch Available Datasets (Versions) for a Tenant
  async getAvailableDatasets(tenantId: string): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT dataset_id 
        FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
        WHERE tenant_id = @tenantId
        ORDER BY dataset_id DESC
      `;

      const [job] = await bqClient.createQueryJob({
        query: query,
        params: { tenantId },
      });
      
      const [rows] = await job.getQueryResults();
      
      // Extract the dataset IDs into a clean array of strings
      return rows.map(row => row.dataset_id);
    } catch (error) {
      logger.error('Failed to fetch available datasets', { error });
      throw new Error('Could not retrieve datasets');
    }
  }
};
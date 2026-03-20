//finalys-app/api/src/services/bigqueryService.ts
import { BigQuery } from '@google-cloud/bigquery';
import { sqlBuilder, PhysicalQueryRequest } from '../utils/sqlBuilder';
import { logger } from '../utils/logger';

const bqClient = new BigQuery({ projectId: 'snbx-efcpa-effectplan-vcdm' });

const ALLOWED_DIMENSIONS = [
  'period_id', 'amount_type_id', 
  'dim01', 'dim02', 'dim03', 'dim04', 'dim05', 'dim06', 
  'dim07', 'dim08', 'dim09', 'dim10', 'dim11', 'dim12'
];
const ALLOWED_MEASURES = ['amount'];
const NATIVE_DIMENSIONS = ['period_id', 'amount_type_id', 'period'];

export interface PivotQueryRequest {
  clientId: string;
  userId: string;
  datasetIds: string[];
  dimensions: string[];
  measures: string[];
  filters?: Record<string, any>;
  includeAdjustments?: boolean;
}

export const bigqueryService = {
  async getPivotAggregation(request: PivotQueryRequest): Promise<any[]> {
    const { clientId, userId, datasetIds, dimensions, measures, filters = {}, includeAdjustments = true } = request;

    try {
      // 1. Fetch Mapping
      const mappings = await this.getDimensionMapping(clientId);

      // 2. Translate Dimensions
      const physicalDimensions: string[] = [];
      for (const reqDim of dimensions) {
        if (NATIVE_DIMENSIONS.includes(reqDim)) {
          physicalDimensions.push(reqDim === 'period' ? 'period_id' : reqDim);
          continue;
        }
        const mapping = mappings.find(m => m.dim_id === reqDim);
        if (!mapping) throw new Error(`Invalid dimension requested: ${reqDim}`);
        physicalDimensions.push(`dim${String(mapping.position).padStart(2, '0')}`);
      }

      // 3. Translate Filters
      const physicalFilters: Record<string, any> = {};
      Object.entries(filters).forEach(([businessKey, value]) => {
        if (!value) return;
        if (businessKey === 'period') {
          physicalFilters['period_id'] = value;
        } else if (NATIVE_DIMENSIONS.includes(businessKey)) {
          physicalFilters[businessKey] = value;
        } else {
          const mapping = mappings.find(m => m.dim_id === businessKey);
          if (mapping) {
            physicalFilters[`dim${String(mapping.position).padStart(2, '0')}`] = value;
          }
        }
      });

      // 4. Validate
      const safeDimensions = physicalDimensions.filter(dim => ALLOWED_DIMENSIONS.includes(dim));
      const safeMeasures = measures.filter(measure => ALLOWED_MEASURES.includes(measure));
      if (safeDimensions.length === 0 || safeMeasures.length === 0) throw new Error('Invalid dims/measures');

      // 5. Build the Query (This calls the UNION ALL logic in sqlBuilder)
      const physicalRequest: PhysicalQueryRequest = {
        clientId,
        userId,
        datasetIds,
        dimensions: safeDimensions,
        measures: safeMeasures,
        filters: physicalFilters,
        includeAdjustments
      };

      const { query, params } = sqlBuilder.buildPivotQuery(physicalRequest);

      // 6. Execute Job
      const [job] = await bqClient.createQueryJob({ query, params, parameterMode: 'NAMED' });
      const [rows] = await job.getQueryResults();

      // 7. Translate results back to business keys for the frontend
      return rows.map(row => {
        const translatedRow: any = { datasetId: row.dataset_id, amount: row.amount };
        dimensions.forEach((businessDim, index) => {
          translatedRow[businessDim] = row[safeDimensions[index]];
        });
        return translatedRow;
      });

    } catch (error: any) {
      logger.error('BigQuery execution failed', { error });
      throw new Error(`BigQuery Error: ${error.message}`);
    }
  },

  async getAvailableDatasets(clientId: string): Promise<string[]> {
      const query = `
        SELECT DISTINCT dataset_id 
        FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
        WHERE client_id = @clientId
        ORDER BY dataset_id DESC
      `;
      const [job] = await bqClient.createQueryJob({ query, params: { clientId } });
      const [rows] = await job.getQueryResults();
      return rows.map(row => row.dataset_id);
  },

  async getDimensionMapping(clientId: string): Promise<any[]> {
    const query = `
      SELECT dim_id, dim_name, position
      FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.dimension_mapping\`
      WHERE client_id = @clientId
      ORDER BY position ASC
    `;
    const [job] = await bqClient.createQueryJob({ query, params: { clientId } });
    const [rows] = await job.getQueryResults();

    const nativeDimensions = [
      { dim_id: 'period_id', dim_name: 'Period', position: 0 },
      { dim_id: 'amount_type_id', dim_name: 'Amount Type', position: 0 }
    ];

    const combinedArray = [...nativeDimensions, ...rows];
    
    // NEW: Proof that the service is running this code!
    logger.info(`[SERVICE] DB returned ${rows.length} rows. Combined array has ${combinedArray.length} rows.`);
    
    return combinedArray;
  },
  /**
   * Builds a flattened ID-to-Name dictionary for the frontend UI.
   * Maps dimension IDs, dimension data member IDs, and Dataset IDs to their human-readable names.
   */
  /**
   * Builds a flattened ID-to-Name dictionary for the frontend UI.
   * Maps dimension IDs, dimension data member IDs, and Dataset IDs to their human-readable names.
   */
  async getFrontendDictionary(clientId: string): Promise<Record<string, string>> {
    const dictionary: Record<string, string> = {
      'period_id': 'Period',
      'amount_type_id': 'Amount Type',
      'amount': 'Amount',
      'Variance': 'Variance'
    };

    // 1. Map Dimension Names (e.g., 'dim01' -> 'Cost Center')
    try {
      const dimQuery = `SELECT dim_id, dim_name FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.dimension_mapping\` WHERE client_id = @clientId`;
      const [dimJob] = await bqClient.createQueryJob({ query: dimQuery, params: { clientId } });
      const [dimRows] = await dimJob.getQueryResults();
      dimRows.forEach(row => { if (row.dim_id) dictionary[row.dim_id] = row.dim_name; });
    } catch (error: any) {
      logger.warn('[getFrontendDictionary] Failed to load dimension_mapping', { error: error.message });
    }

    // 2. Map Dimension Members (e.g., 'CC-100' -> 'Marketing Dept')
    try {
      const dataQuery = `SELECT dim_data_id, dim_data_name FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.dimension_data\` WHERE client_id = @clientId`;
      const [dataJob] = await bqClient.createQueryJob({ query: dataQuery, params: { clientId } });
      const [dataRows] = await dataJob.getQueryResults();
      dataRows.forEach(row => { if (row.dim_data_id) dictionary[row.dim_data_id] = row.dim_data_name; });
    } catch (error: any) {
      logger.warn('[getFrontendDictionary] Failed to load dimension_data', { error: error.message });
    }

    // 3. Map Datasets / Plan Versions (Updated to query 'datasets' table)
    try {
      const dsQuery = `SELECT dataset_id, dataset_name FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.datasets\` WHERE client_id = @clientId`;
      const [dsJob] = await bqClient.createQueryJob({ query: dsQuery, params: { clientId } });
      const [dsRows] = await dsJob.getQueryResults();
      dsRows.forEach(row => { if (row.dataset_id) dictionary[row.dataset_id] = row.dataset_name; });
    } catch (error: any) {
      logger.warn('[getFrontendDictionary] Failed to load datasets', { error: error.message });
    }

    return dictionary;
  }
};
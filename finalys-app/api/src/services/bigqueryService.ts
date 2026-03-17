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
  }
};
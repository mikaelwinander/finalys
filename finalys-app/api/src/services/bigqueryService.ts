// /api/src/services/bigqueryService.ts
import { BigQuery } from '@google-cloud/bigquery';
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
  datasetId: string;
  dimensions: string[];
  measures: string[];
  filters?: Record<string, string>;
}

export const bigqueryService = {
  async getPivotAggregation(request: PivotQueryRequest): Promise<any[]> {
    const { clientId, datasetId, dimensions, measures, filters = {} } = request;

    try {
      // 1. Fetch the dimension mapping from BigQuery (or cache) for this client
      const mappings = await this.getDimensionMapping(clientId);

      // 2. Translate requested business dimensions into physical ones
      const physicalDimensions: string[] = [];
            
      for (const reqDim of dimensions) {
        // Check if it's a native column first
        if (NATIVE_DIMENSIONS.includes(reqDim)) {
          // Translate "period" to "period_id" if needed, otherwise push the native name
          const actualCol = reqDim === 'period' ? 'period_id' : reqDim;
          physicalDimensions.push(actualCol);
          continue;
        }

        // Otherwise, it's a custom dimension, so map it
        const mapping = mappings.find(m => m.dim_id === reqDim);
        if (!mapping) {
          throw new Error(`Invalid dimension requested: ${reqDim}`);
        }
        const paddedPosition = String(mapping.position).padStart(2, '0');
        physicalDimensions.push(`dim${paddedPosition}`);
      }

      // 3. Ensure the physical columns are valid
      const safeDimensions = physicalDimensions.filter(dim => ALLOWED_DIMENSIONS.includes(dim));
      const safeMeasures = measures.filter(measure => ALLOWED_MEASURES.includes(measure));

      if (safeDimensions.length === 0 || safeMeasures.length === 0) {
        throw new Error('Invalid dimensions or measures requested');
      }

      const selectColumns = safeDimensions.join(', ');
      const groupByColumns = safeDimensions.join(', ');
      const selectMeasures = safeMeasures.map(m => `SUM(${m}) AS ${m}`).join(', ');

      let filterSql = '';
      const queryParams: Record<string, any> = { clientId, datasetId };
      
      // Translate and apply filters safely
      Object.entries(filters).forEach(([businessKey, value], index) => {
        if (!value) return; // Skip empty filters

        let physicalCol = '';

        // 1. Handle native columns first (e.g., period, amount_type_id)
        // If your frontend sends "period", map it to the database column "period_id"
        if (businessKey === 'period') {
           physicalCol = 'period_id';
        } else if (NATIVE_DIMENSIONS.includes(businessKey)) {
           physicalCol = businessKey;
        } 
        // 2. Handle custom mapped dimensions (e.g., "kto" -> "dim01")
        else {
          const mapping = mappings.find(m => m.dim_id === businessKey);
          
          if (mapping) {
            const paddedPosition = String(mapping.position).padStart(2, '0');
            physicalCol = `dim${paddedPosition}`;
          } else {
            // logger is assumed to be imported from your utils
            logger.warn(`Unmapped filter dimension requested: ${businessKey}`);
            return; // Skip this filter and continue to the next one
          }
        }

        // 3. Ensure it is a valid allowed column to prevent SQL injection
        if (ALLOWED_DIMENSIONS.includes(physicalCol)) {
          const paramName = `filterVal${index}`;
          // Use the physical column in the SQL, but bind the actual user value
          filterSql += ` AND ${physicalCol} = @${paramName}`;
          queryParams[paramName] = value; 
        } else {
          logger.warn(`Attempted to filter on unsafe physical column: ${physicalCol}`);
        }
      });

      const query = `
        SELECT 
          ${selectColumns},
          ${selectMeasures}
        FROM 
          \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
        WHERE 
          client_id = @clientId
          AND dataset_id = @datasetId
          ${filterSql}
        GROUP BY 
          ${groupByColumns}
      `;

      const [job] = await bqClient.createQueryJob({ query, params: queryParams });
      const [rows] = await job.getQueryResults();

      // 4. Translate the results BACK to business names for the React UI
      const translatedRows = rows.map(row => {
        const translatedRow: any = { amount: row.amount };
        
        // Map dim01 back to "kto", dim02 back to "vsh", etc.
        dimensions.forEach((businessDim, index) => {
          const physicalCol = safeDimensions[index];
          translatedRow[businessDim] = row[physicalCol];
        });
        
        return translatedRow;
      });

      return translatedRows;
    } catch (error: any) {
      logger.error('BigQuery execution failed', { error });
      throw new Error(`BigQuery Error: ${error.message}`);
    }
  },

  async getAvailableDatasets(clientId: string): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT dataset_id 
        FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
        WHERE client_id = @clientId
        ORDER BY dataset_id DESC
      `;

      const [job] = await bqClient.createQueryJob({
        query: query,
        params: { clientId },
      });
      
      const [rows] = await job.getQueryResults();
      return rows.map(row => row.dataset_id);
    } catch (error: any) {
      logger.error('Failed to fetch available datasets', { error });
      throw new Error(`BigQuery Datasets Error: ${error.message}`);
    }
  },

  async getDimensionMapping(clientId: string): Promise<any[]> {
    try {
      const query = `
        SELECT dim_id, dim_name, position
        FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.dimension_mapping\`
        WHERE client_id = @clientId
        ORDER BY position ASC
      `;

      const [job] = await bqClient.createQueryJob({
        query: query,
        params: { clientId },
      });
      
      const [rows] = await job.getQueryResults();
      return rows;
    } catch (error: any) {
      logger.error('Failed to fetch dimension mapping', { error });
      throw new Error(`BigQuery Mapping Error: ${error.message}`);
    }
  }
};
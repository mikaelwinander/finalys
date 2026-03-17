// /api/src/services/simulationService.ts
import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const BQ_PROJECT = 'snbx-efcpa-effectplan-vcdm';
const DATASET = 'finalys_dataset';

// FIXED: Explicitly tell the client which project to use to run the query jobs!
const bqClient = new BigQuery({ projectId: BQ_PROJECT });

export const simulationService = {
  /**
   * Performs proportional spreading across underlying transactions.
   */
  async spreadAdjustment(params: {
    clientId: string;
    userId: string;
    datasetId: string;
    coordinates: Record<string, string>; 
    totalOldValue: number;
    totalNewValue: number;
    comment: string;
  }) {
    const { clientId, userId, datasetId, coordinates, totalOldValue, totalNewValue, comment } = params;

    // 1. Calculate the Delta Ratio
    const deltaMultiplier = (totalNewValue / totalOldValue) - 1;
    
    // 2. Generate a unique batch ID for this specific simulation event
    const timestampId = Date.now().toString(); 

    // 3. Build the WHERE clause based on cell coordinates
    const coordFilters = Object.entries(coordinates)
      .map(([key]) => `AND ${key} = @${key}`)
      .join(' ');

    // 4. FIXED: Added timestamp_id to both INSERT and SELECT clauses
    const query = `
      INSERT INTO \`${BQ_PROJECT}.${DATASET}.financial_adjustments\`
      (client_id, user_id, dataset_id, period_id, 
       dim01, dim02, dim03, dim04, dim05, dim06, 
       dim07, dim08, dim09, dim10, dim11, dim12, 
       adjustment_amount, comment, timestamp_id)
      SELECT 
        client_id, 
        @userId, 
        dataset_id, 
        period_id, 
        dim01, dim02, dim03, dim04, dim05, dim06,
        dim07, dim08, dim09, dim10, dim11, dim12,
        (amount * @multiplier) as adjustment_amount,
        @comment,
        @timestampId
      FROM \`${BQ_PROJECT}.${DATASET}.financial_data_view\`
      WHERE client_id = @clientId 
        AND dataset_id = @datasetId
        ${coordFilters}
    `;

    await bqClient.query({
      query,
      params: {
        ...coordinates,
        clientId,
        userId,
        datasetId,
        multiplier: deltaMultiplier,
        comment: comment || 'Proportional Allocation',
        timestampId // Pass the batch ID into the query
      }
    });

    logger.info(`Spread adjustment batch ${timestampId} for client ${clientId}: ${totalOldValue} -> ${totalNewValue}`);
  },

  /**
   * Fetches the recent simulation history for the audit trail
   */
  async getHistory(clientId: string, datasetId: string) {
    // FIXED: Group by the new timestamp_id instead of created_at
    const query = `
      SELECT 
        timestamp_id as id,
        MAX(CAST(created_at AS STRING)) as createdAt,
        comment,
        SUM(adjustment_amount) as totalAmount
      FROM \`${BQ_PROJECT}.${DATASET}.financial_adjustments\`
      WHERE client_id = @clientId AND dataset_id = @datasetId
      GROUP BY timestamp_id, comment
      ORDER BY createdAt DESC
      LIMIT 20
    `;

    const [rows] = await bqClient.query({
      query,
      params: { clientId, datasetId }
    });

    return rows.map(row => ({
      ...row,
      coordinates: 'Multiple Dimensions' 
    }));
  },

  /**
   * Undoes a specific simulation batch by deleting its rows
   */
  async undoAdjustment(clientId: string, datasetId: string, timestampId: string) {
    // FIXED: Target timestamp_id directly instead of casting created_at
    const query = `
      DELETE FROM \`${BQ_PROJECT}.${DATASET}.financial_adjustments\`
      WHERE client_id = @clientId 
        AND dataset_id = @datasetId 
        AND timestamp_id = @timestampId
    `;

    await bqClient.query({
      query,
      params: { clientId, datasetId, timestampId }
    });

    logger.info(`Undid simulation batch ${timestampId} for client ${clientId}`);
  }
};
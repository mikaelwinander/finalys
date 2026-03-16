import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../utils/logger';

const bqClient = new BigQuery();
const BQ_PROJECT = 'snbx-efcpa-effectplan-vcdm';
const DATASET = 'finalys_dataset';

export const simulationService = {
  /**
   * Performs proportional spreading across underlying transactions.
   */
  async spreadAdjustment(params: {
    clientId: string;
    userId: string;
    datasetId: string;
    coordinates: Record<string, string>; // e.g., { dim01: '3000', dim02: '10' }
    totalOldValue: number;
    totalNewValue: number;
    comment: string;
  }) {
    const { clientId, userId, datasetId, coordinates, totalOldValue, totalNewValue, comment } = params;

    // 1. Calculate the Delta Ratio
    // If old value was 100 and new is 110, ratio is 1.1. Delta multiplier is 0.1.
    const deltaMultiplier = (totalNewValue / totalOldValue) - 1;

    // 2. Build the WHERE clause based on cell coordinates
    const coordFilters = Object.entries(coordinates)
      .map(([key, val]) => `AND ${key} = @${key}`)
      .join(' ');

    const query = `
      INSERT INTO \`${BQ_PROJECT}.${DATASET}.financial_adjustments\`
      (client_id, user_id, dataset_id, period_id, dim01, dim02, dim03, dim04, dim05, dim06, adjustment_amount, comment)
      SELECT 
        client_id, 
        @userId, 
        dataset_id, 
        period_id, 
        dim01, dim02, dim03, dim04, dim05, dim06,
        (amount * @multiplier) as adjustment_amount,
        @comment
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
        comment: comment || 'Proportional Allocation'
      }
    });

    logger.info(`Spread adjustment for client ${clientId}: ${totalOldValue} -> ${totalNewValue}`);
  },

  /**
   * Fetches the recent simulation history for the audit trail
   */
  async getHistory(clientId: string, datasetId: string) {
    // We group by the exact timestamp and comment to treat the spread rows as a single "Batch"
    const query = `
      SELECT 
        CAST(created_at AS STRING) as id,
        CAST(created_at AS STRING) as createdAt,
        comment,
        SUM(adjustment_amount) as totalAmount
      FROM \`${BQ_PROJECT}.${DATASET}.financial_adjustments\`
      WHERE client_id = @clientId AND dataset_id = @datasetId
      GROUP BY created_at, comment
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const [rows] = await bqClient.query({
      query,
      params: { clientId, datasetId }
    });

    return rows.map(row => ({
      ...row,
      // We extract coordinates if they were saved in the comment, otherwise default
      coordinates: 'Multiple Dimensions' 
    }));
  },

  /**
   * Undoes a specific simulation batch by deleting its rows
   */
  async undoAdjustment(clientId: string, datasetId: string, timestampId: string) {
    const query = `
      DELETE FROM \`${BQ_PROJECT}.${DATASET}.financial_adjustments\`
      WHERE client_id = @clientId 
        AND dataset_id = @datasetId 
        AND CAST(created_at AS STRING) = @timestampId
    `;

    await bqClient.query({
      query,
      params: { clientId, datasetId, timestampId }
    });

    logger.info(`Undid simulation batch ${timestampId} for client ${clientId}`);
  }
};
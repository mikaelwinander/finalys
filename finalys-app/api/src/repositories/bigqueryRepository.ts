//finalys-app/api/src/repositories/bigqueryRepository.ts
import { bqClient } from '../config/bigqueryClient';
import { logger } from '../utils/logger';

export const bigqueryRepository = {
  /**
   * Executes a parameterized BigQuery SQL statement.
   * * @param query The SQL string with @parameter placeholders.
   * @param params A dictionary of parameters to securely bind to the query.
   * @returns An array of typed row objects.
   */
  async executeQuery<T>(query: string, params: Record<string, any>): Promise<T[]> {
    try {
      const options = {
        query: query,
        params: params,
      };

      // Execute the query
      const [rows] = await bqClient.query(options);
      
      return rows as T[];
    } catch (error) {
      logger.error('BigQuery execution failed', { error, query, params });
      throw new Error('Analytics database query failed');
    }
  }
};
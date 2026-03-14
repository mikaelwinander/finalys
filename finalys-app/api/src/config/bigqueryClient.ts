import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../utils/logger';

// Initialize the BigQuery client
export const bqClient = new BigQuery();

logger.info('BigQuery client initialized');
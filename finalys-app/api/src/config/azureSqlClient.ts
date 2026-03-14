import { logger } from '../utils/logger';

// Placeholder for mssql Connection Pool
export const sqlPool = {
  connect: async () => {
    logger.info('Azure SQL connection placeholder initialized');
    return true;
  }
};
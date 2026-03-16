// /api/src/utils/clearCache.ts
import { redisClient } from '../config/redisClient';
import { logger } from './logger';

const flushCache = async () => {
  try {
    console.log('🧹 Connecting to Redis to flush all keys...');
    
    // Using flushall to ensure a completely clean slate
    await redisClient.flushall();
    
    console.log('✅ Redis cache completely cleared!');
    logger.info('Manual cache flush executed successfully');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    logger.error('Cache flush failed', { error });
  } finally {
    // Gracefully close the connection and exit the script
    await redisClient.quit();
    process.exit(0);
  }
};

flushCache();
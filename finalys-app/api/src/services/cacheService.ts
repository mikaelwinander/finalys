import { redisClient } from '../config/redisClient';
import { logger } from '../utils/logger';

// Default TTL of 5 minutes (300 seconds) as per architectural guidelines
const DEFAULT_TTL_SECONDS = 300; 

export const cacheService = {
  /**
   * Retrieves and parses JSON data from the Redis cache.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) {
        return null; // Cache miss
      }
      return JSON.parse(data) as T; // Cache hit
    } catch (error) {
      logger.error('Redis GET error', { key, error });
      return null; // Fail open: if Redis fails, proceed to query the database
    }
  },

  /**
   * Stores JSON data in the Redis cache with an expiration time.
   */
  async set(key: string, data: any, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      const stringifiedData = JSON.stringify(data);
      // SET cacheKey result TTL
      await redisClient.set(key, stringifiedData, 'EX', ttlSeconds);
    } catch (error) {
      logger.error('Redis SET error', { key, error });
    }
  },

  /**
   * Invalidates specific cache keys, useful when underlying dataset changes.
   */
  async invalidateClientCache(clientId: string): Promise<void> {
    try {
      // Find all keys starting with 'pivot:clientId:*'
      // Note: In production, consider using 'SCAN' instead of 'KEYS' for large datasets
      const pattern = `pivot:${clientId}:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys for Client: ${clientId}`);
      }
    } catch (error) {
      logger.error('Redis Invalidation error', { clientId, error });
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error });
    }
  }
};
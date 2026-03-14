import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Default to localhost for local development, override via environment variables in Cloud Run
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  // Add TLS options here if connecting to Memorystore with in-transit encryption enabled
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  logger.info('Successfully connected to Redis instance');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});
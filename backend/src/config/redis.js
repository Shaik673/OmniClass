import Redis from 'ioredis';
import { config } from './index.js';
import logger from '../utils/logger.js';

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null; // stop retrying
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
redis.on('reconnecting', () => logger.warn('Redis reconnecting'));

export { redis };

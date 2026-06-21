import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Initialize Redis Client
const redisClient = createClient({
  url: env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff capped at 3 seconds to avoid log/network spam
      return Math.min(retries * 100, 3000);
    }
  }
});

let isClientReady = false;
let reconnectionCount = 0;

redisClient.on('error', (err) => {
  // Suppress repeated logs if the error is a connection failure while the client is already down
  if (err.code === 'ECONNREFUSED' && !isClientReady) {
    return;
  }
  
  logger.error('Redis Client Error:', err.message || err);
  isClientReady = false;
});

redisClient.on('ready', () => {
  isClientReady = true;
  reconnectionCount = 0;
  logger.info('Redis connection established and client is ready.');
});

redisClient.on('reconnecting', () => {
  reconnectionCount++;
  if (reconnectionCount % 10 === 1) {
    logger.info(`Redis: Attempting to reconnect to server... (Attempt ${reconnectionCount})`);
  }
});

// Initiate connection. Initial failure is caught to allow the app to start without a cache.
if (env.REDIS_ENABLED) {
  redisClient.connect().catch(() => {
    logger.warn('Redis server not detected on startup. The application will function without caching.');
  });
} else {
  logger.info('Redis is disabled via environment configuration.');
}

export default redisClient;
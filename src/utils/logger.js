import { env } from '../config/env.js';

/**
 * Custom logger utility to provide consistent log formatting with timestamps.
 * Also prevents debug logs from cluttering the terminal in production environments.
 */
const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message, ...meta) => {
    console.log(formatMessage('info', message), ...meta);
  },
  warn: (message, ...meta) => {
    console.warn(formatMessage('warn', message), ...meta);
  },
  error: (message, error = null, ...meta) => {
    console.error(formatMessage('error', message), ...meta);
    if (error && error.stack && env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  },
  debug: (message, ...meta) => {
    if (env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message), ...meta);
    }
  }
};
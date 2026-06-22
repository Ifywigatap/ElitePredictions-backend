import './src/instrument.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';

import app from './src/app.js';
import { startCronJobs } from './src/cron.js';
import { startLiveScoreEmitter } from './src/liveScoreEmitter.js';
import { logger } from './src/utils/logger.js';
import { env } from './src/config/env.js';

const PORT = process.env.PORT || env.PORT || 5000;

/* ================= HTTP SERVER ================= */

const httpServer = createServer(app);

const allowedOrigins = new Set();
if (env.FRONTEND_URL) {
  allowedOrigins.add(env.FRONTEND_URL);
  allowedOrigins.add(env.FRONTEND_URL.replace(/\/$/, ''));
}

/* ================= SOCKET.IO ================= */

export const io = new Server(httpServer, {
  cors: {
    // Allow the frontend URL with or without a trailing slash.
    // The browser's Origin header never includes a trailing slash.
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  socket.on('request-update', (data) => {
    logger.info(`📡 request-update from ${socket.id}`, data);
  });

  socket.on('disconnect', () => {
    logger.info(`❌ Client disconnected: ${socket.id}`);
  });
});

/* ================= ROOT ROUTE ================= */

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Elite Predictions API',
    status: 'running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/* ================= SENTRY ================= */

if (env.SENTRY_ENABLED) {
  Sentry.setupExpressErrorHandler(app);
}

/* ================= SERVER START ================= */

httpServer.listen(PORT, () => {
  logger.info(
    `🚀 Elite Predictions API running on port ${PORT}`
  );

  try {
    startCronJobs();
    logger.info('⏰ Cron jobs started');
  } catch (error) {
    logger.error('Failed to start cron jobs', error);
  }

  try {
    startLiveScoreEmitter(io);
    logger.info('⚽ Live score emitter started');
  } catch (error) {
    logger.error('Failed to start live score emitter', error);
  }
});

/* ================= SHUTDOWN HANDLER ================= */

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
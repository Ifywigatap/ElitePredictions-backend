import * as Sentry from "@sentry/node";
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { logger } from './utils/logger.js';

dotenv.config();

if (process.env.SENTRY_ENABLED === 'true') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
  logger.info('Sentry initialized');
}

// Initialize Firebase Admin SDK
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    logger.info('Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK:', error);
}
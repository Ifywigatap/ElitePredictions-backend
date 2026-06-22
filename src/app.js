import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js'; // Import env config

import authRoutes from './routes/authRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import vipRoutes from './routes/vipRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { getPlans } from './controllers/paymentController.js';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { startCronJobs } from './cron.js';
import admin from 'firebase-admin'; // For Firestore health check
 // Environment variables are loaded by instrument.js

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: env.FRONTEND_URL }));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      // Allow the inline preloader script in index.html using the hash from your console error
      "script-src": ["'self'", "'sha256-vvl+lY39xjFERHJph1KDet0Uxz8d8cCG6PpKx6pB7NA='"],
      "connect-src": [
        "'self'", 
        "https://*.googleapis.com", 
        "https://*.firebaseio.com", 
        "wss://*.firebaseio.com"
      ],
      "img-src": ["'self'", "data:", "https://*.googleapis.com", "https://*.firebaseusercontent.com"],
    },
  },
}));

app.use(morgan('dev'));

app.use(express.json());

/* ================= RATE LIMITING ================= */

// Apply rate limiting to all /api routes to prevent abuse
app.use('/api', apiLimiter);

/* ================= ROUTES ================= */

app.use('/api/auth', authRoutes);

app.use('/api/predictions', predictionRoutes);

app.use('/api/vip', vipRoutes);

app.use('/api/scores', scoreRoutes);

app.use('/api/ai', aiRoutes);

app.use('/api/payments', paymentRoutes);

// Public endpoint to fetch available VIP plans
app.get('/api/plans', getPlans);

app.use('/api/webhooks', webhookRoutes);

/* ================= HEALTH CHECK ================= */

app.get('/api/health', async (req, res) => {
  try {
    // Check Firestore connectivity by trying to read a dummy document
    // Ensure this path exists and is readable, or create a specific health check document
    const db = admin.firestore();
    const healthCheckDoc = await db.collection('healthChecks').doc('apiStatus').get();

    if (!healthCheckDoc.exists) {
      // This is not a failure, but good to know. The collection/document might not have been created.
      // The check still passes as it proves we can connect to Firestore.
      console.warn('Health check document (healthChecks/apiStatus) does not exist in Firestore.');
    }

    res.status(200).json({
      status: 'UP',
      database: 'Connected to Firestore',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed due to an error with Firestore connectivity:', error);

    // The gRPC status code for NOT_FOUND is 5. This specific error often means that
    // the Firestore database has not been created in the Firebase project yet.
    // We can provide a more specific and helpful error message for this common setup issue.
    if (error.code === 5 || (error.message && error.message.includes('NOT_FOUND'))) {
      return res.status(500).json({
        status: 'DOWN',
        error: 'Firestore database not found.',
        details: 'The API could not connect to Firestore because the database does not seem to exist for this project. Please go to your Firebase project console, navigate to the "Firestore Database" section, and click "Create database".',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      status: 'DOWN',
      error: 'Failed to connect to Firestore or other dependencies.',
      details: error.message || 'An unknown error occurred during the health check.',
      timestamp: new Date().toISOString(),
    });
  }
});

/* ================= ERROR HANDLER ================= */

app.use(errorHandler);

export default app;
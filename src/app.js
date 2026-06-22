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
// More robust CORS options to handle trailing slashes gracefully.
// The browser's Origin header never includes a trailing slash.
const allowedOrigins = new Set();
if (env.FRONTEND_URL) {
  allowedOrigins.add(env.FRONTEND_URL);
  allowedOrigins.add(env.FRONTEND_URL.replace(/\/$/, ''));
}

const corsOptions = {
  origin: Array.from(allowedOrigins),
  credentials: true,
};
app.use(cors(corsOptions));

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
    const db = admin.firestore();
    const healthCheckRef = db.collection('healthChecks').doc('apiStatus');

    // Perform a write to confirm connectivity and permissions.
    // This is more robust than just reading.
    await healthCheckRef.update({
      lastChecked: admin.firestore.FieldValue.serverTimestamp(),
      status: 'healthy'
    });

    res.status(200).json({
      status: 'UP',
      database: 'Connected to Firestore (read/write OK)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // If the document doesn't exist, the update fails with code 5 (NOT_FOUND).
    // In this "self-healing" check, we attempt to create it.
    if (error.code === 5) {
      try {
        const healthCheckRef = admin.firestore().collection('healthChecks').doc('apiStatus');
        await healthCheckRef.set({
          status: 'created_by_health_check',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // If creation succeeds, the DB is healthy.
        return res.status(200).json({
          status: 'UP',
          database: 'Connected to Firestore (health check document created)',
          timestamp: new Date().toISOString(),
        });
      } catch (creationError) {
        console.error('Health check failed: Could not create health check document.', creationError);
        return res.status(500).json({
          status: 'DOWN',
          error: 'Failed to connect to Firestore.',
          details: creationError.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // For any other error, report it as a failure.
    console.error('Health check failed due to a Firestore connectivity error:', error);
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
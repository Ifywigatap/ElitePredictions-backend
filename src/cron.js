import cron from 'node-cron';
import { executeDailyPredictionGeneration, executePredictionEvaluation } from './controllers/predictionController.js';
import { logger } from './utils/logger.js';

export const startCronJobs = () => {
  // Run every day at 00:00 (Midnight) UTC
  cron.schedule('0 0 * * *', async () => {
    logger.info('⏰ CRON JOB TRIGGERED: Running daily prediction generation...');
    try {
      await executeDailyPredictionGeneration();
      logger.info('✅ CRON JOB SUCCESS: Daily predictions generated.');
    } catch (error) {
      logger.error('❌ CRON JOB ERROR: Failed to generate daily predictions', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Replace with your actual IANA timezone string
  });

  // Run every hour on the hour (e.g., 01:00, 02:00) to evaluate finished matches
  cron.schedule('0 * * * *', async () => {
    logger.info('⏰ CRON JOB TRIGGERED: Evaluating finished predictions...');
    try {
      await executePredictionEvaluation();
      logger.info('✅ CRON JOB SUCCESS: Predictions evaluated.');
    } catch (error) {
      logger.error('❌ CRON JOB ERROR: Failed to evaluate predictions', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" 
  });

  logger.info('🕰️  Cron jobs initialized and scheduled.');
};
import * as Sentry from "@sentry/node";
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENTRY_ENABLED === 'true') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}
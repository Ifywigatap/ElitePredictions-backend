import dotenv from 'dotenv';

dotenv.config();

// Add simple validation to warn you if critical env variables are missing
const requiredEnvs = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'OPENAI_API_KEY'];
requiredEnvs.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Warning: Missing required environment variable: ${envVar}`);
  }
});

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  // Use a single, clear environment variable for the frontend URL.
  // The production URL should be set in the Render environment variables.
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://elitepredicts.vercel.app', // Adjust if your local frontend runs on a different port
  
  SENTRY_ENABLED: process.env.SENTRY_ENABLED === 'true',
  // Only enable Redis if explicitly requested and URL is present
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true' && !!process.env.REDIS_URL,
  OPENAI_ENABLED: process.env.OPENAI_ENABLED === 'true' && !!process.env.OPENAI_API_KEY,

  JWT_SECRET: process.env.JWT_SECRET,

  REDIS_URL: process.env.REDIS_URL,

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  // Convert literal \n strings in the .env file to actual newlines for the RSA key
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,

  FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY,

  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || (isProd ? 'gpt-4o' : 'gpt-4o-mini'),
};
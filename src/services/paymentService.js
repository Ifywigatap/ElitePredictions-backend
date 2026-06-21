import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const initializePayment = async (email, amount, metadata = {}) => {
  try {
    const response = await paystack.post('/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack expects the amount in the smallest currency unit (e.g., kobo/cents)
      metadata,
      callback_url: `${env.FRONTEND_URL}/dashboard?payment=success`,
    });
    return response.data.data;
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message;
    logger.error('Paystack initialization error:', {
      detail: errorDetail,
      email
    });
    throw new Error(`Failed to initialize payment checkout: ${errorDetail}`);
  }
};

export const verifyPayment = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return response.data.data;
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message;
    logger.error('Paystack verification error:', {
      detail: errorDetail,
      reference
    });
    throw new Error(`Failed to verify payment: ${errorDetail}`);
  }
};
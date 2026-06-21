import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/payments/create-checkout
// @desc    Initialize VIP checkout session
// @access  Private
router.post('/create-checkout', protect, createCheckoutSession);

export default router;
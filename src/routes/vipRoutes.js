import express from 'express';
import { getVipPredictions } from '../controllers/vipController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/vip/predictions
// @desc    Get VIP predictions
// @access  Private (VIP)
router.get('/predictions', protect, getVipPredictions);

export default router;
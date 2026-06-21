import express from 'express';
import { getPredictions, getPredictionById, generateDailyPredictions } from '../controllers/predictionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getPredictions);
router.post('/generate', protect, generateDailyPredictions);
router.route('/:id').get(getPredictionById);

export default router;
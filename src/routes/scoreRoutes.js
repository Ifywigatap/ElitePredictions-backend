import express from 'express';
import { getLiveScores } from '../controllers/scoresController.js';

const router = express.Router();

// @route   GET /api/scores/live
// @desc    Get live match scores
// @access  Public
router.get('/live', getLiveScores);

export default router;
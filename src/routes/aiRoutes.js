import express from 'express';
import { getAIInsights } from '../controllers/aiController.js';

const router = express.Router();

router.get('/insights', getAIInsights);

export default router;
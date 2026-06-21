import { db } from '../config/firebase.js';

// @desc    Get VIP predictions
// @route   GET /api/vip/predictions
// @access  Private (Requires valid Firebase Token & VIP Role)
export const getVipPredictions = async (req, res, next) => {
  try {
    // Assuming our upcoming authMiddleware populates req.user
    if (!req.user || (req.user.role !== 'vip' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Access denied: VIP members only' });
    }

    // Fetch VIP predictions from Firestore
    const snapshot = await db.collection('predictions').where('isVipExclusive', '==', true).get();
    const predictions = [];

    snapshot.forEach((doc) => {
      predictions.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ success: true, data: predictions });
  } catch (error) {
    next(error);
  }
};
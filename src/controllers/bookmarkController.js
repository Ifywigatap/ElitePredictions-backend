import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

// @desc    Get all bookmarked predictions for the logged-in user
// @route   GET /api/bookmarks
// @access  Private
export const getUserBookmarks = async (req, res, next) => {
  try {
    // Firebase auth middleware attaches the user to req.user with a uid property
    const userId = req.user.uid || req.user.id;

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('savedPredictions')
      .orderBy('createdAt', 'desc')
      .get();

    const bookmarks = [];
    
    // Manually join the prediction data since NoSQL doesn't have auto-joins
    for (const docSnapshot of snapshot.docs) {
      const bookmarkData = docSnapshot.data();
      const predDoc = await db.collection('predictions').doc(bookmarkData.predictionId).get();
      
      bookmarks.push({
        id: docSnapshot.id,
        ...bookmarkData,
        prediction: predDoc.exists ? { id: predDoc.id, ...predDoc.data() } : null
      });
    }

    res.status(200).json({ success: true, count: bookmarks.length, data: bookmarks });
  } catch (error) {
    logger.error('Failed to fetch user bookmarks:', error);
    next(error);
  }
};

// @desc    Toggle a bookmark for a prediction (Add/Remove)
// @route   POST /api/bookmarks/toggle
// @access  Private
export const toggleBookmark = async (req, res, next) => {
  try {
    const userId = req.user.uid || req.user.id;
    const { predictionId } = req.body;

    if (!predictionId) {
      return res.status(400).json({ success: false, message: 'Prediction ID is required' });
    }

    const docRef = db.collection('users').doc(userId).collection('savedPredictions').doc(predictionId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      // Bookmark exists, so remove it
      await docRef.delete();
      return res.status(200).json({ success: true, message: 'Bookmark removed', action: 'removed' });
    } else {
      // Bookmark does not exist, create it
      const newBookmark = { predictionId, createdAt: new Date() };
      await docRef.set(newBookmark);
      return res.status(201).json({ success: true, message: 'Bookmark added', action: 'added', data: newBookmark });
    }
  } catch (error) {
    logger.error('Failed to toggle bookmark:', error);
    next(error);
  }
};
import { db } from '../config/firebase.js';

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (Requires valid Firebase Token)
export const getMe = async (req, res, next) => {
  try {
    // req.user will be populated by our upcoming authMiddleware
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Fetch additional user details from the Firestore database
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User profile not found in database' });
    }

    res.status(200).json({
      success: true,
      data: {
        uid: req.user.uid,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    next(error); // Passes the error to your custom errorHandler middleware
  }
};
import { auth, db } from '../config/firebase.js';

// @desc    Verify Firebase Token and protect routes
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using Firebase Admin
      const decodedToken = await auth.verifyIdToken(token);

      // Attach the decoded token (which includes uid, email, and custom claims) to req.user
      req.user = decodedToken;

      // Fallback: If the role isn't stored as a custom claim, fetch it from Firestore
      if (!req.user.role) {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          req.user.role = userDoc.data().role;
        }
      }

      return next();
    } catch (error) {
      console.error('Firebase Auth Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
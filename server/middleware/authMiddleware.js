import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Verifies the JWT Bearer token and attaches the authenticated user to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  // Read Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract the JWT token (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID (excluding password)
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
        });
      }

      // Attach user to request object
      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  }

  // If no Bearer header is present
  return res.status(401).json({
    success: false,
    message: 'Authentication required.',
  });
};

export default protect;

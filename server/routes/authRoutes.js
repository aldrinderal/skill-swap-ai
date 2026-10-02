import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  googleLogin,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

// Protected routes (Requires valid JWT Bearer token)
router.get('/me', protect, getCurrentUser);

export default router;

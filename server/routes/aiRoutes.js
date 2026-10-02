import express from 'express';
import { getRecommendations, clearUserCache } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get AI-assisted & skill-based recommendations for current user
 * @access  Private (JWT protected)
 */
router.get('/recommendations', protect, getRecommendations);

/**
 * @route   POST /api/ai/clear-cache
 * @desc    Clear recommendations cache for current user
 * @access  Private (JWT protected)
 */
router.post('/clear-cache', protect, clearUserCache);

export default router;

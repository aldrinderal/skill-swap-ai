import express from 'express';
import {
  submitFeedback,
  checkFeedback,
  getMeetingFeedback,
  getUserFeedback,
  getPlatformFeedbackStats,
} from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/feedback
 * @desc    Submit rating and review for a completed meeting
 * @access  Private
 */
router.post('/', protect, submitFeedback);

/**
 * @route   GET /api/feedback/check/:meetingId
 * @desc    Check whether current user has submitted feedback for meeting
 * @access  Private
 */
router.get('/check/:meetingId', protect, checkFeedback);

/**
 * @route   GET /api/feedback/meeting/:meetingId
 * @desc    Get all feedback submitted for a specific meeting
 * @access  Private (Participants only)
 */
router.get('/meeting/:meetingId', protect, getMeetingFeedback);

/**
 * @route   GET /api/feedback/user/:userId
 * @desc    Get feedback received by user and calculated rating stats
 * @access  Private
 */
router.get('/user/:userId', protect, getUserFeedback);

/**
 * @route   GET /api/feedback/stats
 * @desc    Get platform-wide feedback and rating statistics
 * @access  Private
 */
router.get('/stats', protect, getPlatformFeedbackStats);

export default router;

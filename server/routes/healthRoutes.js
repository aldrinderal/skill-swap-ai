import express from 'express';
import { checkHealth } from '../controllers/healthController.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', checkHealth);

export default router;

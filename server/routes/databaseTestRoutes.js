import express from 'express';
import { checkDatabaseStatus } from '../controllers/databaseTestController.js';

const router = express.Router();

/**
 * @route   GET /api/database-test
 * @desc    Test real Mongoose database connection state and models
 * @access  Public
 */
router.get('/', checkDatabaseStatus);

export default router;

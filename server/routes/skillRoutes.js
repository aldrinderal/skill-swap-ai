import express from 'express';
import {
  createSkillProfile,
  getMySkillProfile,
  updateMySkillProfile,
  deleteMySkillProfile,
  getAllSkillProfiles,
  getSkillMatches,
  getPublicSkillProfile,
} from '../controllers/skillController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Search & Directory (Protected)
router.get('/', protect, getAllSkillProfiles);

// Current User's Profile (Must be defined before /:userId)
router.get('/me', protect, getMySkillProfile);

// Rule-Based Reciprocal Matches (Must be defined before /:userId)
router.get('/matches', protect, getSkillMatches);

// Public Skill Profile for another user
router.get('/:userId', protect, getPublicSkillProfile);

// Profile CRUD operations
router.post('/', protect, createSkillProfile);
router.put('/me', protect, updateMySkillProfile);
router.delete('/me', protect, deleteMySkillProfile);

export default router;

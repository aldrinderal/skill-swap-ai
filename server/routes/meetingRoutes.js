import express from 'express';
import {
  startMeeting,
  getMeeting,
  acceptMeeting,
  rejectMeeting,
  endMeeting,
  getMeetingMessages,
} from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Meeting Routes (Phase 11 - Section 71)
 * All endpoints are strictly authenticated via JWT
 */

// Start a new meeting with a connected user
router.post('/start/:userId', protect, startMeeting);

// Retrieve meeting info, state, and authoritative remaining seconds
router.get('/:meetingId', protect, getMeeting);

// Accept meeting invitation
router.put('/:meetingId/accept', protect, acceptMeeting);

// Reject meeting invitation
router.put('/:meetingId/reject', protect, rejectMeeting);

// Terminate / end active meeting
router.put('/:meetingId/end', protect, endMeeting);

// Retrieve persistent chat history for the meeting
router.get('/:meetingId/messages', protect, getMeetingMessages);

export default router;

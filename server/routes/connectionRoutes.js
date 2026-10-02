import express from 'express';
import {
  sendConnectionRequest,
  getReceivedRequests,
  getSentRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  getConnectionStatus,
  getConnections,
  removeConnection,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All connection routes are protected by JWT authentication
router.use(protect);

// 1. Connection Requests Listing
router.get('/requests/received', getReceivedRequests);
router.get('/requests/sent', getSentRequests);

// 2. Send Connection Request
router.post('/request/:userId', sendConnectionRequest);

// 3. Request Action Lifecycles
router.put('/request/:requestId/accept', acceptConnectionRequest);
router.put('/request/:requestId/reject', rejectConnectionRequest);
router.put('/request/:requestId/cancel', cancelConnectionRequest);

// 4. Check Connection Status with a specific user
router.get('/status/:userId', getConnectionStatus);

// 5. Active Connections
router.get('/', getConnections);
router.delete('/:connectionId', removeConnection);

export default router;

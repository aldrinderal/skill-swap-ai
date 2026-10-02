import ConnectionRequest from '../models/ConnectionRequest.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import SkillProfile from '../models/SkillProfile.js';
import { emitToUser } from '../sockets/socketServer.js';
import { invalidateUserRecommendationCache } from '../services/aiRecommendationService.js';

/**
 * Send Connection Request
 * POST /api/connections/request/:userId
 */
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.userId;

    // 1. Prevent self request
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a connection request to yourself.',
      });
    }

    // 2. Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // 3. Prevent duplicate connection (check if already connected)
    const u1 = senderId.toString() < receiverId.toString() ? senderId : receiverId;
    const u2 = senderId.toString() < receiverId.toString() ? receiverId : senderId;
    const existingConnection = await Connection.findOne({ user1: u1, user2: u2 });
    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: 'You are already connected with this user.',
      });
    }

    // 4. Check for existing pending request from sender to receiver
    const existingPending = await ConnectionRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'Connection request already sent.',
      });
    }

    // 5. Handle reverse request (receiver already sent pending request to sender)
    const reversePending = await ConnectionRequest.findOne({
      sender: receiverId,
      receiver: senderId,
      status: 'pending',
    });
    if (reversePending) {
      return res.status(409).json({
        success: false,
        message: 'This user has already sent you a connection request.',
      });
    }

    // 6. Check if an inactive request already exists between them (rejected or cancelled)
    let request = await ConnectionRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (request) {
      request.status = 'pending';
      await request.save();
    } else {
      request = await ConnectionRequest.create({
        sender: senderId,
        receiver: receiverId,
        status: 'pending',
      });
    }

    // 7. Emit real-time notification to receiver if online (Phase 10 Section 27)
    try {
      const senderProfile = await SkillProfile.findOne({ userId: senderId });
      emitToUser(receiverId, 'connection:request', {
        requestId: request._id,
        sender: {
          id: req.user._id,
          name: req.user.name,
          profileImage: req.user.profileImage || '',
          skillToTeach: senderProfile?.skillToTeach || 'Not specified',
          skillToLearn: senderProfile?.skillToLearn || 'Not specified',
        },
      });
    } catch {
      // Non-blocking socket emission
    }

    // Invalidate recommendation cache for both users
    invalidateUserRecommendationCache(senderId);
    invalidateUserRecommendationCache(receiverId);

    return res.status(201).json({
      success: true,
      message: 'Connection request sent successfully.',
      request: {
        id: request._id,
        sender: request.sender,
        receiver: request.receiver,
        status: request.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Received Requests
 * GET /api/connections/requests/received
 */
export const getReceivedRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find pending requests where user is the receiver
    const requests = await ConnectionRequest.find({
      receiver: userId,
      status: 'pending',
    })
      .populate('sender', 'name profileImage bio email')
      .sort({ createdAt: -1 });

    // Fetch skill profiles for senders to enrich the cards
    const senderIds = requests
      .filter((r) => r.sender)
      .map((r) => r.sender._id);

    const profiles = await SkillProfile.find({ userId: { $in: senderIds } });
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const formattedRequests = requests
      .filter((r) => r.sender)
      .map((r) => {
        const profile = profileMap.get(r.sender._id.toString());
        return {
          id: r._id,
          sender: {
            id: r.sender._id,
            name: r.sender.name,
            profileImage: r.sender.profileImage || '',
            bio: profile?.bio || r.sender.bio || '',
            skillToTeach: profile?.skillToTeach || 'Not specified',
            skillToLearn: profile?.skillToLearn || 'Not specified',
            experienceLevel: profile?.experienceLevel || 'Intermediate',
            availability: profile?.availability || 'Flexible',
            preferredSession: profile?.preferredSession || 'Flexible',
          },
          status: r.status,
          createdAt: r.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Sent Requests
 * GET /api/connections/requests/sent
 */
export const getSentRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all requests where user is the sender
    const requests = await ConnectionRequest.find({
      sender: userId,
    })
      .populate('receiver', 'name profileImage bio email')
      .sort({ createdAt: -1 });

    const receiverIds = requests
      .filter((r) => r.receiver)
      .map((r) => r.receiver._id);

    const profiles = await SkillProfile.find({ userId: { $in: receiverIds } });
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const formattedRequests = requests
      .filter((r) => r.receiver)
      .map((r) => {
        const profile = profileMap.get(r.receiver._id.toString());
        return {
          id: r._id,
          receiver: {
            id: r.receiver._id,
            name: r.receiver.name,
            profileImage: r.receiver.profileImage || '',
            bio: profile?.bio || r.receiver.bio || '',
            skillToTeach: profile?.skillToTeach || 'Not specified',
            skillToLearn: profile?.skillToLearn || 'Not specified',
            experienceLevel: profile?.experienceLevel || 'Intermediate',
            availability: profile?.availability || 'Flexible',
            preferredSession: profile?.preferredSession || 'Flexible',
          },
          status: r.status,
          createdAt: r.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Connection Request
 * PUT /api/connections/request/:requestId/accept
 */
export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found.',
      });
    }

    // Verify current user is receiver
    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this request.',
      });
    }

    // Verify status is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is no longer pending.',
      });
    }

    // Canonical user pair for Connection
    const u1 = request.sender.toString() < request.receiver.toString() ? request.sender : request.receiver;
    const u2 = request.sender.toString() < request.receiver.toString() ? request.receiver : request.sender;

    // Create Connection if not exists
    let connection = await Connection.findOne({ user1: u1, user2: u2 });
    if (!connection) {
      connection = await Connection.create({ user1: u1, user2: u2 });
    }

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Emit real-time notification to sender if online (Phase 10 Section 28)
    try {
      emitToUser(request.sender, 'connection:accepted', {
        connectionId: connection._id,
        user: {
          id: req.user._id,
          name: req.user.name,
          profileImage: req.user.profileImage || '',
        },
      });
    } catch {
      // Non-blocking socket emission
    }

    // Invalidate recommendation cache for both users
    invalidateUserRecommendationCache(request.sender);
    invalidateUserRecommendationCache(request.receiver);

    return res.status(200).json({
      success: true,
      message: 'Connection accepted.',
      connection: {
        id: connection._id,
        user1: connection.user1,
        user2: connection.user2,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Connection Request
 * PUT /api/connections/request/:requestId/reject
 */
export const rejectConnectionRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found.',
      });
    }

    // Verify current user is receiver
    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this request.',
      });
    }

    // Verify status is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is no longer pending.',
      });
    }

    request.status = 'rejected';
    await request.save();

    // Emit real-time notification to sender if online (Phase 10 Section 29)
    try {
      emitToUser(request.sender, 'connection:rejected', {
        requestId: request._id,
      });
    } catch {
      // Non-blocking socket emission
    }

    return res.status(200).json({
      success: true,
      message: 'Connection request rejected.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Sent Connection Request
 * PUT /api/connections/request/:requestId/cancel
 */
export const cancelConnectionRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found.',
      });
    }

    // Verify current user is sender
    if (request.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this request.',
      });
    }

    // Verify status is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled.',
      });
    }

    request.status = 'cancelled';
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Connection request cancelled.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Connection Status with another user
 * GET /api/connections/status/:userId
 */
export const getConnectionStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(200).json({
        success: true,
        status: 'self',
      });
    }

    // 1. Check if already connected
    const u1 = currentUserId.toString() < targetUserId.toString() ? currentUserId : targetUserId;
    const u2 = currentUserId.toString() < targetUserId.toString() ? targetUserId : currentUserId;
    const connection = await Connection.findOne({ user1: u1, user2: u2 });

    if (connection) {
      return res.status(200).json({
        success: true,
        status: 'connected',
        connectionId: connection._id,
      });
    }

    // 2. Check if request sent by current user is pending
    const sentPending = await ConnectionRequest.findOne({
      sender: currentUserId,
      receiver: targetUserId,
      status: 'pending',
    });
    if (sentPending) {
      return res.status(200).json({
        success: true,
        status: 'request_sent',
        requestId: sentPending._id,
      });
    }

    // 3. Check if request received from target user is pending
    const receivedPending = await ConnectionRequest.findOne({
      sender: targetUserId,
      receiver: currentUserId,
      status: 'pending',
    });
    if (receivedPending) {
      return res.status(200).json({
        success: true,
        status: 'request_received',
        requestId: receivedPending._id,
      });
    }

    // 4. Check for most recent non-pending request
    const lastRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    }).sort({ updatedAt: -1 });

    if (lastRequest) {
      if (lastRequest.status === 'rejected') {
        return res.status(200).json({
          success: true,
          status: 'request_rejected',
          requestId: lastRequest._id,
        });
      }
      if (lastRequest.status === 'cancelled') {
        return res.status(200).json({
          success: true,
          status: 'request_cancelled',
          requestId: lastRequest._id,
        });
      }
    }

    return res.status(200).json({
      success: true,
      status: 'not_connected',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Connections for Authenticated User
 * GET /api/connections
 */
export const getConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all connections involving the authenticated user
    const connections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate('user1', 'name profileImage bio email')
      .populate('user2', 'name profileImage bio email')
      .sort({ createdAt: -1 });

    // Determine partner IDs
    const partnerIds = connections.map((c) => {
      const partner = c.user1._id.toString() === userId.toString() ? c.user2 : c.user1;
      return partner._id;
    });

    const profiles = await SkillProfile.find({ userId: { $in: partnerIds } });
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const formattedConnections = connections.map((c) => {
      const partner = c.user1._id.toString() === userId.toString() ? c.user2 : c.user1;
      const profile = profileMap.get(partner._id.toString());

      return {
        connectionId: c._id,
        user: {
          id: partner._id,
          name: partner.name,
          profileImage: partner.profileImage || '',
          bio: profile?.bio || partner.bio || '',
          skillToTeach: profile?.skillToTeach || 'Not specified',
          skillToLearn: profile?.skillToLearn || 'Not specified',
          experienceLevel: profile?.experienceLevel || 'Intermediate',
          availability: profile?.availability || 'Flexible',
          preferredSession: profile?.preferredSession || 'Flexible',
        },
        connectedAt: c.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedConnections.length,
      connections: formattedConnections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an existing Connection
 * DELETE /api/connections/:connectionId
 */
export const removeConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found.',
      });
    }

    // Verify the authenticated user belongs to this connection
    const isMember =
      connection.user1.toString() === userId.toString() ||
      connection.user2.toString() === userId.toString();

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this connection.',
      });
    }

    // Remove connection document
    await Connection.findByIdAndDelete(connectionId);

    // Update accepted requests between these two users so they can connect again later
    await ConnectionRequest.updateMany(
      {
        $or: [
          { sender: connection.user1, receiver: connection.user2 },
          { sender: connection.user2, receiver: connection.user1 },
        ],
        status: 'accepted',
      },
      { status: 'cancelled' }
    );

    // Invalidate recommendation cache for both users
    invalidateUserRecommendationCache(connection.user1);
    invalidateUserRecommendationCache(connection.user2);

    return res.status(200).json({
      success: true,
      message: 'Connection removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

import { Server } from 'socket.io';
import socketAuth from '../middleware/socketAuth.js';
import Meeting from '../models/Meeting.js';
import MeetingMessage from '../models/MeetingMessage.js';
import User from '../models/User.js';

let io = null;

// In-memory tracking of online users: userId -> Set(socketId)
// Supports multiple tabs / devices per user (Section 10 & 23)
const onlineUsers = new Map();

/**
 * Initialize Socket.IO Server (Phase 10 & 11)
 * @param {import('http').Server} httpServer
 */
export const initSocketServer = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests from clientUrl, localhost variants in dev, or no origin (like mobile/curl)
        if (!origin || origin === clientUrl || /^http:\/\/localhost:(5173|5174|5175|3000)$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed for Socket.IO origin'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT'],
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Attach JWT Authentication Middleware (Section 5 & 13)
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // 1. Connection Logging (Section 7 - Never log JWTs or passwords)
    console.log(`[Socket.IO] User connected: ${userId} | Socket ID: ${socket.id}`);

    // 2. Automatically join private user room: user:<userId> (Section 9)
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    // 3. Online User Tracking & Status Broadcast (Section 10 & 11)
    const isFirstSocket = !onlineUsers.has(userId) || onlineUsers.get(userId).size === 0;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast user:online only on initial tab/device connection
    if (isFirstSocket) {
      socket.broadcast.emit('user:online', { userId });
    }

    // Send current list of online users to the freshly connected socket
    socket.emit('users:online_list', {
      onlineUserIds: Array.from(onlineUsers.keys()),
    });

    // 4. Test ping/pong event (Section 20)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    /*
     * ========================================================
     * PHASE 11: CALL INVITATION & MEETING LIFECYCLE
     * ========================================================
     */

    // Accept call via socket (Section 9)
    socket.on('call:accept', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.receiver.toString() !== userId && meeting.caller.toString() !== userId) return;

        if (meeting.status === 'ringing') {
          meeting.status = 'active';
          meeting.startedAt = new Date();
          await meeting.save();

          emitToUser(meeting.caller.toString(), 'call:accepted', { meetingId });
          emitToUser(meeting.receiver.toString(), 'call:accepted', { meetingId });
        }
      } catch (err) {
        console.error('Socket call:accept error:', err.message);
      }
    });

    // Reject call via socket (Section 10)
    socket.on('call:reject', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.receiver.toString() !== userId && meeting.caller.toString() !== userId) return;

        meeting.status = 'rejected';
        meeting.endReason = 'rejected';
        meeting.endedAt = new Date();
        await meeting.save();

        emitToUser(meeting.caller.toString(), 'call:rejected', {
          meetingId,
          reason: 'Meeting declined',
        });
      } catch (err) {
        console.error('Socket call:reject error:', err.message);
      }
    });

    // Cancel call while ringing
    socket.on('call:cancel', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.caller.toString() === userId && meeting.status === 'ringing') {
          meeting.status = 'missed';
          meeting.endReason = 'timeout';
          meeting.endedAt = new Date();
          await meeting.save();

          emitToUser(meeting.receiver.toString(), 'call:cancelled', { meetingId });
        }
      } catch (err) {
        console.error('Socket call:cancel error:', err.message);
      }
    });

    /*
     * ========================================================
     * PHASE 11: MEETING ROOM & WEBRTC SIGNALING
     * ========================================================
     */

    // Join private meeting room: meeting:<meetingId> (Section 34 & 35)
    socket.on('meeting:join', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
          return socket.emit('meeting:error', { message: 'Meeting does not exist' });
        }

        // Verify socket user is caller or receiver (Section 33 & 76)
        const isParticipant =
          meeting.caller.toString() === userId || meeting.receiver.toString() === userId;
        if (!isParticipant) {
          return socket.emit('meeting:error', { message: 'Unauthorized meeting access' });
        }

        const roomName = `meeting:${meetingId}`;
        socket.join(roomName);

        // Notify other participant in the room that peer has joined
        socket.to(roomName).emit('peer:joined', { userId });
        socket.emit('meeting:joined', { meetingId });
      } catch (err) {
        console.error('Socket meeting:join error:', err.message);
      }
    });

    // Leave meeting room
    socket.on('meeting:leave', ({ meetingId }) => {
      if (meetingId) {
        const roomName = `meeting:${meetingId}`;
        socket.leave(roomName);
        socket.to(roomName).emit('peer:left', { userId });
      }
    });

    // WebRTC Offer (Section 20 & 21)
    socket.on('webrtc:offer', async ({ meetingId, offer }) => {
      if (!meetingId || !offer) return;
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) return;
      if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;

      socket.to(`meeting:${meetingId}`).emit('webrtc:offer', {
        offer,
        senderId: userId,
      });
    });

    // WebRTC Answer (Section 20 & 22)
    socket.on('webrtc:answer', async ({ meetingId, answer }) => {
      if (!meetingId || !answer) return;
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) return;
      if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;

      socket.to(`meeting:${meetingId}`).emit('webrtc:answer', {
        answer,
        senderId: userId,
      });
    });

    // WebRTC ICE Candidate (Section 20 & 23)
    socket.on('webrtc:ice-candidate', async ({ meetingId, candidate }) => {
      if (!meetingId || !candidate) return;
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) return;
      if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;

      socket.to(`meeting:${meetingId}`).emit('webrtc:ice-candidate', {
        candidate,
        senderId: userId,
      });
    });

    // Peer Media State Change (Camera Off / Muted) (Section 28 & 29)
    socket.on('media:state_change', ({ meetingId, videoEnabled, audioEnabled }) => {
      if (meetingId) {
        socket.to(`meeting:${meetingId}`).emit('peer:media_state_change', {
          videoEnabled,
          audioEnabled,
          senderId: userId,
        });
      }
    });

    /*
     * ========================================================
     * PHASE 12: SCREEN SHARING STATE SIGNALING (Sections 12 & 13)
     * ========================================================
     */

    // Screen sharing started
    socket.on('screen:share:start', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;
        if (meeting.status !== 'active') return;

        socket.to(`meeting:${meetingId}`).emit('screen:share:start', {
          meetingId,
          userId,
        });
      } catch (err) {
        console.error('Socket screen:share:start error:', err.message);
      }
    });

    // Screen sharing stopped
    socket.on('screen:share:stop', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;

        socket.to(`meeting:${meetingId}`).emit('screen:share:stop', {
          meetingId,
          userId,
        });
      } catch (err) {
        console.error('Socket screen:share:stop error:', err.message);
      }
    });

    /*
     * ========================================================
     * PHASE 11: IN-MEETING CHAT & TYPING INDICATORS
     * ========================================================
     */

    // Send Chat Message (Section 43 & 45)
    socket.on('message:send', async ({ meetingId, message }) => {
      try {
        if (!meetingId || typeof message !== 'string') return;
        const trimmed = message.trim();
        // Validation: reject empty/whitespace or too long (Section 45)
        if (!trimmed || trimmed.length > 1000) return;

        // Security: verify meeting exists, is active, and user is participant (Section 46)
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;
        if (meeting.status !== 'active') return;

        // Persist message in MongoDB (Section 48)
        const newMessage = await MeetingMessage.create({
          meetingId,
          sender: userId,
          message: trimmed,
        });

        const senderUser = await User.findById(userId).select('name profileImage');

        const messagePayload = {
          _id: newMessage._id.toString(),
          meetingId,
          sender: {
            id: userId,
            name: senderUser?.name || 'User',
            profileImage: senderUser?.profileImage || '',
          },
          message: trimmed,
          createdAt: newMessage.createdAt,
        };

        // Emit to meeting room participants (Section 44)
        io.to(`meeting:${meetingId}`).emit('message:receive', messagePayload);
      } catch (err) {
        console.error('Socket message:send error:', err.message);
      }
    });

    // Typing start indicator (Section 47)
    socket.on('typing:start', async ({ meetingId }) => {
      if (meetingId) {
        const senderUser = await User.findById(userId).select('name');
        socket.to(`meeting:${meetingId}`).emit('typing:start', {
          userId,
          name: senderUser?.name || 'Partner',
        });
      }
    });

    // Typing stop indicator (Section 47)
    socket.on('typing:stop', ({ meetingId }) => {
      if (meetingId) {
        socket.to(`meeting:${meetingId}`).emit('typing:stop', { userId });
      }
    });

    // Meeting End via Socket (Section 30)
    socket.on('meeting:end', async ({ meetingId }) => {
      try {
        if (!meetingId) return;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return;
        if (meeting.caller.toString() !== userId && meeting.receiver.toString() !== userId) return;

        if (meeting.status !== 'completed' && meeting.status !== 'ended') {
          meeting.status = 'completed';
          meeting.endReason = 'user_ended';
          meeting.endedAt = new Date();
          await meeting.save();

          emitToMeeting(meetingId, 'meeting:ended', {
            meetingId,
            endReason: 'user_ended',
            endedBy: userId,
          });
        }
      } catch (err) {
        console.error('Socket meeting:end error:', err.message);
      }
    });

    // 5. Socket Disconnect Lifecycle (Section 8, 11 & 23)
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] User disconnected: ${userId} | Socket ID: ${socket.id} | Reason: ${reason}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // Only broadcast user:offline when ALL tabs/connections for this user are closed
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });

    // Socket error safety (Section 14)
    socket.on('error', (err) => {
      console.warn(`[Socket.IO] Socket error for user ${userId}:`, err.message);
    });
  });

  return io;
};

/**
 * Access the active Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized! Call initSocketServer first.');
  }
  return io;
};

/**
 * Emit an event directly to an authenticated user's private room (Section 9, 27, 28, 29)
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {object} payload - Event payload
 */
export const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
    return true;
  }
  return false;
};

/**
 * Emit an event to all participants in a meeting room (Section 35)
 * @param {string} meetingId - Meeting ID
 * @param {string} event - Event name
 * @param {object} payload - Event payload
 */
export const emitToMeeting = (meetingId, event, payload) => {
  if (io && meetingId) {
    io.to(`meeting:${meetingId.toString()}`).emit(event, payload);
    return true;
  }
  return false;
};

/**
 * Check if a user is currently online in memory
 * @param {string} userId
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
};

/**
 * Retrieve all currently online user IDs
 * @returns {string[]}
 */
export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

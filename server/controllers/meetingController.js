import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import MeetingMessage from '../models/MeetingMessage.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { emitToUser, emitToMeeting } from '../sockets/socketServer.js';

/**
 * Start Meeting (Phase 11 - Section 4)
 * POST /api/meetings/start/:userId
 * Authenticated user calls connected partner
 */
export const startMeeting = async (req, res) => {
  try {
    const callerId = req.user._id;
    const receiverId = req.params.userId;

    // 1. Validate receiver ID format
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
    }

    // 2. Cannot call oneself (Section 2)
    if (callerId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a meeting with yourself.',
      });
    }

    // 3. Verify receiver exists (Section 4)
    const receiverUser = await User.findById(receiverId).select('name email profileImage');
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: 'The requested user was not found.',
      });
    }

    // 4. Verify caller and receiver are established connections (Section 2 & 4)
    const u1 = callerId.toString() < receiverId.toString() ? callerId : receiverId;
    const u2 = callerId.toString() < receiverId.toString() ? receiverId : callerId;
    const activeConnection = await Connection.findOne({ user1: u1, user2: u2 });

    if (!activeConnection) {
      return res.status(403).json({
        success: false,
        message: 'You can only start meetings with confirmed skill swap connections.',
      });
    }

    // 5. Clean up any previous ringing calls between this pair
    await Meeting.updateMany(
      {
        $or: [
          { caller: callerId, receiver: receiverId },
          { caller: receiverId, receiver: callerId },
        ],
        status: 'ringing',
      },
      {
        status: 'missed',
        endReason: 'timeout',
        endedAt: new Date(),
      }
    );

    // 6. Create new Meeting session (Section 5)
    const meeting = await Meeting.create({
      caller: callerId,
      receiver: receiverId,
      status: 'ringing',
      duration: 30,
    });

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('caller', 'name email profileImage')
      .populate('receiver', 'name email profileImage');

    // 7. Send real-time call invitation via Socket.IO to receiver's private room (Section 7)
    emitToUser(receiverId.toString(), 'call:incoming', {
      meetingId: meeting._id.toString(),
      caller: {
        id: req.user._id.toString(),
        name: req.user.name,
        profileImage: req.user.profileImage || '',
      },
    });

    // 8. 60-Second Invitation Timeout (Section 61 & 62)
    setTimeout(async () => {
      try {
        const pendingMeeting = await Meeting.findById(meeting._id);
        if (pendingMeeting && pendingMeeting.status === 'ringing') {
          pendingMeeting.status = 'missed';
          pendingMeeting.endReason = 'timeout';
          pendingMeeting.endedAt = new Date();
          await pendingMeeting.save();

          emitToUser(callerId.toString(), 'call:timeout', {
            meetingId: meeting._id.toString(),
            message: 'No response from partner',
          });
          emitToUser(receiverId.toString(), 'call:timeout', {
            meetingId: meeting._id.toString(),
          });
        }
      } catch (err) {
        console.error('Error handling ringing timeout:', err.message);
      }
    }, 60000);

    return res.status(201).json({
      success: true,
      meeting: {
        meetingId: populatedMeeting._id.toString(),
        status: populatedMeeting.status,
        caller: populatedMeeting.caller,
        receiver: populatedMeeting.receiver,
        createdAt: populatedMeeting.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in startMeeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start meeting session.',
      error: error.message,
    });
  }
};

/**
 * Get Meeting by ID (Phase 11 - Section 72)
 * GET /api/meetings/:meetingId
 * Returns meeting details and server-authoritative timer countdown
 */
export const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    const meeting = await Meeting.findById(meetingId)
      .populate('caller', 'name email profileImage')
      .populate('receiver', 'name email profileImage');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    // Verify authenticated user belongs to meeting (Section 33 & 75)
    const currentUserId = req.user._id.toString();
    const isCaller = meeting.caller._id.toString() === currentUserId;
    const isReceiver = meeting.receiver._id.toString() === currentUserId;

    if (!isCaller && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this meeting.',
      });
    }

    // Calculate server-authoritative remaining time (Section 37 & 38)
    const durationSeconds = parseInt(process.env.MEETING_DURATION_SECONDS || '1800', 10);
    let remainingSeconds = durationSeconds;

    if (meeting.status === 'active' && meeting.startedAt) {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(meeting.startedAt).getTime()) / 1000
      );
      remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      // Automatic meeting termination if time reached (Section 39)
      if (remainingSeconds <= 0 && meeting.status === 'active') {
        meeting.status = 'completed';
        meeting.endReason = 'timeout';
        meeting.endedAt = new Date();
        await meeting.save();

        emitToMeeting(meetingId, 'meeting:ended', {
          meetingId,
          endReason: 'timeout',
          message: '30-minute session duration reached.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      meeting: {
        meetingId: meeting._id.toString(),
        status: meeting.status,
        caller: meeting.caller,
        receiver: meeting.receiver,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        endReason: meeting.endReason,
        remainingSeconds,
        durationSeconds,
      },
    });
  } catch (error) {
    console.error('Error in getMeeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve meeting details.',
      error: error.message,
    });
  }
};

/**
 * Accept Meeting (Phase 11 - Section 9)
 * PUT /api/meetings/:meetingId/accept
 */
export const acceptMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const currentUserId = req.user._id.toString();

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    // Only designated receiver can accept the call
    if (meeting.receiver.toString() !== currentUserId && meeting.caller.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this meeting.' });
    }

    if (meeting.status === 'ringing') {
      meeting.status = 'active';
      meeting.startedAt = new Date();
      await meeting.save();

      // Notify caller that call was accepted
      emitToUser(meeting.caller.toString(), 'call:accepted', {
        meetingId: meeting._id.toString(),
      });

      // Schedule server-authoritative termination timer
      const durationSeconds = parseInt(process.env.MEETING_DURATION_SECONDS || '1800', 10);
      setTimeout(async () => {
        try {
          const activeMeeting = await Meeting.findById(meeting._id);
          if (activeMeeting && activeMeeting.status === 'active') {
            activeMeeting.status = 'completed';
            activeMeeting.endReason = 'timeout';
            activeMeeting.endedAt = new Date();
            await activeMeeting.save();

            emitToMeeting(meetingId, 'meeting:ended', {
              meetingId,
              endReason: 'timeout',
              message: 'Session completed.',
            });
          }
        } catch (e) {
          console.error('Error on meeting timer end:', e);
        }
      }, durationSeconds * 1000);
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting accepted.',
      meeting: {
        meetingId: meeting._id.toString(),
        status: meeting.status,
        startedAt: meeting.startedAt,
      },
    });
  } catch (error) {
    console.error('Error in acceptMeeting:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept meeting.' });
  }
};

/**
 * Reject Meeting (Phase 11 - Section 10)
 * PUT /api/meetings/:meetingId/reject
 */
export const rejectMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const currentUserId = req.user._id.toString();

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    if (meeting.receiver.toString() !== currentUserId && meeting.caller.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this meeting.' });
    }

    meeting.status = 'rejected';
    meeting.endReason = 'rejected';
    meeting.endedAt = new Date();
    await meeting.save();

    // Notify caller that meeting was declined (Section 10)
    emitToUser(meeting.caller.toString(), 'call:rejected', {
      meetingId: meeting._id.toString(),
      reason: 'Meeting declined',
    });

    return res.status(200).json({
      success: true,
      message: 'Meeting rejected.',
    });
  } catch (error) {
    console.error('Error in rejectMeeting:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject meeting.' });
  }
};

/**
 * End Meeting (Phase 11 - Section 30 & 73)
 * PUT /api/meetings/:meetingId/end
 */
export const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const currentUserId = req.user._id.toString();

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    // Verify participant
    if (meeting.caller.toString() !== currentUserId && meeting.receiver.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this meeting.',
      });
    }

    if (meeting.status !== 'completed' && meeting.status !== 'ended') {
      meeting.status = 'completed';
      meeting.endReason = 'user_ended';
      meeting.endedAt = new Date();
      await meeting.save();

      // Emit meeting:ended to all participants in meeting room
      emitToMeeting(meetingId, 'meeting:ended', {
        meetingId,
        endReason: 'user_ended',
        endedBy: currentUserId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting ended successfully.',
      meeting: {
        meetingId: meeting._id.toString(),
        status: meeting.status,
        endReason: meeting.endReason,
        endedAt: meeting.endedAt,
      },
    });
  } catch (error) {
    console.error('Error in endMeeting:', error);
    return res.status(500).json({ success: false, message: 'Failed to end meeting.' });
  }
};

/**
 * Get Chat History (Phase 11 - Section 49)
 * GET /api/meetings/:meetingId/messages
 */
export const getMeetingMessages = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const currentUserId = req.user._id.toString();

    // Verify user belongs to meeting (Section 46 & 76)
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    if (meeting.caller.toString() !== currentUserId && meeting.receiver.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages for this meeting.',
      });
    }

    // Retrieve last 100 messages ordered oldest to newest (Section 49 & 82)
    const messages = await MeetingMessage.find({ meetingId })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('sender', 'name profileImage');

    return res.status(200).json({
      success: true,
      messages: messages.map((m) => ({
        _id: m._id,
        meetingId: m.meetingId,
        sender: {
          id: m.sender?._id || m.sender,
          name: m.sender?.name || 'User',
          profileImage: m.sender?.profileImage || '',
        },
        message: m.message,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error in getMeetingMessages:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
};

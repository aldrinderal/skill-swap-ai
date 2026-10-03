import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import Meeting from '../models/Meeting.js';

/**
 * Submit Feedback & Rating (Phase 14)
 * POST /api/feedback
 * @access Private
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const reviewerId = req.user._id;
    const { meetingId, rating, comment } = req.body;

    // 1. Validate Meeting ID format
    if (!meetingId || !mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    // 2. Validate Rating (must be integer between 1 and 5)
    if (
      rating === undefined ||
      rating === null ||
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // 3. Validate Comment length (maximum 1000 characters)
    if (comment && typeof comment === 'string' && comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters',
      });
    }

    // 4. Retrieve Meeting from MongoDB
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // 5. Verify Meeting Status is completed (Phase 14 Req 5 & 11)
    if (meeting.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted after the meeting is completed',
      });
    }

    // 6. Verify Reviewer was a participant in the meeting (hostId or guestId)
    const currentUserIdStr = reviewerId.toString();
    const callerId = meeting.caller?._id || meeting.caller || meeting.hostId?._id || meeting.hostId;
    const receiverId = meeting.receiver?._id || meeting.receiver || meeting.guestId?._id || meeting.guestId;
    const callerIdStr = callerId ? callerId.toString() : '';
    const receiverIdStr = receiverId ? receiverId.toString() : '';

    if (currentUserIdStr !== callerIdStr && currentUserIdStr !== receiverIdStr) {
      return res.status(403).json({
        success: false,
        message: 'You were not a participant in this meeting',
      });
    }

    // 7. Determine Reviewed User (the other meeting participant)
    const reviewedUserId = currentUserIdStr === callerIdStr ? receiverId : callerId;

    // 8. Prevent Self-Review
    if (currentUserIdStr === reviewedUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself',
      });
    }

    // 9. Prevent Duplicate Feedback for the same meeting
    const existingFeedback = await Feedback.findOne({
      meetingId,
      reviewerId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this meeting',
      });
    }

    // 10. Persist Feedback in MongoDB
    const feedback = await Feedback.create({
      meetingId,
      reviewerId,
      reviewedUserId,
      rating,
      comment: typeof comment === 'string' ? comment.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedback,
    });
  } catch (error) {
    // Handle duplicate key error from MongoDB compound index if race condition occurs
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this meeting',
      });
    }
    next(error);
  }
};

/**
 * Check whether authenticated user has submitted feedback for a meeting
 * GET /api/feedback/check/:meetingId
 * @access Private
 */
export const checkFeedback = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const reviewerId = req.user._id;

    if (!meetingId || !mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    const existingFeedback = await Feedback.findOne({
      meetingId,
      reviewerId,
    });

    return res.status(200).json({
      success: true,
      hasSubmitted: Boolean(existingFeedback),
      feedback: existingFeedback || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Feedback for a specific meeting
 * GET /api/feedback/meeting/:meetingId
 * @access Private (Participants only)
 */
export const getMeetingFeedback = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const currentUserIdStr = req.user._id.toString();

    if (!meetingId || !mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const callerIdStr = meeting.caller.toString();
    const receiverIdStr = meeting.receiver.toString();

    if (currentUserIdStr !== callerIdStr && currentUserIdStr !== receiverIdStr) {
      return res.status(403).json({
        success: false,
        message: 'You were not a participant in this meeting',
      });
    }

    const feedbackList = await Feedback.find({ meetingId })
      .populate('reviewerId', 'name profileImage')
      .populate('reviewedUserId', 'name profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: feedbackList.length,
      feedback: feedbackList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Feedback received by a user & their calculated rating statistics
 * GET /api/feedback/user/:userId
 * @access Private
 */
export const getUserFeedback = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
    }

    const reviews = await Feedback.find({ reviewedUserId: userId })
      .populate('reviewerId', 'name profileImage')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let averageRating = null;

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = Math.round((sum / totalReviews) * 10) / 10;
    }

    // Sessions completed count from real MongoDB Meeting collection (Phase 14 Req 24)
    const sessionsCompleted = await Meeting.countDocuments({
      $or: [{ caller: userId }, { receiver: userId }],
      status: { $in: ['completed', 'ended'] },
    });

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating,
      sessionsCompleted,
      feedback: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Platform-wide Feedback Statistics
 * GET /api/feedback/stats
 * @access Private
 */
export const getPlatformFeedbackStats = async (req, res, next) => {
  try {
    const totalReviews = await Feedback.countDocuments();
    const aggregateResult = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const averagePlatformRating =
      aggregateResult.length > 0 && aggregateResult[0].avgRating
        ? Math.round(aggregateResult[0].avgRating * 10) / 10
        : null;

    return res.status(200).json({
      success: true,
      totalReviews,
      averagePlatformRating,
    });
  } catch (error) {
    next(error);
  }
};

import mongoose from 'mongoose';

/**
 * MeetingMessage Schema (Phase 11)
 * Stores in-meeting chat messages exchanged during live peer sessions
 */
const meetingMessageSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting reference is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user reference is required'],
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for retrieving messages by meeting ordered oldest to newest (Section 81)
meetingMessageSchema.index({ meetingId: 1, createdAt: 1 });

const MeetingMessage = mongoose.model('MeetingMessage', meetingMessageSchema);

export default MeetingMessage;

import mongoose from 'mongoose';

/**
 * Message Schema
 * Stores chat messages exchanged during live 30-minute peer meetings
 */
const messageSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting reference is required'],
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user reference is required'],
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast meeting message retrieval ordered by creation time
messageSchema.index({ meetingId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

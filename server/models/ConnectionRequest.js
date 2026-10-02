import mongoose from 'mongoose';

/**
 * ConnectionRequest Schema (Phase 9)
 * Represents skill swap partnership requests sent between two users
 */
const connectionRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user ID is required'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver user ID is required'],
    },
    status: {
      type: String,
      required: [true, 'Request status is required'],
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled'],
        message: '{VALUE} is not a valid status. Allowed: pending, accepted, rejected, cancelled',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual aliases for compatibility
connectionRequestSchema.virtual('senderId').get(function () {
  return this.sender;
});
connectionRequestSchema.virtual('receiverId').get(function () {
  return this.receiver;
});

// Compound indexes for fast query resolution and duplicate prevention
connectionRequestSchema.index({ sender: 1, receiver: 1 });
connectionRequestSchema.index({ receiver: 1, status: 1 });
connectionRequestSchema.index({ sender: 1, status: 1 });

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest;

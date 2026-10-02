import mongoose from 'mongoose';

/**
 * Meeting Schema (Phase 11)
 * Tracks 30-minute peer-to-peer WebRTC video sessions between connected learners
 */
const meetingSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Caller user ID is required'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver user ID is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['ringing', 'active', 'ended', 'rejected', 'missed'],
        message: '{VALUE} is not a valid meeting status. Allowed: ringing, active, ended, rejected, missed',
      },
      default: 'ringing',
    },
    startedAt: {
      type: Date,
      required: false,
    },
    endedAt: {
      type: Date,
      required: false,
    },
    endReason: {
      type: String,
      enum: {
        values: ['user_ended', 'timeout', 'rejected', 'disconnected', 'system'],
        message: '{VALUE} is not a valid end reason',
      },
      required: false,
    },
    duration: {
      type: Number,
      default: 30, // Default duration in minutes
      min: [1, 'Meeting duration must be at least 1 minute'],
      max: [60, 'Meeting duration cannot exceed 60 minutes'],
    },
    roomId: {
      type: String,
      default: function () {
        return this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility virtual getters
meetingSchema.virtual('hostId').get(function () {
  return this.caller;
});
meetingSchema.virtual('guestId').get(function () {
  return this.receiver;
});
meetingSchema.virtual('meetingId').get(function () {
  return this._id.toString();
});

// Indexes for fast querying of participants and active status (Section 81)
meetingSchema.index({ caller: 1 });
meetingSchema.index({ receiver: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ createdAt: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

// Drop legacy roomId_1 unique index if present from Phase 4
Meeting.collection.dropIndex('roomId_1').catch(() => {});

export default Meeting;

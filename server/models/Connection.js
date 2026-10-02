import mongoose from 'mongoose';

/**
 * Connection Schema (Phase 9)
 * Represents an established reciprocal skill partnership between two users
 */
const connectionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User 1 is required'],
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User 2 is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Enforce canonical ordering (user1 < user2) so that
// (A, B) and (B, A) map to the exact same pair and cannot duplicate
connectionSchema.pre('validate', function (next) {
  if (this.user1 && this.user2) {
    if (this.user1.toString() > this.user2.toString()) {
      const temp = this.user1;
      this.user1 = this.user2;
      this.user2 = temp;
    }
  }
  next();
});

// Unique compound index guarantees no duplicate connections can ever exist
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });
connectionSchema.index({ user1: 1 });
connectionSchema.index({ user2: 1 });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;

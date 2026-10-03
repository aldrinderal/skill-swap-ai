import mongoose from 'mongoose';

/**
 * Feedback Schema (Phase 14)
 * Stores reciprocal user ratings and comments after completed skill swap meetings
 */
const feedbackSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
    },
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewed user ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer rating',
      },
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index prevents duplicate feedback from the same reviewer for a meeting (Req 4)
feedbackSchema.index({ meetingId: 1, reviewerId: 1 }, { unique: true });

// Query optimization indexes
feedbackSchema.index({ reviewedUserId: 1 });
feedbackSchema.index({ reviewerId: 1 });
feedbackSchema.index({ meetingId: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;

import mongoose from 'mongoose';

/**
 * SkillProfile Schema
 * Defines the teaching and learning preferences registered by a user
 */
const skillProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true, // One skill profile per user
    },
    skillToLearn: {
      type: String,
      required: [true, 'Skill to learn is required'],
      trim: true,
    },
    skillToTeach: {
      type: String,
      required: [true, 'Skill to teach is required'],
      trim: true,
    },
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required'],
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced'],
        message: '{VALUE} is not a valid experience level. Allowed: Beginner, Intermediate, Advanced',
      },
    },
    availability: {
      type: String,
      required: [true, 'Availability is required'],
      enum: {
        values: ['Weekdays', 'Weekends', 'Both'],
        message: '{VALUE} is not a valid availability option. Allowed: Weekdays, Weekends, Both',
      },
    },
    preferredSession: {
      type: String,
      required: [true, 'Preferred session time is required'],
      enum: {
        values: ['Morning', 'Afternoon', 'Evening', 'Flexible'],
        message: '{VALUE} is not a valid session time. Allowed: Morning, Afternoon, Evening, Flexible',
      },
    },
    bio: {
      type: String,
      required: false,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and matching algorithms (userId is already indexed via unique: true)
skillProfileSchema.index({ skillToLearn: 1 });
skillProfileSchema.index({ skillToTeach: 1 });

const SkillProfile = mongoose.model('SkillProfile', skillProfileSchema);

export default SkillProfile;

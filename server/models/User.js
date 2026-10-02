import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 * Represents student and administrator accounts in Skill Swap AI
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: false, // Optional for Google OAuth users; required for standard registration in Phase 5
    },
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allows multiple null/undefined values without duplicate key collision
    },
    profileImage: {
      type: String,
      required: false,
      default: '',
    },
    bio: {
      type: String,
      required: false,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role. Allowed roles: user, admin',
      },
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Method to compare entered password with stored hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

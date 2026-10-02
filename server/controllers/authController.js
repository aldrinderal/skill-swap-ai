import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { verifyGoogleIdToken } from '../config/googleAuth.js';

// Simple email validation regex
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation checks
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must contain at least 2 characters.',
      });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must contain at least 6 characters.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();

    // 2. Check for duplicate email
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // 3. Hash password using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Create and save user document
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    // 5. Generate JWT token
    const token = generateToken(user._id);

    // 6. Return response (never exposing password/hash)
    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user & get JWT token
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // If user does not exist or has no password (e.g. registered via Google only)
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Compare password with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Generate JWT
    const token = generateToken(user._id);

    // 5. Return user details and token
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * @route GET /api/auth/me
 * @access Private (Requires JWT)
 */
export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage,
      bio: req.user.bio,
    },
  });
};

/**
 * Google OAuth Login & Verification
 * @route POST /api/auth/google
 * @access Public
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    // 1. Validate request body
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.',
      });
    }

    // 2. Validate server environment configuration
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured on the server. Please set GOOGLE_CLIENT_ID in server/.env.',
      });
    }

    // 3. Cryptographically verify Google ID Token with Google Identity Services
    let payload;
    try {
      payload = await verifyGoogleIdToken(credential);
    } catch (verifyError) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed. Unable to verify Google account.',
        error: verifyError.message,
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account does not provide a valid email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4. Check if a user already exists with this verified Google sub/googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // Update profile picture if user doesn't have one and Google provided one
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        await user.save();
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Google login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          bio: user.bio,
        },
      });
    }

    // 5. Safe Account Linking Check (Section 13)
    // If an existing account with the same email exists but has no matching googleId
    const existingEmailUser = await User.findOne({ email: normalizedEmail });

    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in with your password first before linking Google.',
      });
    }

    // 6. New User via Google: Create account without password
    user = await User.create({
      name: name || 'Google User',
      email: normalizedEmail,
      googleId,
      profileImage: picture || '',
      role: 'user',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Google login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

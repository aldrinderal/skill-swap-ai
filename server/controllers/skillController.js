import SkillProfile from '../models/SkillProfile.js';
import Feedback from '../models/Feedback.js';
import { invalidateUserRecommendationCache } from '../services/aiRecommendationService.js';

const VALID_EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_AVAILABILITY = ['Weekdays', 'Weekends', 'Both'];
const VALID_SESSIONS = ['Morning', 'Afternoon', 'Evening', 'Flexible'];

/**
 * Register a new skill profile for the authenticated user
 * @route POST /api/skills
 * @access Private
 */
export const createSkillProfile = async (req, res, next) => {
  try {
    const {
      skillToLearn,
      skillToTeach,
      experienceLevel,
      availability,
      preferredSession,
      bio,
    } = req.body;

    // Security: Authenticated user ID is obtained solely from verified JWT (req.user._id)
    const userId = req.user._id;

    // 1. Check if user already has a skill profile (Section 17: prevent duplicate profile)
    const existingProfile = await SkillProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'You already have a skill profile.',
      });
    }

    // 2. Required fields validation
    if (!skillToLearn || !skillToLearn.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a skill you want to learn.',
      });
    }

    if (!skillToTeach || !skillToTeach.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a skill you can teach.',
      });
    }

    // 3. Prevent same skill for teaching and learning (Section 8)
    if (skillToLearn.trim().toLowerCase() === skillToTeach.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Please choose different skills for learning and teaching.',
      });
    }

    // 4. Validate experience level enum
    if (!experienceLevel || !VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid experience level (${VALID_EXPERIENCE_LEVELS.join(', ')}).`,
      });
    }

    // 5. Validate availability enum
    if (!availability || !VALID_AVAILABILITY.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid availability option (${VALID_AVAILABILITY.join(', ')}).`,
      });
    }

    // 6. Validate preferred session enum
    if (!preferredSession || !VALID_SESSIONS.includes(preferredSession)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid preferred session (${VALID_SESSIONS.join(', ')}).`,
      });
    }

    // 7. Validate bio length (max 500 characters)
    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 500 characters.',
      });
    }

    // 8. Create and persist SkillProfile in MongoDB
    const profile = await SkillProfile.create({
      userId,
      skillToLearn: skillToLearn.trim(),
      skillToTeach: skillToTeach.trim(),
      experienceLevel,
      availability,
      preferredSession,
      bio: bio ? bio.trim() : '',
    });

    invalidateUserRecommendationCache(userId);

    return res.status(201).json({
      success: true,
      message: 'Skill profile created successfully.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user's skill profile
 * @route GET /api/skills/me
 * @access Private
 */
export const getMySkillProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const profile = await SkillProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Skill profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update currently authenticated user's skill profile
 * @route PUT /api/skills/me
 * @access Private
 */
export const updateMySkillProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Locate existing profile
    const profile = await SkillProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Skill profile not found.',
      });
    }

    const {
      skillToLearn,
      skillToTeach,
      experienceLevel,
      availability,
      preferredSession,
      bio,
    } = req.body;

    const newSkillToLearn = skillToLearn !== undefined ? skillToLearn.trim() : profile.skillToLearn;
    const newSkillToTeach = skillToTeach !== undefined ? skillToTeach.trim() : profile.skillToTeach;

    if (!newSkillToLearn) {
      return res.status(400).json({
        success: false,
        message: 'Skill to learn cannot be empty.',
      });
    }

    if (!newSkillToTeach) {
      return res.status(400).json({
        success: false,
        message: 'Skill to teach cannot be empty.',
      });
    }

    // 2. Prevent same skill for teaching and learning
    if (newSkillToLearn.toLowerCase() === newSkillToTeach.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Please choose different skills for learning and teaching.',
      });
    }

    // 3. Validate enums if provided
    if (experienceLevel && !VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid experience level. Allowed: ${VALID_EXPERIENCE_LEVELS.join(', ')}`,
      });
    }

    if (availability && !VALID_AVAILABILITY.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: `Invalid availability. Allowed: ${VALID_AVAILABILITY.join(', ')}`,
      });
    }

    if (preferredSession && !VALID_SESSIONS.includes(preferredSession)) {
      return res.status(400).json({
        success: false,
        message: `Invalid preferred session. Allowed: ${VALID_SESSIONS.join(', ')}`,
      });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 500 characters.',
      });
    }

    // 4. Update mutable fields (userId is never modified)
    profile.skillToLearn = newSkillToLearn;
    profile.skillToTeach = newSkillToTeach;
    if (experienceLevel) profile.experienceLevel = experienceLevel;
    if (availability) profile.availability = availability;
    if (preferredSession) profile.preferredSession = preferredSession;
    if (bio !== undefined) profile.bio = bio.trim();

    await profile.save();

    invalidateUserRecommendationCache(userId);

    return res.status(200).json({
      success: true,
      message: 'Skill profile updated successfully.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete currently authenticated user's skill profile
 * @route DELETE /api/skills/me
 * @access Private
 */
export const deleteMySkillProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const profile = await SkillProfile.findOneAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Skill profile not found.',
      });
    }

    invalidateUserRecommendationCache(userId);

    return res.status(200).json({
      success: true,
      message: 'Skill profile deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all skill profiles matching search and filter parameters
 * Excludes currently authenticated user
 * @route GET /api/skills
 * @access Private
 */
export const getAllSkillProfiles = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const {
      search,
      skill,
      skillToLearn,
      skillToTeach,
      experienceLevel,
      availability,
      preferredSession,
    } = req.query;

    // Security: exclude the currently logged in user
    const query = {
      userId: { $ne: currentUserId },
    };

    // 1. General search query across skillToLearn OR skillToTeach
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { skillToLearn: searchRegex },
        { skillToTeach: searchRegex },
      ];
    }

    // 2. Specific skill filter across skillToLearn OR skillToTeach
    if (skill && skill.trim() && skill !== 'All Skills' && skill !== 'All') {
      const skillRegex = new RegExp(`^${skill.trim()}$`, 'i');
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ skillToLearn: skillRegex }, { skillToTeach: skillRegex }] },
        ];
        delete query.$or;
      } else {
        query.$or = [{ skillToLearn: skillRegex }, { skillToTeach: skillRegex }];
      }
    }

    // 3. Specific skillToLearn or skillToTeach filters
    if (skillToLearn && skillToLearn.trim() && skillToLearn !== 'All') {
      query.skillToLearn = new RegExp(`^${skillToLearn.trim()}$`, 'i');
    }

    if (skillToTeach && skillToTeach.trim() && skillToTeach !== 'All') {
      query.skillToTeach = new RegExp(`^${skillToTeach.trim()}$`, 'i');
    }

    // 4. Experience Level filter
    if (experienceLevel && experienceLevel.trim() && experienceLevel !== 'All' && experienceLevel !== 'All Levels') {
      query.experienceLevel = experienceLevel.trim();
    }

    // 5. Availability filter
    if (availability && availability.trim() && availability !== 'All') {
      query.availability = availability.trim();
    }

    // 6. Preferred Session filter
    if (preferredSession && preferredSession.trim() && preferredSession !== 'All') {
      query.preferredSession = preferredSession.trim();
    }

    const profiles = await SkillProfile.find(query)
      .populate('userId', 'name profileImage bio')
      .sort({ createdAt: -1 });

    const validProfiles = profiles.filter((p) => p.userId);
    const userIds = validProfiles.map((p) => p.userId._id);

    // Calculate community rating & reviews count from real MongoDB feedback (Phase 14 Req 23)
    const feedbackStats = await Feedback.aggregate([
      { $match: { reviewedUserId: { $in: userIds } } },
      {
        $group: {
          _id: '$reviewedUserId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const statsMap = new Map();
    feedbackStats.forEach((stat) => {
      statsMap.set(stat._id.toString(), {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalReviews: stat.totalReviews,
      });
    });

    const formattedProfiles = validProfiles.map((p) => {
      const stats = statsMap.get(p.userId._id.toString()) || {
        averageRating: null,
        totalReviews: 0,
      };
      return {
        id: p._id,
        userId: p.userId._id,
        name: p.userId.name,
        profileImage: p.userId.profileImage || '',
        bio: p.bio || p.userId.bio || '',
        skillToTeach: p.skillToTeach,
        skillToLearn: p.skillToLearn,
        experienceLevel: p.experienceLevel,
        availability: p.availability,
        preferredSession: p.preferredSession,
        createdAt: p.createdAt,
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProfiles.length,
      profiles: formattedProfiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommended skill partner matches based on rule-based reciprocity
 * Score 2 = Perfect Skill Swap (Reciprocal)
 * Score 1 = Can Teach You
 * @route GET /api/skills/matches
 * @access Private
 */
export const getSkillMatches = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // 1. Get current user's skill profile
    const currentProfile = await SkillProfile.findOne({ userId: currentUserId });
    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Please complete your skill profile before finding matches.',
      });
    }

    // 2. Fetch other user profiles
    const otherProfiles = await SkillProfile.find({
      userId: { $ne: currentUserId },
    }).populate('userId', 'name profileImage bio');

    const myLearn = currentProfile.skillToLearn.trim().toLowerCase();
    const myTeach = currentProfile.skillToTeach.trim().toLowerCase();

    const matches = [];

    for (const other of otherProfiles) {
      if (!other.userId) continue;

      const otherTeach = other.skillToTeach.trim().toLowerCase();
      const otherLearn = other.skillToLearn.trim().toLowerCase();

      // Check rule-based criteria (Phase 8 Section 14-16)
      const canTeachMe = otherTeach === myLearn;
      const canLearnFromMe = otherLearn === myTeach;

      let matchScore = 0;
      let matchType = '';

      if (canTeachMe && canLearnFromMe) {
        matchScore = 2;
        matchType = 'Perfect Skill Swap';
      } else if (canTeachMe) {
        matchScore = 1;
        matchType = 'Can Teach You';
      }

      if (matchScore > 0) {
        matches.push({
          userId: other.userId._id,
          name: other.userId.name,
          profileImage: other.userId.profileImage || '',
          bio: other.bio || other.userId.bio || '',
          skillToTeach: other.skillToTeach,
          skillToLearn: other.skillToLearn,
          experienceLevel: other.experienceLevel,
          availability: other.availability,
          preferredSession: other.preferredSession,
          matchScore,
          matchType,
        });
      }
    }

    // Sort by matchScore descending (2 points first, then 1 point)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public skill profile for another user
 * Never returns password, googleId, or private secrets
 * @route GET /api/skills/:userId
 * @access Private
 */
export const getPublicSkillProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Search by User ObjectId
    let profile = await SkillProfile.findOne({ userId }).populate('userId', 'name profileImage bio');

    // Fallback: search by SkillProfile ObjectId if provided
    if (!profile && userId.match(/^[0-9a-fA-F]{24}$/)) {
      profile = await SkillProfile.findById(userId).populate('userId', 'name profileImage bio');
    }

    if (!profile || !profile.userId) {
      return res.status(404).json({
        success: false,
        message: 'Skill profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      profile: {
        userId: profile.userId._id,
        name: profile.userId.name,
        profileImage: profile.userId.profileImage || '',
        bio: profile.bio || profile.userId.bio || '',
        skillToTeach: profile.skillToTeach,
        skillToLearn: profile.skillToLearn,
        experienceLevel: profile.experienceLevel,
        availability: profile.availability,
        preferredSession: profile.preferredSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

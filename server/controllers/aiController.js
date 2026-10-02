import SkillProfile from '../models/SkillProfile.js';
import Connection from '../models/Connection.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import {
  generateRecommendations,
  invalidateUserRecommendationCache,
} from '../services/aiRecommendationService.js';

/**
 * Get Personalized AI Skill Recommendations
 * @route GET /api/ai/recommendations
 * @access Private (Requires JWT protect)
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const bypassCache = req.query.refresh === 'true';
    const limit = parseInt(req.query.limit, 10) || 10;

    // 1. Load current user's skill profile
    const currentProfile = await SkillProfile.findOne({ userId: currentUserId });
    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        profileRequired: true,
        message: 'Please complete your skill profile before finding recommendations.',
      });
    }

    // 2. Load existing connections for current user (Req 16)
    const existingConnections = await Connection.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    });

    const connectedUserIds = new Set();
    for (const conn of existingConnections) {
      const u1Str = conn.user1.toString();
      const u2Str = conn.user2.toString();
      connectedUserIds.add(u1Str === currentUserId.toString() ? u2Str : u1Str);
    }

    // 3. Load pending connection requests involving current user (Req 17)
    const pendingSent = await ConnectionRequest.find({
      sender: currentUserId,
      status: 'pending',
    });
    const pendingReceived = await ConnectionRequest.find({
      receiver: currentUserId,
      status: 'pending',
    });

    const pendingSentUserIds = new Set(pendingSent.map((r) => r.receiver.toString()));
    const pendingReceivedUserIds = new Set(pendingReceived.map((r) => r.sender.toString()));

    // 4. Fetch candidate skill profiles (excluding current user)
    const candidateProfiles = await SkillProfile.find({
      userId: { $ne: currentUserId },
    }).populate('userId', 'name profileImage bio');

    // 5. Generate recommendations through recommendation engine
    const result = await generateRecommendations({
      currentUser: req.user,
      currentProfile,
      candidateProfiles,
      connectedUserIds,
      pendingSentUserIds,
      pendingReceivedUserIds,
      bypassCache,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: result.recommendations.length,
      recommendations: result.recommendations,
      skillPath: result.skillPath,
      engine: result.engine,
      totalFound: result.totalFound,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invalidate user cache manually or after updates
 */
export const clearUserCache = async (req, res) => {
  try {
    invalidateUserRecommendationCache(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Recommendation cache cleared successfully.',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear recommendation cache.',
    });
  }
};

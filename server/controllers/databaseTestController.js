import mongoose from 'mongoose';

/**
 * Database Test Controller
 * Inspects real Mongoose connection state and registered models
 * @route GET /api/database-test
 * @access Public (Development)
 */
export const checkDatabaseStatus = (req, res) => {
  // readyState values: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isConnected = mongoose.connection.readyState === 1;

  if (isConnected) {
    return res.status(200).json({
      success: true,
      database: 'connected',
      name: mongoose.connection.name || 'skillswap_ai',
      models: Object.keys(mongoose.models), // Verifies User, SkillProfile, ConnectionRequest, Meeting, Message are registered
    });
  }

  return res.status(503).json({
    success: false,
    database: 'disconnected',
  });
};

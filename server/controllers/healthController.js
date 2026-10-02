/**
 * Health Check Controller
 * Verifies backend API service availability
 * @route GET /api/health
 * @access Public
 */
export const checkHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Skill Swap AI backend is running',
  });
};

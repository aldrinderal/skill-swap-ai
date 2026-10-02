import API from './api';

/**
 * AI Recommendation API Service (Phase 13)
 * Interacts with /api/ai endpoints using the centralized Axios instance
 */

/**
 * Fetch personalized AI-assisted & skill-based recommendations
 * @param {Object} options
 * @param {boolean} options.refresh - Force bypass cache on server
 * @param {number} options.limit - Max recommendations to return (default 10)
 * @returns {Promise<Object>} API response data with recommendations and skillPath
 */
export const getRecommendations = async ({ refresh = false, limit = 10 } = {}) => {
  const response = await API.get('/ai/recommendations', {
    params: {
      refresh: refresh ? 'true' : 'false',
      limit,
    },
  });
  return response.data;
};

/**
 * Clear cached recommendations on the backend
 * @returns {Promise<Object>} API response
 */
export const clearRecommendationCache = async () => {
  const response = await API.post('/ai/clear-cache');
  return response.data;
};

export default {
  getRecommendations,
  clearRecommendationCache,
};

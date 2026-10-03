import API from './api';

/**
 * Feedback API Service (Phase 14)
 * Handles post-meeting rating and review submissions and statistics
 */

export const submitFeedback = async ({ meetingId, rating, comment }) => {
  const response = await API.post('/feedback', {
    meetingId,
    rating,
    comment,
  });
  return response.data;
};

export const checkFeedback = async (meetingId) => {
  const response = await API.get(`/feedback/check/${meetingId}`);
  return response.data;
};

export const getMeetingFeedback = async (meetingId) => {
  const response = await API.get(`/feedback/meeting/${meetingId}`);
  return response.data;
};

export const getUserFeedback = async (userId) => {
  const response = await API.get(`/feedback/user/${userId}`);
  return response.data;
};

export const getPlatformFeedbackStats = async () => {
  const response = await API.get('/feedback/stats');
  return response.data;
};

export default {
  submitFeedback,
  checkFeedback,
  getMeetingFeedback,
  getUserFeedback,
  getPlatformFeedbackStats,
};

import API from './api';

/**
 * Meeting API Service (Phase 11)
 * Encapsulates all REST requests for WebRTC peer meetings
 */

// Start a meeting invitation with a connected partner (Section 4)
export const startMeeting = async (userId) => {
  const res = await API.post(`/meetings/start/${userId}`);
  return res.data;
};

// Retrieve meeting info, participant profiles, and authoritative timer (Section 72)
export const getMeeting = async (meetingId) => {
  const res = await API.get(`/meetings/${meetingId}`);
  return res.data;
};

// Accept meeting invitation (Section 9)
export const acceptMeeting = async (meetingId) => {
  const res = await API.put(`/meetings/${meetingId}/accept`);
  return res.data;
};

// Reject meeting invitation (Section 10)
export const rejectMeeting = async (meetingId) => {
  const res = await API.put(`/meetings/${meetingId}/reject`);
  return res.data;
};

// End meeting session (Section 73)
export const endMeeting = async (meetingId) => {
  const res = await API.put(`/meetings/${meetingId}/end`);
  return res.data;
};

// Retrieve chat history (Section 49)
export const getMeetingMessages = async (meetingId) => {
  const res = await API.get(`/meetings/${meetingId}/messages`);
  return res.data;
};

export default {
  startMeeting,
  getMeeting,
  acceptMeeting,
  rejectMeeting,
  endMeeting,
  getMeetingMessages,
};

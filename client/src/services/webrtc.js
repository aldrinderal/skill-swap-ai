/**
 * WebRTC Service (Phase 11)
 * Manages peer connection lifecycle, media devices, and ICE configuration
 */

// Free / Public STUN configuration with optional TURN support (Section 24 & 25)
export const getIceServers = () => {
  const envServers = import.meta.env.VITE_ICE_SERVERS;
  if (envServers) {
    try {
      return JSON.parse(envServers);
    } catch (e) {
      console.warn('Could not parse VITE_ICE_SERVERS, falling back to public STUN servers', e);
    }
  }

  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];
};

/**
 * Acquire Local Camera and Microphone Stream
 * Gracefully handles audio-only fallback if video is unavailable (Sections 12-19)
 */
export const getLocalMediaStream = async (constraints = { video: true, audio: true }) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      stream: null,
      audioOnly: false,
      error: new Error('Media devices API is not supported in this browser.'),
    };
  }

  try {
    // 1. Attempt standard video + audio capture
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream, audioOnly: false, error: null };
  } catch (videoError) {
    console.warn('Initial camera/mic access failed, attempting audio-only fallback:', videoError.message);

    // 2. Fallback to audio-only if camera is unavailable or denied (Section 16 & 18)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      return {
        stream: audioStream,
        audioOnly: true,
        error: null,
        warning: 'Camera unavailable. Continuing with audio only.',
      };
    } catch (audioError) {
      // 3. Both camera and microphone failed or denied (Section 19)
      return {
        stream: null,
        audioOnly: false,
        error: audioError,
      };
    }
  }
};

/**
 * Create RTCPeerConnection instance (Section 11)
 */
export const createPeerConnection = ({
  iceServers = getIceServers(),
  onTrack,
  onIceCandidate,
  onConnectionStateChange,
}) => {
  const pc = new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 10,
  });

  if (onTrack) {
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onTrack(event.streams[0]);
      }
    };
  }

  if (onIceCandidate) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  }

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };
  }

  return pc;
};

/**
 * Safely stop all tracks in a MediaStream (Section 68)
 */
export const stopMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn('Error stopping track:', e);
      }
    });
  }
};

/**
 * Check if the current browser environment supports getDisplayMedia (Phase 12 - Section 21)
 */
export const isScreenShareSupported = () => {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
};

/**
 * Capture Display Media Stream (Screen / Window / Tab) (Phase 12 - Section 3)
 */
export const getDisplayMediaStream = async (
  constraints = { video: { cursor: 'always' }, audio: false }
) => {
  if (!isScreenShareSupported()) {
    throw new Error('Screen sharing is not supported by this browser.');
  }
  return await navigator.mediaDevices.getDisplayMedia(constraints);
};

/**
 * Replace Video Track on active RTCPeerConnection sender (Phase 12 - Section 5 & 10)
 * Uses RTCRtpSender.replaceTrack() without renegotiating peer connections
 */
export const replaceVideoTrack = async (pc, newTrack) => {
  if (!pc) return null;
  const senders = pc.getSenders ? pc.getSenders() : [];
  const videoSender =
    senders.find((s) => s.track && s.track.kind === 'video') ||
    senders.find((s) => s.kind === 'video');

  if (videoSender && typeof videoSender.replaceTrack === 'function') {
    await videoSender.replaceTrack(newTrack);
    return videoSender;
  }
  return null;
};

export default {
  getIceServers,
  getLocalMediaStream,
  createPeerConnection,
  stopMediaStream,
  isScreenShareSupported,
  getDisplayMediaStream,
  replaceVideoTrack,
};

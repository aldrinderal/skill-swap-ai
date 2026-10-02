import { io } from 'socket.io-client';

let socket = null;

/**
 * Socket.IO Client Service (Phase 10)
 * Manages singleton socket connection with automatic JWT authentication
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but disconnected, disconnect and clean before recreating
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  socket = io(socketUrl, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

/**
 * Disconnect and clean up active socket connection
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get active socket instance
 */
export const getSocket = () => {
  return socket;
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
};

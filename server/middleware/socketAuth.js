import jwt from 'jsonwebtoken';

/**
 * Socket.IO JWT Authentication Middleware (Phase 10)
 * Verifies JWT token attached in socket.handshake.auth.token or headers.authorization
 * Attaches decoded userId to socket object
 */
export const socketAuth = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Strip "Bearer " prefix if provided
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    const secret = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_dev';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return next(new Error('Invalid authentication token'));
    }

    // Attach authenticated identity to socket
    socket.userId = userId.toString();
    socket.user = {
      id: userId.toString(),
      email: decoded.email,
    };

    next();
  } catch (err) {
    return next(new Error('Invalid authentication token'));
  }
};

export default socketAuth;

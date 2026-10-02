import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();

  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected'); // 'Connecting...' | 'Connected' | 'Reconnecting...' | 'Disconnected'
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [realtimeNotification, setRealtimeNotification] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // Phase 11: { meetingId, caller: { id, name, profileImage } }

  const notificationTimeoutRef = useRef(null);

  // Trigger a friendly toast notification that auto-dismisses after 6 seconds
  const showNotification = (notification) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setRealtimeNotification(notification);
    notificationTimeoutRef.current = setTimeout(() => {
      setRealtimeNotification(null);
    }, 6000);
  };

  const clearNotification = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setRealtimeNotification(null);
  };

  useEffect(() => {
    // Connect Socket only when authenticated with valid token
    if (isAuthenticated && token) {
      setConnectionStatus('Connecting...');
      const s = connectSocket(token);
      setSocket(s);

      // 1. Connection established
      const onConnect = () => {
        setIsSocketConnected(true);
        setConnectionStatus('Connected');
      };

      // 2. Disconnect
      const onDisconnect = (reason) => {
        setIsSocketConnected(false);
        setConnectionStatus('Disconnected');
      };

      // 3. Connection Error
      const onConnectError = (err) => {
        setIsSocketConnected(false);
        setConnectionStatus('Disconnected');
      };

      // 4. Reconnection Attempt
      const onReconnectAttempt = () => {
        setConnectionStatus('Reconnecting...');
      };

      // 5. Initial list of online users
      const onOnlineList = (data) => {
        if (data?.onlineUserIds) {
          setOnlineUsers(new Set(data.onlineUserIds));
        }
      };

      // 6. User comes online
      const onUserOnline = ({ userId }) => {
        if (userId) {
          setOnlineUsers((prev) => new Set([...prev, userId]));
        }
      };

      // 7. User goes offline
      const onUserOffline = ({ userId }) => {
        if (userId) {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(userId);
            return updated;
          });
        }
      };

      // 8. Real-time Connection Request Event (Section 27 & 30)
      const onConnectionRequest = (data) => {
        showNotification({
          type: 'request',
          title: 'New Connection Request',
          message: `${data.sender?.name || 'A learner'} sent you a skill swap request!`,
          data,
        });
      };

      // 9. Real-time Connection Accepted Event (Section 28 & 31)
      const onConnectionAccepted = (data) => {
        showNotification({
          type: 'accepted',
          title: 'Request Accepted',
          message: `${data.user?.name || 'A partner'} accepted your skill connection!`,
          data,
        });
      };

      // 10. Real-time Connection Rejected Event (Section 29 & 32)
      const onConnectionRejected = (data) => {
        showNotification({
          type: 'rejected',
          title: 'Request Declined',
          message: 'Your connection request was declined.',
          data,
        });
      };

      // 11. Phase 11: Real-time Incoming Call Invitation (Section 7 & 8)
      const onCallIncoming = (data) => {
        setIncomingCall({
          meetingId: data.meetingId,
          caller: data.caller,
        });
      };

      // 12. Phase 11: Call Invitation Timeout / Missed (Section 61 & 62)
      const onCallTimeout = (data) => {
        setIncomingCall((curr) => {
          if (curr && curr.meetingId === data.meetingId) {
            return null;
          }
          return curr;
        });
        if (data?.message) {
          showNotification({
            type: 'rejected',
            title: 'Call Timeout',
            message: data.message,
          });
        }
      };

      // 13. Phase 11: Call Cancelled by Caller
      const onCallCancelled = (data) => {
        setIncomingCall((curr) => {
          if (curr && curr.meetingId === data.meetingId) {
            return null;
          }
          return curr;
        });
      };

      // Register listeners
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      s.on('connect_error', onConnectError);
      s.on('reconnect_attempt', onReconnectAttempt);
      s.on('users:online_list', onOnlineList);
      s.on('user:online', onUserOnline);
      s.on('user:offline', onUserOffline);
      s.on('connection:request', onConnectionRequest);
      s.on('connection:accepted', onConnectionAccepted);
      s.on('connection:rejected', onConnectionRejected);
      s.on('call:incoming', onCallIncoming);
      s.on('call:timeout', onCallTimeout);
      s.on('call:cancelled', onCallCancelled);

      // Cleanup on unmount or authentication change (Section 33)
      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
        s.off('connect_error', onConnectError);
        s.off('reconnect_attempt', onReconnectAttempt);
        s.off('users:online_list', onOnlineList);
        s.off('user:online', onUserOnline);
        s.off('user:offline', onUserOffline);
        s.off('connection:request', onConnectionRequest);
        s.off('connection:accepted', onConnectionAccepted);
        s.off('connection:rejected', onConnectionRejected);
        s.off('call:incoming', onCallIncoming);
        s.off('call:timeout', onCallTimeout);
        s.off('call:cancelled', onCallCancelled);
      };
    } else {
      // Disconnect socket on logout
      disconnectSocket();
      setSocket(null);
      setIsSocketConnected(false);
      setConnectionStatus('Disconnected');
      setOnlineUsers(new Set());
      setIncomingCall(null);
    }
  }, [isAuthenticated, token]);

  // Phase 11 Call Actions
  const acceptIncomingCall = (meetingId) => {
    const s = getSocket();
    if (s && s.connected) {
      s.emit('call:accept', { meetingId });
    }
    setIncomingCall(null);
    return meetingId;
  };

  const rejectIncomingCall = (meetingId) => {
    const s = getSocket();
    if (s && s.connected) {
      s.emit('call:reject', { meetingId });
    }
    setIncomingCall(null);
  };

  const dismissIncomingCall = () => {
    setIncomingCall(null);
  };

  // Dev helper: emit ping and measure response latency (Section 20)
  const ping = () => {
    return new Promise((resolve, reject) => {
      const activeSocket = getSocket();
      if (!activeSocket || !activeSocket.connected) {
        return reject(new Error('Socket not connected'));
      }
      const start = Date.now();
      activeSocket.once('pong', (data) => {
        resolve({ latencyMs: Date.now() - start, timestamp: data?.timestamp });
      });
      activeSocket.emit('ping');
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isSocketConnected,
        connectionStatus,
        onlineUsers,
        realtimeNotification,
        clearNotification,
        incomingCall,
        acceptIncomingCall,
        rejectIncomingCall,
        dismissIncomingCall,
        ping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;

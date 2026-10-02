import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * SocketStatus Component (Phase 10 Section 19)
 * Subtle visual indicator displaying real-time WebSocket connection state
 */
export default function SocketStatus() {
  const { isAuthenticated } = useAuth();
  const { isSocketConnected, connectionStatus } = useSocket();

  if (!isAuthenticated) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight border transition-colors bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-2xs"
      title={`Socket.IO Status: ${connectionStatus}`}
    >
      <span className="relative flex h-2 w-2">
        {isSocketConnected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        ) : connectionStatus === 'Connecting...' || connectionStatus === 'Reconnecting...' ? (
          <>
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        )}
      </span>

      <span
        className={`hidden sm:inline ${
          isSocketConnected
            ? 'text-emerald-700 dark:text-emerald-300'
            : connectionStatus === 'Connecting...' || connectionStatus === 'Reconnecting...'
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-rose-700 dark:text-rose-300'
        }`}
      >
        {isSocketConnected
          ? 'Live Connected'
          : connectionStatus}
      </span>
    </div>
  );
}

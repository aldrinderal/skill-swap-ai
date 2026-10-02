import React from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { UserPlus, CheckCircle2, XCircle, X, ArrowRight } from 'lucide-react';

/**
 * RealtimeToast Component (Phase 10 Section 30, 31, 32)
 * Renders instant toast notifications received over WebSocket events
 */
export default function RealtimeToast() {
  const { realtimeNotification, clearNotification } = useSocket();

  if (!realtimeNotification) return null;

  const { type, title, message } = realtimeNotification;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl shadow-indigo-950/10 flex items-start gap-3 relative">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            type === 'request'
              ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
              : type === 'accepted'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
          }`}
        >
          {type === 'request' && <UserPlus className="w-5 h-5" />}
          {type === 'accepted' && <CheckCircle2 className="w-5 h-5" />}
          {type === 'rejected' && <XCircle className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {message}
          </p>

          <div className="pt-2">
            {type === 'request' && (
              <Link
                to="/requests"
                onClick={clearNotification}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Requests <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            {type === 'accepted' && (
              <Link
                to="/connections"
                onClick={clearNotification}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Partner in Connections <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={clearNotification}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

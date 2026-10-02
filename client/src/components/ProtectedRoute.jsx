import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

/**
 * ProtectedRoute Component
 * Guards private routes. If user is unauthenticated, redirects to /login.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white animate-pulse shadow-lg shadow-indigo-600/30">
          <Sparkles className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-xs font-semibold tracking-wide">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

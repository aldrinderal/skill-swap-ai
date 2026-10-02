import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  UserCheck,
  Zap,
} from 'lucide-react';
import Button from './Button';
import API from '../services/api';

/**
 * RecommendationCard (Phase 13)
 * Displays a recommended skill partner with AI/deterministic match reasoning,
 * profile details, and interactive connection actions.
 */
export default function RecommendationCard({ recommendation, onRequestSent }) {
  const {
    user,
    canTeach,
    wantsToLearn,
    experienceLevel = 'Intermediate',
    availability = 'Flexible',
    preferredSession = 'Flexible',
    bio,
    matchReasons = [],
    matchType = 'skill-based',
    compatibilityTier = 'reciprocal',
    isReciprocal = false,
    connectionStatus: initialStatus = 'none',
  } = recommendation;

  const [connectionStatus, setConnectionStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendRequest = async () => {
    if (connectionStatus !== 'none') return;

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await API.post(`/connections/request/${user.id}`);
      if (res.data.success) {
        setConnectionStatus('pending_sent');
        if (onRequestSent) onRequestSent(user.id);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        if (err.response.data.message?.includes('already connected')) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('pending_sent');
        }
      } else {
        setErrorMessage(err.response?.data?.message || 'Could not send request');
      }
    } finally {
      setLoading(false);
    }
  };

  const isAi = matchType === 'ai-assisted';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Accent Gradient Border */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isReciprocal
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500'
            : isAi
            ? 'bg-gradient-to-r from-violet-500 to-indigo-500'
            : 'bg-gradient-to-r from-indigo-500 to-sky-500'
        }`}
      />

      <div>
        {/* Header: User Avatar, Name, Match Badge */}
        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {experienceLevel}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {availability}
                </span>
              </div>
            </div>
          </div>

          {/* Engine Type Tag */}
          <div className="shrink-0">
            {isAi ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800">
                <Sparkles className="w-3 h-3 text-violet-500" />
                AI-assisted match
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                Skill-based match
              </span>
            )}
          </div>
        </div>

        {/* Reciprocal Banner if Perfect/Reciprocal Match */}
        {isReciprocal && (
          <div className="mb-3.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Strong skill exchange compatibility</span>
          </div>
        )}

        {/* Skills: Can Teach & Wants to Learn */}
        <div className="space-y-2 mb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Can Teach</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {canTeach}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Wants to Learn</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {wantsToLearn}
            </p>
          </div>
        </div>

        {/* Why this match? Box (Req 13, 33) */}
        <div className="mb-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Why this match?
          </p>
          <div className="space-y-1">
            {matchReasons.slice(0, 2).map((reason, idx) => (
              <p
                key={idx}
                className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
              >
                "{reason}"
              </p>
            ))}
          </div>
        </div>

        {/* Optional Bio preview */}
        {bio && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed italic">
            "{bio}"
          </p>
        )}
      </div>

      {/* Footer Actions: View Profile & Connect Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {errorMessage && (
          <p className="text-[11px] text-rose-500 font-medium text-center">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/skills/user/${user.id}`}
            aria-label={`View public profile of ${user.name}`}
            className="w-full"
          >
            <Button variant="outline" size="sm" fullWidth icon={ArrowRight}>
              View Profile
            </Button>
          </Link>

          {connectionStatus === 'connected' ? (
            <Button
              variant="secondary"
              size="sm"
              disabled
              fullWidth
              icon={UserCheck}
              className="opacity-75 cursor-not-allowed"
            >
              Connected
            </Button>
          ) : connectionStatus === 'pending_sent' ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              fullWidth
              icon={CheckCircle2}
              className="text-indigo-600 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 cursor-not-allowed"
            >
              Request Sent
            </Button>
          ) : connectionStatus === 'pending_received' ? (
            <Link to="/requests" className="w-full">
              <Button variant="primary" size="sm" fullWidth icon={CheckCircle2}>
                Respond
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              loading={loading}
              onClick={handleSendRequest}
              icon={Send}
              aria-label={`Send connection request to ${user.name}`}
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

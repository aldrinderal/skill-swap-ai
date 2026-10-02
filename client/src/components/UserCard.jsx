import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Calendar,
  Sparkles, 
  ArrowRight,
  Send,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import Button from './Button';
import API from '../services/api';

/**
 * UserCard / PartnerCard Component (Phase 9)
 * Displays a skill-swap partner from the search directory with functional Connect button
 */
export default function UserCard({
  userId,
  name,
  profileImage,
  bio,
  skillToTeach,
  skillToLearn,
  experienceLevel = 'Intermediate',
  availability = 'Weekends',
  preferredSession = 'Evening',
}) {
  const [requestStatus, setRequestStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'connected'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendRequest = async () => {
    try {
      setRequestStatus('sending');
      setErrorMessage('');
      const res = await API.post(`/connections/request/${userId}`);
      if (res.data.success) {
        setRequestStatus('sent');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        if (err.response.data.message?.includes('already connected')) {
          setRequestStatus('connected');
        } else {
          setRequestStatus('sent');
        }
      } else {
        setRequestStatus('idle');
        setErrorMessage(err.response?.data?.message || 'Error');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, Experience */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-500/20"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                {name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {name}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
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

        {/* Bio */}
        {bio && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {bio}
          </p>
        )}

        {/* Skills Breakdown */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
              <GraduationCap className="w-3.5 h-3.5" /> Can Teach:
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg px-2.5 py-1.5">
              {skillToTeach}
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5" /> Wants To Learn:
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 rounded-lg px-2.5 py-1.5">
              {skillToLearn}
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="text-[11px] text-rose-500 font-medium mt-2">{errorMessage}</p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Link to={`/skills/user/${userId}`} className="flex-1">
          <Button variant="outline" size="sm" fullWidth icon={ArrowRight}>
            View Profile
          </Button>
        </Link>

        {requestStatus === 'connected' ? (
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Connected
          </span>
        ) : requestStatus === 'sent' ? (
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Request Sent
          </span>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={requestStatus === 'sending' ? Loader2 : Send}
            loading={requestStatus === 'sending'}
            onClick={handleSendRequest}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

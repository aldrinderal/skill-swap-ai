import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Calendar, 
  ArrowRight,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import Button from './Button';

/**
 * MatchCard Component
 * Displays a recommended skill partner with rule-based match score badge
 * Score 2: Perfect Skill Swap (Reciprocal)
 * Score 1: Can Teach You
 */
export default function MatchCard({ match }) {
  const isPerfectSwap = match.matchScore === 2;

  return (
    <div
      className={`relative rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg ${
        isPerfectSwap
          ? 'border-emerald-200/90 dark:border-emerald-800/80 ring-1 ring-emerald-500/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Match Score Badge (Section 20: Perfect Skill Swap / Can Teach You) */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {isPerfectSwap ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Perfect Skill Swap
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-800 shadow-sm">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Can Teach You
          </span>
        )}

        <span className="text-[11px] font-mono text-slate-400">
          Match Score: <strong>{match.matchScore}</strong>
        </span>
      </div>

      <div>
        {/* User Identity Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative shrink-0">
            {match.profileImage ? (
              <img
                src={match.profileImage}
                alt={match.name}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                {match.name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {match.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span>{match.experienceLevel}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {match.availability}
              </span>
            </div>
          </div>
        </div>

        {/* Short Bio */}
        {match.bio && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {match.bio}
          </p>
        )}

        {/* Skill Exchange Information */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
              <GraduationCap className="w-3.5 h-3.5" /> Can Teach:
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white text-right truncate">
              {match.skillToTeach}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 shrink-0">
              <BookOpen className="w-3.5 h-3.5" /> Wants To Learn:
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white text-right truncate">
              {match.skillToLearn}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Link to={`/skills/user/${match.userId}`} className="w-full">
          <Button variant="primary" size="sm" fullWidth icon={ArrowRight}>
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}

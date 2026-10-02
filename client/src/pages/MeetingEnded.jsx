import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Users, ArrowRight, Sparkles, Star } from 'lucide-react';
import Button from '../components/Button';

export default function MeetingEnded() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none text-center space-y-6">
        {/* Animated Celebration Icon */}
        <div className="relative mx-auto w-16 h-16">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            30-Minute Time Limit Reached
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Session Completed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Your 30-minute skill swap session has ended. We hope you and your partner learned something valuable!
          </p>
        </div>

        {/* Session Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              30:00 (Full Session)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Skill Partner
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Rahul Sharma
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500">Skills Traded</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              MERN Stack &harr; UI/UX
            </span>
          </div>
        </div>

        {/* Quick Rate Feedback */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold text-slate-500">How was your session?</p>
          <div className="flex items-center justify-center gap-1.5 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="hover:scale-125 transition-transform"
                onClick={() => alert(`Thanks for rating ${star} stars!`)}
              >
                <Star className="w-5 h-5 fill-amber-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link to="/connections" className="block">
            <Button variant="primary" size="md" fullWidth icon={Users}>
              Back to Connections
            </Button>
          </Link>
          <Link to="/skills" className="block">
            <Button variant="outline" size="md" fullWidth icon={ArrowRight}>
              Find Another Skill
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

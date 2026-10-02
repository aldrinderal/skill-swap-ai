import React from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Reusable SkillCard Component
 * Displays a category skill with icon, details, and action link
 */
export default function SkillCard({
  title,
  description,
  icon: Icon,
  usersCount = '40+ Learners',
  badge = 'Popular',
  to = '/skills',
}) {
  return (
    <div className="group relative bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
            {Icon && <Icon className="w-6 h-6" />}
          </div>
          {badge && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {usersCount}
        </span>

        <Link
          to={to}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform"
        >
          Explore
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

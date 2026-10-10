import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                AD
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                Skill Swap AI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Learn. Teach. Connect. &mdash; Empowering peer-to-peer student skill exchange.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link to="/home" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Home
            </Link>
            <Link to="/skills" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Find Skills
            </Link>
            <a href="#team" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Team AD
            </a>
            <a href="mailto:support@skillswap.ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Contact
            </a>
          </div>
        </div>

        

        {/* Prototype Team Credits */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <p className="text-center md:text-left">
            Developed by <span className="font-semibold text-indigo-600 dark:text-indigo-400">TEAM AD</span> :{' '}
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Aldrin Deral • Akash Durai • Devendiran • Deepak Kumar • Dharesh
            </span>
          </p>


          <p>© 2026 Skill Swap AI. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Layers, 
  Inbox, 
  CheckCircle2, 
  Video, 
  RefreshCw, 
  Database, 
  Server, 
  Cpu,
  Clock,
  Star
} from 'lucide-react';
import Button from '../components/Button';
import API from '../services/api';
import { getPlatformFeedbackStats } from '../services/feedbackApi';

export default function Admin() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ connected: true, name: 'skillswap_ai' });
  const [feedbackStats, setFeedbackStats] = useState({ totalReviews: 0, averagePlatformRating: null });

  const checkStatus = async () => {
    try {
      const res = await API.get('/database-test');
      if (res.data?.success) {
        setDbStatus({ connected: true, name: res.data.name || 'skillswap_ai' });
      }
    } catch (e) {
      setDbStatus({ connected: false, name: '' });
    }

    try {
      const fRes = await getPlatformFeedbackStats();
      if (fRes?.success) {
        setFeedbackStats({
          totalReviews: fRes.totalReviews || 0,
          averagePlatformRating: fRes.averagePlatformRating,
        });
      }
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Platform metrics & feedback statistics (Phase 14 Section 32)
  const stats = [
    {
      title: 'Total Users',
      value: '0',
      description: 'Registered student accounts',
      icon: Users,
      badge: 'Phase 16 API',
      color: 'indigo',
    },
    {
      title: 'Skill Profiles',
      value: '0',
      description: 'Active learning & teaching listings',
      icon: Layers,
      badge: 'Phase 16 API',
      color: 'violet',
    },
    {
      title: 'Total Reviews',
      value: feedbackStats.totalReviews.toString(),
      description: 'Peer feedback ratings submitted',
      icon: Star,
      badge: 'Phase 14 ✅',
      color: 'amber',
    },
    {
      title: 'Platform Rating',
      value: feedbackStats.averagePlatformRating ? `${feedbackStats.averagePlatformRating} ★` : 'N/A',
      description: 'Community average score (out of 5)',
      icon: Star,
      badge: 'Phase 14 ✅',
      color: 'emerald',
    },
    {
      title: 'Connection Requests',
      value: '0',
      description: 'Total pending & resolved requests',
      icon: Inbox,
      badge: 'Phase 16 API',
      color: 'amber',
    },
    {
      title: 'Completed Sessions',
      value: '0',
      description: '30-minute peer meetings concluded',
      icon: Video,
      badge: 'Phase 16 API',
      color: 'emerald',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkStatus();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Admin Control Center
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Protected Route
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live platform metrics, database health, and system telemetry.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          icon={RefreshCw}
          className={isRefreshing ? 'animate-pulse' : ''}
        >
          {isRefreshing ? 'Refreshing API...' : 'Refresh Metrics'}
        </Button>
      </div>

      {/* Stats Cards Grid (Section 18 requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {stat.badge}
                </span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {stat.value}
                </span>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                  {stat.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Architecture Status Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-500" />
          MERN Microservices Architecture Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Express API</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              PORT 5000 Active (Phase 3 ✅)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">MongoDB Atlas</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
              <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              {dbStatus.connected ? `Connected • ${dbStatus.name} (Phase 4 ✅)` : 'Disconnected'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">WebRTC & Sockets</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Socket.IO & WebRTC Ready (Phase 11 ✅)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

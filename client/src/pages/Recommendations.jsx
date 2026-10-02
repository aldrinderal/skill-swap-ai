import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Zap,
  GraduationCap,
  Compass,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { getRecommendations } from '../services/aiApi';
import RecommendationCard from '../components/RecommendationCard';
import Button from '../components/Button';

/**
 * Recommendations Page (Phase 13)
 * Personalized AI skill matching & recommendations page
 */
export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [skillPath, setSkillPath] = useState(null);
  const [engine, setEngine] = useState('skill-based');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [profileRequired, setProfileRequired] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reciprocal' | 'learning_match'

  const fetchRecommendations = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setProfileRequired(false);

      const res = await getRecommendations({ refresh });
      if (res.success) {
        setRecommendations(res.recommendations || []);
        setSkillPath(res.skillPath || null);
        setEngine(res.engine || 'skill-based');
      }
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.profileRequired) {
        setProfileRequired(true);
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to load recommendations. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(false);
  }, []);

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  const filteredRecommendations = recommendations.filter((r) => {
    if (activeFilter === 'reciprocal') {
      return r.isReciprocal || r.compatibilityTier === 'reciprocal';
    }
    if (activeFilter === 'learning_match') {
      return r.compatibilityTier === 'learning_match';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            AI-POWERED RECOMMENDATIONS
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Skill Matches
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            People you may be able to learn from and teach based on reciprocal skill compatibility.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            loading={refreshing}
            onClick={handleRefresh}
            aria-label="Refresh recommendations"
            className="shrink-0"
          >
            Refresh Matches
          </Button>

          <Link to="/skills/register" className="shrink-0">
            <Button variant="primary" size="md" icon={GraduationCap}>
              Edit Skills
            </Button>
          </Link>
        </div>
      </div>

      {/* Engine Status & Guidance Banner */}
      {!loading && !profileRequired && !error && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                engine === 'ai-assisted'
                  ? 'bg-violet-500 animate-pulse'
                  : 'bg-indigo-500'
              }`}
            />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Recommendation Engine:{' '}
              <strong className="text-slate-900 dark:text-white">
                {engine === 'ai-assisted'
                  ? 'AI-Assisted Neural Matching Active'
                  : 'Skill-Based Deterministic Matching Active'}
              </strong>
            </span>
          </div>

          <span className="text-slate-500 dark:text-slate-400">
            Showing {filteredRecommendations.length} compatible candidate{filteredRecommendations.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Your Skill Path Section (Req 39) */}
      {skillPath && !profileRequired && (
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-3xl p-6 sm:p-8 border border-indigo-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Your Skill Path
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized topic suggestions based on your learning goal: <strong>{skillPath.learningGoal}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {skillPath.suggestedTopics.map((topic, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                {topic}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Informational suggestions based on reciprocal community knowledge exchange.
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && !profileRequired && recommendations.length > 0 && (
        <div className="flex items-center gap-2 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            All Matches ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveFilter('reciprocal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilter === 'reciprocal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Reciprocal Swaps ({recommendations.filter((r) => r.isReciprocal || r.compatibilityTier === 'reciprocal').length})
          </button>
          <button
            onClick={() => setActiveFilter('learning_match')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'learning_match'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Can Teach You ({recommendations.filter((r) => r.compatibilityTier === 'learning_match').length})
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              </div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : profileRequired ? (
        /* Profile Required Prompt */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Complete Your Skill Profile First
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              To discover personalized AI skill matches, please register what skills you want to learn and what skills you can teach in return.
            </p>
          </div>
          <Link to="/skills/register">
            <Button variant="primary" size="lg" icon={ArrowRight}>
              Register Your Skills
            </Button>
          </Link>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-3xl p-8 text-center max-w-md mx-auto border border-rose-200 dark:border-rose-900 space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm text-rose-800 dark:text-rose-200 font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchRecommendations(false)}>
            Try Again
          </Button>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        /* Empty State (Req 27) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No skill matches found yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Add more skills or broaden your profile to discover more people in the community ready for a skill exchange.
            </p>
          </div>
          <Link to="/skills/register">
            <Button variant="primary" size="md" icon={GraduationCap}>
              Update Skills
            </Button>
          </Link>
        </div>
      ) : (
        /* Recommendations Grid (Req 47) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.user.id}
              recommendation={rec}
              onRequestSent={(id) => {
                setRecommendations((prev) =>
                  prev.map((item) =>
                    item.user.id === id
                      ? { ...item, connectionStatus: 'pending_sent' }
                      : item
                  )
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

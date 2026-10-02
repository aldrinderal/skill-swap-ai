import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import { getRecommendations } from '../services/aiApi';
import RecommendationCard from './RecommendationCard';
import Button from './Button';

/**
 * AIRecommendations Component (Phase 13 Req 38)
 * Embedded on Home/Dashboard page to showcase personalized skill matches
 */
export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    getRecommendations({ limit: 3 })
      .then((res) => {
        if (res.success) {
          setRecommendations(res.recommendations?.slice(0, 3) || []);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404 && err.response?.data?.profileRequired) {
          setHasProfile(false);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (!hasProfile || (!loading && recommendations.length === 0)) {
    return null; // Gracefully hide from Home if user has no profile or no matches yet
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            AI SKILL RECOMMENDATIONS
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Skill Matches For You
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Based on the skills you want to learn and teach.
          </p>
        </div>

        <Link to="/recommendations">
          <Button variant="outline" size="sm" icon={ArrowRight}>
            View All Matches
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
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
    </section>
  );
}

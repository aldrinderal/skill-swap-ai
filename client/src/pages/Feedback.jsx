import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  Sparkles,
  CheckCircle2,
  Clock,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Users,
  AlertCircle,
  Loader2,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import Button from '../components/Button';
import API from '../services/api';
import meetingApi from '../services/meetingApi';
import { submitFeedback, checkFeedback } from '../services/feedbackApi';
import { useAuth } from '../context/AuthContext';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function Feedback() {
  const { meetingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partner, setPartner] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Check if feedback already submitted for this meeting
        const checkRes = await checkFeedback(meetingId);
        if (checkRes.success && checkRes.hasSubmitted) {
          if (isMounted) {
            setHasSubmitted(true);
            setExistingFeedback(checkRes.feedback);
          }
        }

        // 2. Load meeting details to identify partner
        const meetingRes = await meetingApi.getMeeting(meetingId);
        if (isMounted && meetingRes.success && meetingRes.meeting) {
          const m = meetingRes.meeting;
          setMeeting(m);

          const currentUserId = user?.id || user?._id;
          const isCaller = m.caller?._id === currentUserId || m.caller?.id === currentUserId;
          const partnerData = isCaller ? m.receiver : m.caller;
          setPartner(partnerData);

          // 3. Load partner's skill profile
          if (partnerData?._id || partnerData?.id) {
            try {
              const pId = partnerData._id || partnerData.id;
              const skillRes = await API.get(`/skills/${pId}`);
              if (isMounted && skillRes.data?.success) {
                setPartnerProfile(skillRes.data.profile);
              }
            } catch {
              // Non-fatal if partner profile is empty
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'Could not load meeting session details. Please try again.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (meetingId && user) {
      initData();
    }
  }, [meetingId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    if (comment.length > 1000) {
      setError('Comment cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await submitFeedback({
        meetingId,
        rating,
        comment,
      });

      if (res.success) {
        setSubmitSuccess(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit feedback. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Skipping does not create fake feedback; user can return later
    navigate('/connections');
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-500">
          Loading feedback session...
        </p>
      </div>
    );
  }

  // Success State Screen (Req 21)
  if (submitSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Thank You!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your feedback has been recorded successfully. It helps maintain quality and trust in the Skill Swap community.
            </p>
          </div>

          {/* Submitted Stars Display */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Your Rating</span>
            <div className="flex items-center justify-center gap-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {RATING_LABELS[rating]}
            </p>
            {comment && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                "{comment}"
              </p>
            )}
          </div>

          {/* Action Navigation */}
          <div className="space-y-3 pt-2">
            <Link to="/home" className="block">
              <Button variant="primary" size="md" fullWidth icon={ArrowRight}>
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/skills" className="block">
              <Button variant="outline" size="md" fullWidth icon={Sparkles}>
                Find Another Skill
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already Submitted Screen (Req 20)
  if (hasSubmitted) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Feedback Already Submitted
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              You have already submitted feedback for this session. Thank you for contributing to the community!
            </p>
          </div>

          {existingFeedback && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Your Submitted Rating</span>
              <div className="flex items-center justify-center gap-1.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= existingFeedback.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {RATING_LABELS[existingFeedback.rating]}
              </p>
              {existingFeedback.comment && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  "{existingFeedback.comment}"
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link to="/connections" className="block">
              <Button variant="primary" size="md" fullWidth icon={Users}>
                Back to Connections
              </Button>
            </Link>
            <Link to="/skills" className="block">
              <Button variant="outline" size="md" fullWidth icon={Sparkles}>
                Find Another Skill
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Title & Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          SESSION FEEDBACK & RATING
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          How Was Your Session?
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Your feedback helps improve the Skill Swap community.
        </p>
      </div>

      {/* Partner Details Card */}
      {partner && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {partner.profileImage ? (
                <img
                  src={partner.profileImage}
                  alt={partner.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
                  {partner.name?.charAt(0) || 'P'}
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Skill Partner
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {partner.name}
              </h2>
              {partnerProfile && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {partnerProfile.experienceLevel} Level
                </p>
              )}
            </div>
          </div>

          {/* Skills Exchanged Preview */}
          {partnerProfile && (
            <div className="flex flex-col sm:items-end gap-1.5 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                Taught: {partnerProfile.skillToTeach}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Learned: {partnerProfile.skillToLearn}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Feedback Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Section (Req 14) */}
          <div className="space-y-3 text-center py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Rate Your Partner (1 to 5 Stars) *
            </label>

            {/* Stars Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''} - ${RATING_LABELS[star]}`}
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Label Under Stars */}
            <div className="h-6">
              {activeRating > 0 ? (
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 animate-in fade-in duration-100">
                  {RATING_LABELS[activeRating]}
                </p>
              ) : (
                <p className="text-xs text-slate-400">Click a star to rate</p>
              )}
            </div>
          </div>

          {/* Comment Textarea (Req 15) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback-comment"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                What did you think about the session? (Optional)
              </label>
              <span
                className={`text-[11px] font-mono ${
                  comment.length > 950 ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {comment.length} / 1000
              </span>
            </div>

            <textarea
              id="feedback-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              placeholder="Share your experience with your skill partner... Did they explain concepts clearly? Were they supportive and on time?"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Action Buttons: Submit & Skip (Req 16, 17) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting || rating === 0}
              icon={ThumbsUp}
              className="sm:flex-1"
            >
              Submit Feedback
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={submitting}
              onClick={handleSkip}
              className="w-full sm:w-auto text-slate-500 hover:text-slate-700"
            >
              Skip for now
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

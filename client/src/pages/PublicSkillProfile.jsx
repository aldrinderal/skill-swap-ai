import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Send,
  Check,
  CheckCircle2,
  UserCheck,
  Star
} from 'lucide-react';
import Button from '../components/Button';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getUserFeedback } from '../services/feedbackApi';

/**
 * PublicSkillProfile Page (Phase 9)
 * Displays a public skill profile for another user with relationship status:
 * - Not connected: "Send Connection Request"
 * - Request sent: "Request Sent" (disabled)
 * - Request received: "Accept Request"
 * - Connected: "Connected"
 */
export default function PublicSkillProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Relationship status: 'not_connected' | 'request_sent' | 'request_received' | 'connected' | 'self'
  const [status, setStatus] = useState('not_connected');
  const [requestId, setRequestId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Reviews State
  const [reviewsData, setReviewsData] = useState({
    totalReviews: 0,
    averageRating: null,
    feedback: [],
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProfileAndStatus = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch public profile
        const profileRes = await API.get(`/skills/${userId}`);
        if (!isMounted) return;

        if (profileRes.data.success) {
          setProfile(profileRes.data.profile);
        }

        // 2. Fetch relationship status
        const resolvedTargetUserId = profileRes.data.profile?.userId || userId;
        try {
          const statusRes = await API.get(`/connections/status/${resolvedTargetUserId}`);
          if (isMounted && statusRes.data.success) {
            setStatus(statusRes.data.status);
            if (statusRes.data.requestId) {
              setRequestId(statusRes.data.requestId);
            }
          }
        } catch {
          // If status fails, fall back to not_connected
        }

        // 3. Fetch user reviews and rating
        try {
          const feedbackRes = await getUserFeedback(resolvedTargetUserId);
          if (isMounted && feedbackRes.success) {
            setReviewsData({
              totalReviews: feedbackRes.totalReviews || 0,
              averageRating: feedbackRes.averageRating,
              feedback: feedbackRes.feedback || [],
            });
          }
        } catch {
          // Non-fatal
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? 'Skill profile not found.'
              : 'Unable to load skill profile. Please try again.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId) {
      fetchProfileAndStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Handle Send Connection Request
  const handleSendRequest = async () => {
    try {
      setActionLoading(true);
      setActionMessage({ text: '', type: '' });
      const targetId = profile?.userId || userId;
      const res = await API.post(`/connections/request/${targetId}`);
      if (res.data.success) {
        setStatus('request_sent');
        setRequestId(res.data.request?.id);
        setActionMessage({
          text: 'Connection request sent successfully!',
          type: 'success',
        });
      }
    } catch (err) {
      setActionMessage({
        text: err.response?.data?.message || 'Unable to send connection request.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Accept Incoming Request
  const handleAcceptRequest = async () => {
    if (!requestId) return;
    try {
      setActionLoading(true);
      setActionMessage({ text: '', type: '' });
      const res = await API.put(`/connections/request/${requestId}/accept`);
      if (res.data.success) {
        setStatus('connected');
        setActionMessage({
          text: 'Connection accepted! You can now find each other in My Connections.',
          type: 'success',
        });
      }
    } catch (err) {
      setActionMessage({
        text: err.response?.data?.message || 'Unable to accept request.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {error || 'Skill profile not found'}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This user may have deleted their skill profile or the link might be invalid.
        </p>
        <div className="pt-2">
          <Link to="/skills">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Back to Find Skills
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = status === 'self' || currentUser?._id === profile.userId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Navigation */}
      <div>
        <Link
          to="/skills"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Find Skills
        </Link>
      </div>

      {/* Action Notification Banner */}
      {actionMessage.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div className="relative">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-20 h-20 rounded-3xl object-cover ring-4 ring-indigo-500/10 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner">
                  {profile.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {profile.name}
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Member
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Skill Swap AI Community Learner
              </p>
              {reviewsData.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(reviewsData.averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {reviewsData.averageRating}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({reviewsData.totalReviews} review{reviewsData.totalReviews === 1 ? '' : 's'})
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic pt-0.5">
                  No ratings yet
                </p>
              )}
            </div>
          </div>

          {/* Dynamic Connection Button based on Relationship Status (Section 18) */}
          <div className="self-stretch sm:self-auto flex items-center gap-3">
            {isSelf ? (
              <span className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                Your Own Profile
              </span>
            ) : status === 'connected' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Connected
                </span>
                <Link to="/connections">
                  <Button variant="outline" size="sm">
                    View in Connections
                  </Button>
                </Link>
              </div>
            ) : status === 'request_sent' ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-not-allowed"
              >
                <Clock className="w-3.5 h-3.5" /> Request Sent
              </button>
            ) : status === 'request_received' ? (
              <Button
                variant="primary"
                size="md"
                icon={Check}
                loading={actionLoading}
                onClick={handleAcceptRequest}
              >
                Accept Request
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={Send}
                loading={actionLoading}
                onClick={handleSendRequest}
              >
                Send Connection Request
              </Button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              About Me / Bio
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills Comparison */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Skill Exchange Topics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Can Teach */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-6 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Can Teach
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {profile.skillToTeach}
              </p>
              <p className="text-xs text-slate-500">
                Experience Level: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.experienceLevel}</span>
              </p>
            </div>

            {/* Wants To Learn */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-6 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Wants To Learn
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {profile.skillToLearn}
              </p>
              <p className="text-xs text-slate-500">
                Preferred Time: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.preferredSession}</span>
              </p>
            </div>
          </div>

          {/* Availability Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Availability
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {profile.availability}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Preferred Session
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {profile.preferredSession}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-400" /> Experience
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {profile.experienceLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback & Reviews (Phase 14) */}
      {reviewsData.totalReviews > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Community Reviews ({reviewsData.totalReviews})
            </h3>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {reviewsData.averageRating} ★ Average
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsData.feedback.map((rev) => (
              <div
                key={rev._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {rev.reviewerId?.name || 'Skill Partner'}
                  </span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    "{rev.comment}"
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

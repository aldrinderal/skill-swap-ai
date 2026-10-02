import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Inbox, 
  Send, 
  Check, 
  X, 
  Clock, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  Sparkles,
  Ban
} from 'lucide-react';
import Button from '../components/Button';
import API from '../services/api';

/**
 * Requests Page (Phase 9)
 * Manages Received and Sent Connection Requests with full lifecycle:
 * - Accept / Reject received requests
 * - Cancel pending sent requests
 */
export default function Requests() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null); // requestId currently being accepted/rejected/cancelled
  const [actionType, setActionType] = useState(null); // 'accept' | 'reject' | 'cancel'
  const [notification, setNotification] = useState({ text: '', type: '' });

  // Cancel Confirmation Modal State
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  // Fetch Requests
  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const [receivedRes, sentRes] = await Promise.all([
        API.get('/connections/requests/received'),
        API.get('/connections/requests/sent'),
      ]);

      if (receivedRes.data.success) {
        setReceivedRequests(receivedRes.data.requests);
      }
      if (sentRes.data.success) {
        setSentRequests(sentRes.data.requests);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load connection requests. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Format relative or readable date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle Accept
  const handleAccept = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      setActionType('accept');
      setNotification({ text: '', type: '' });

      const res = await API.put(`/connections/request/${requestId}/accept`);
      if (res.data.success) {
        // Remove from received pending list
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
        setNotification({
          text: 'Connection accepted! You can now find this partner in My Connections.',
          type: 'success',
        });
      }
    } catch (err) {
      setNotification({
        text: err.response?.data?.message || 'Unable to accept connection request.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  // Handle Reject
  const handleReject = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      setActionType('reject');
      setNotification({ text: '', type: '' });

      const res = await API.put(`/connections/request/${requestId}/reject`);
      if (res.data.success) {
        // Remove from received pending list
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
        setNotification({
          text: 'Connection request rejected.',
          type: 'success',
        });
      }
    } catch (err) {
      setNotification({
        text: err.response?.data?.message || 'Unable to reject connection request.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  // Handle Cancel Sent Request
  const handleCancelRequest = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      setActionType('cancel');
      setNotification({ text: '', type: '' });
      setConfirmCancelId(null);

      const res = await API.put(`/connections/request/${requestId}/cancel`);
      if (res.data.success) {
        // Update status to cancelled in sent list
        setSentRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r))
        );
        setNotification({
          text: 'Connection request cancelled.',
          type: 'success',
        });
      }
    } catch (err) {
      setNotification({
        text: err.response?.data?.message || 'Unable to cancel connection request.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Subtitle */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Connections & Collaboration
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Connection Requests
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage skill swap invitations you have received or sent to other learners.
        </p>
      </div>

      {/* Notification Banner */}
      {notification.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'received'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Received Requests
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold">
            {receivedRequests.length}
          </span>
          {activeTab === 'received' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'sent'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          Sent Requests
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
            {sentRequests.length}
          </span>
          {activeTab === 'sent' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading requests...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-white">Unable to load requests</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAllRequests}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Tab 1: Received Requests (Section 20) */}
          {activeTab === 'received' && (
            <div className="space-y-4">
              {receivedRequests.length > 0 ? (
                receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {request.sender?.profileImage ? (
                        <img
                          src={request.sender.profileImage}
                          alt={request.sender.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                          {request.sender?.name?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            to={`/skills/user/${request.sender?.id}`}
                            className="text-base font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 transition"
                          >
                            {request.sender?.name}
                          </Link>
                          <span className="text-xs text-slate-400">
                            • Sent {formatDate(request.createdAt)}
                          </span>
                        </div>

                        {request.sender?.bio && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                            "{request.sender.bio}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> Can Teach: {request.sender?.skillToTeach}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Wants: {request.sender?.skillToLearn}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-slate-400" /> {request.sender?.experienceLevel}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {request.sender?.availability}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Section 22 & 23) */}
                    <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0 w-full sm:w-auto justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        loading={actionLoadingId === request.id && actionType === 'accept'}
                        disabled={actionLoadingId === request.id}
                        onClick={() => handleAccept(request.id)}
                      >
                        {actionLoadingId === request.id && actionType === 'accept'
                          ? 'Accepting...'
                          : 'Accept'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={X}
                        loading={actionLoadingId === request.id && actionType === 'reject'}
                        disabled={actionLoadingId === request.id}
                        onClick={() => handleReject(request.id)}
                      >
                        {actionLoadingId === request.id && actionType === 'reject'
                          ? 'Rejecting...'
                          : 'Reject'}
                      </Button>
                      <Link to={`/skills/user/${request.sender?.id}`}>
                        <Button variant="ghost" size="sm">
                          Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                  <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-bold text-slate-800 dark:text-white">No received requests</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You do not have any pending connection requests. When someone requests to trade skills with you, they will appear here.
                  </p>
                  <div className="pt-2">
                    <Link to="/skills">
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Find Skill Partners
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Sent Requests (Section 21) */}
          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sentRequests.length > 0 ? (
                sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {request.receiver?.profileImage ? (
                        <img
                          src={request.receiver.profileImage}
                          alt={request.receiver.name}
                          className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                          {request.receiver?.name?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            to={`/skills/user/${request.receiver?.id}`}
                            className="text-base font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 transition"
                          >
                            {request.receiver?.name}
                          </Link>
                          <span className="text-xs text-slate-400">
                            • Sent {formatDate(request.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" /> Teaches: {request.receiver?.skillToTeach}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> Wants: {request.receiver?.skillToLearn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Cancel Action (Section 21 & 24) */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Pending Response
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Ban}
                            onClick={() => setConfirmCancelId(request.id)}
                            disabled={actionLoadingId === request.id}
                          >
                            Cancel Request
                          </Button>
                        </div>
                      ) : request.status === 'accepted' ? (
                        <Link to="/connections">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted • View Partner
                          </span>
                        </Link>
                      ) : request.status === 'rejected' ? (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Declined
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                  <Send className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-bold text-slate-800 dark:text-white">No sent requests</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not sent any connection requests yet. Explore the skills directory to find partners!
                  </p>
                  <div className="pt-2">
                    <Link to="/skills">
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Find Skill Partners
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for Cancel Sent Request (Section 24) */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cancel Connection Request?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to cancel this request? The other user will no longer see your pending invitation.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setConfirmCancelId(null)}
              >
                No, Keep It
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                loading={actionLoadingId === confirmCancelId && actionType === 'cancel'}
                onClick={() => handleCancelRequest(confirmCancelId)}
              >
                Yes, Cancel Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

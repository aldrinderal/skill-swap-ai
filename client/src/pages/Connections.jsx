import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  UserX,
  Video,
  PhoneOff
} from 'lucide-react';
import Button from '../components/Button';
import API from '../services/api';
import meetingApi from '../services/meetingApi';
import { useSocket } from '../context/SocketContext';

/**
 * Connections Page (Phase 9 & 11)
 * Displays established reciprocal skill partnerships for the authenticated user
 * - View public partner profiles
 * - Start instant 30-minute WebRTC video meetings
 * - Remove existing connection
 */
export default function Connections() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Remove connection modal / action states
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [notification, setNotification] = useState({ text: '', type: '' });

  // Phase 11 Calling States
  const [callingPartner, setCallingPartner] = useState(null);
  const [callStatus, setCallStatus] = useState('Calling...');
  const [callingMeetingId, setCallingMeetingId] = useState(null);

  // Fetch connections from backend
  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/connections');
      if (res.data.success) {
        setConnections(res.data.connections);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load connections. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Phase 11 Calling Events Listeners
  useEffect(() => {
    if (!socket) return;

    const onCallAccepted = ({ meetingId }) => {
      setCallingPartner(null);
      navigate(`/meeting/${meetingId}`);
    };

    const onCallRejected = ({ reason }) => {
      setCallStatus(reason || 'Meeting declined');
      setTimeout(() => {
        setCallingPartner(null);
      }, 2500);
    };

    const onCallTimeout = ({ message }) => {
      setCallStatus(message || 'No response');
      setTimeout(() => {
        setCallingPartner(null);
      }, 2500);
    };

    socket.on('call:accepted', onCallAccepted);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:timeout', onCallTimeout);

    return () => {
      socket.off('call:accepted', onCallAccepted);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:timeout', onCallTimeout);
    };
  }, [socket, navigate]);

  // Start Meeting Flow (Phase 11 - Section 86)
  const handleStartCall = async (partner) => {
    try {
      setCallingPartner(partner);
      setCallStatus(`Calling ${partner.name}...`);
      const res = await meetingApi.startMeeting(partner.id);
      if (res.success && res.meeting?.meetingId) {
        setCallingMeetingId(res.meeting.meetingId);
      }
    } catch (err) {
      setCallStatus(err.response?.data?.message || 'Unable to start call');
      setTimeout(() => setCallingPartner(null), 2500);
    }
  };

  const handleCancelCall = () => {
    if (socket && callingMeetingId) {
      socket.emit('call:cancel', { meetingId: callingMeetingId });
    }
    setCallingPartner(null);
    setCallingMeetingId(null);
  };

  // Format readable connected date
  const formatConnectedDate = (dateString) => {
    if (!dateString) return 'Recently connected';
    const date = new Date(dateString);
    return `Connected on ${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  // Handle Remove Connection
  const handleRemoveConnection = async (connectionId) => {
    try {
      setRemovingId(connectionId);
      setNotification({ text: '', type: '' });
      setConfirmRemoveId(null);

      const res = await API.delete(`/connections/${connectionId}`);
      if (res.data.success) {
        setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));
        setNotification({
          text: 'Connection removed successfully.',
          type: 'success',
        });
      }
    } catch (err) {
      setNotification({
        text: err.response?.data?.message || 'Unable to remove connection.',
        type: 'error',
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Active Partnerships
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            My Connections
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your established skill swap partners.
          </p>
        </div>

        <Link to="/skills">
          <Button variant="outline" size="sm" icon={Sparkles}>
            Find More Partners
          </Button>
        </Link>
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

      {/* Loading State */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading connections...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-white">Unable to load connections</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchConnections}>
            Try Again
          </Button>
        </div>
      ) : connections.length > 0 ? (
        /* Partners Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((conn) => {
            const partner = conn.user;
            return (
              <div
                key={conn.connectionId}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {/* Top User Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {partner.profileImage ? (
                          <img
                            src={partner.profileImage}
                            alt={partner.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-inner">
                            {partner.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {partner.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {formatConnectedDate(conn.connectedAt)}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  </div>

                  {partner.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {partner.bio}
                    </p>
                  )}

                  {/* Skills Trading Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" /> Teaches
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {partner.skillToTeach}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Wants to Learn
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {partner.skillToLearn}
                      </p>
                    </div>
                  </div>

                  {/* Details strip */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      {partner.experienceLevel}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {partner.availability}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {partner.preferredSession}
                    </span>
                  </div>
                </div>

                {/* Actions Footer (Phase 9 & Phase 11 Section 3) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
                  <Link to={`/skills/user/${partner.id}`} className="flex-1 min-w-[120px]">
                    <Button variant="outline" size="sm" fullWidth icon={ArrowRight}>
                      View Profile
                    </Button>
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Video}
                    className="flex-1 min-w-[130px] bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/20"
                    onClick={() => handleStartCall(partner)}
                  >
                    Start Meeting
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-300 px-3"
                    disabled={removingId === conn.connectionId}
                    onClick={() => setConfirmRemoveId(conn.connectionId)}
                    title="Remove Connection"
                  >
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No skill partners yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't established any connections yet. Search for learners with compatible skills and send a connection request!
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

      {/* Confirmation Modal for Remove Connection (Section 28) */}
      {confirmRemoveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Remove Connection?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to remove this skill partner? You will both be disconnected, and you can re-request connection in the future.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setConfirmRemoveId(null)}
              >
                Keep Connection
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                loading={removingId === confirmRemoveId}
                onClick={() => handleRemoveConnection(confirmRemoveId)}
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calling Modal (Phase 11 - Section 54) */}
      {callingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl shadow-indigo-950/50 text-center space-y-6">
            <div className="relative mx-auto w-24 h-24">
              {callingPartner.profileImage ? (
                <img
                  src={callingPartner.profileImage}
                  alt={callingPartner.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-3xl shadow-xl ring-4 ring-indigo-500/30">
                  {callingPartner.name?.charAt(0) || 'U'}
                </div>
              )}
              {callStatus.includes('Calling') && (
                <span className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-30"></span>
              )}
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">
                {callingPartner.name}
              </h2>
              <p className="text-xs font-semibold text-indigo-400">
                {callStatus}
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="danger"
                size="md"
                fullWidth
                icon={PhoneOff}
                onClick={handleCancelCall}
              >
                Cancel Call
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

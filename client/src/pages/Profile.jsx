import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Edit3, 
  Sparkles, 
  Trash2, 
  Calendar, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlusCircle
} from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load user skill profile
  const fetchSkillProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get('/skills/me');
      if (res.data.success) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null); // Normal when user has not registered skills yet
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Failed to load skill profile.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillProfile();
  }, []);

  // Handle Delete Skill Profile (Section 20)
  const handleDeleteProfile = async () => {
    setDeleting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await API.delete('/skills/me');
      if (res.data.success) {
        setProfile(null);
        setShowDeleteModal(false);
        setFeedback({
          type: 'success',
          message: 'Skill profile deleted successfully.',
        });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to delete skill profile. Please try again.',
      });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading skill profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Account Overview
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          View and manage your personal credentials and registered skill exchange preferences.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Profile Card (Section 24) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* User Identity Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div className="relative">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || 'User'}
                  className="w-20 h-20 rounded-3xl object-cover ring-4 ring-indigo-500/10 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {user?.name || 'User'}
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {user?.role === 'admin' ? 'Administrator' : 'Student Member'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            About Me / Bio
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {profile?.bio || user?.bio || 'No bio provided yet. Register your skills below to introduce yourself to prospective exchange partners!'}
          </p>
        </div>

        {/* My Skills Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Skills
            </h3>
            {profile && (
              <div className="flex items-center gap-2">
                <Link to="/skills/register">
                  <Button variant="ghost" size="sm" icon={Edit3}>
                    Edit Skills
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Skill Profile
                </Button>
              </div>
            )}
          </div>

          {profile ? (
            /* Active Profile State (Section 24) */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* I Can Teach */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> I Can Teach
                  </span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {profile.skillToTeach}
                  </p>
                  <p className="text-xs text-slate-500">
                    Experience Level: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.experienceLevel}</span>
                  </p>
                </div>

                {/* I Want To Learn */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> I Want To Learn
                  </span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {profile.skillToLearn}
                  </p>
                  <p className="text-xs text-slate-500">
                    Preferred Session: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.preferredSession}</span>
                  </p>
                </div>
              </div>

              {/* Preferences Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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
          ) : (
            /* No Profile State (Section 25) */
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  You haven't registered your skills yet.
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Tell the community what you can teach and what you want to learn so other students can connect with you.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/skills/register">
                  <Button variant="primary" size="md" icon={PlusCircle}>
                    Register My Skills
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Deletion (Section 20) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Skill Profile?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to remove your skill profile? Your registered skills, teaching topics, and availability will be deleted from the directory. Your user account will remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={deleting}
                onClick={handleDeleteProfile}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    Deleting...
                  </span>
                ) : (
                  'Yes, Delete Profile'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

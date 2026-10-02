import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Button from '../components/Button';
import SearchableSkillSelect from '../components/SearchableSkillSelect';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  AVAILABLE_SKILLS,
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
  PREFERRED_SESSIONS,
} from '../constants/skillsData';

export default function RegisterSkill() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [skillToTeach, setSkillToTeach] = useState('');
  const [skillToLearn, setSkillToLearn] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [availability, setAvailability] = useState('Weekends');
  const [preferredSession, setPreferredSession] = useState('Evening');
  const [bio, setBio] = useState('');

  // UI Flow State
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check whether user already has a skill profile
  useEffect(() => {
    let isMounted = true;

    const fetchExistingProfile = async () => {
      try {
        const response = await API.get('/skills/me');
        if (response.data.success && response.data.profile) {
          const { profile } = response.data;
          if (isMounted) {
            setSkillToTeach(profile.skillToTeach || '');
            setSkillToLearn(profile.skillToLearn || '');
            setExperienceLevel(profile.experienceLevel || 'Intermediate');
            setAvailability(profile.availability || 'Weekends');
            setPreferredSession(profile.preferredSession || 'Evening');
            setBio(profile.bio || '');
            setIsEditing(true);
          }
        }
      } catch (error) {
        // 404 means no profile registered yet (normal for first-time users)
        if (error.response?.status !== 404) {
          console.warn('Could not fetch existing skill profile:', error.message);
        }
        if (isMounted) setIsEditing(false);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchExistingProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Frontend validation (Section 14)
    if (!skillToTeach.trim()) {
      setErrorMessage('Please select a skill you can teach.');
      return;
    }

    if (!skillToLearn.trim()) {
      setErrorMessage('Please select a skill you want to learn.');
      return;
    }

    // 2. Prevent same skill (Section 8)
    if (skillToTeach.trim().toLowerCase() === skillToLearn.trim().toLowerCase()) {
      setErrorMessage('Please choose different skills for learning and teaching.');
      return;
    }

    if (!experienceLevel) {
      setErrorMessage('Please select your experience level.');
      return;
    }

    if (!availability) {
      setErrorMessage('Please select your availability.');
      return;
    }

    if (!preferredSession) {
      setErrorMessage('Please select your preferred session.');
      return;
    }

    if (bio.length > 500) {
      setErrorMessage('Bio cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        skillToTeach: skillToTeach.trim(),
        skillToLearn: skillToLearn.trim(),
        experienceLevel,
        availability,
        preferredSession,
        bio: bio.trim(),
      };

      let response;
      if (isEditing) {
        // PUT /api/skills/me
        response = await API.put('/skills/me', payload);
      } else {
        // POST /api/skills
        response = await API.post('/skills', payload);
      }

      if (response.data.success) {
        setSuccessMessage(
          isEditing
            ? 'Skill profile updated successfully.'
            : 'Skill profile registered successfully.'
        );
        setTimeout(() => {
          navigate('/profile');
        }, 1200);
      } else {
        setErrorMessage(response.data.message || 'Unable to save your skills.');
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Unable to save your skills. Please check your network and try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading skill profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back to Profile Link if editing */}
      {isEditing && (
        <div className="mb-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Profile
          </Link>
        </div>
      )}

      {/* Header (Section 6) */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          {isEditing ? 'Update Skill Profile' : 'Knowledge Exchange Registration'}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Your Skills' : 'Register Your Skills'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Tell the community what you can teach and what you want to learn.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage} Redirecting to your profile...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-Only Authenticated User Information (Section 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user?.name || ''}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none select-none"
                  title="Your name is loaded directly from your authenticated account"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none select-none"
                  title="Your email is loaded directly from your authenticated account"
                />
              </div>
            </div>
          </div>

          {/* Skill Selection Section (Sections 7 & 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Skill I Can Teach */}
            <div>
              <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                Skill I Can Teach <span className="text-rose-500">*</span>
              </label>
              <SearchableSkillSelect
                value={skillToTeach}
                onChange={setSkillToTeach}
                options={AVAILABLE_SKILLS}
                placeholder="What can you teach?"
                disabledSkill={skillToLearn}
                icon={GraduationCap}
                colorScheme="emerald"
              />
            </div>

            {/* Skill I Want To Learn */}
            <div>
              <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                Skill I Want To Learn <span className="text-rose-500">*</span>
              </label>
              <SearchableSkillSelect
                value={skillToLearn}
                onChange={setSkillToLearn}
                options={AVAILABLE_SKILLS}
                placeholder="What do you want to learn?"
                disabledSkill={skillToTeach}
                icon={BookOpen}
                colorScheme="indigo"
              />
            </div>
          </div>

          {/* Experience, Availability & Preferred Session Grid (Sections 9, 10, 11) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Experience Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Experience Level <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Availability <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preferred Session */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Preferred Session <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <select
                  value={preferredSession}
                  onChange={(e) => setPreferredSession(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {PREFERRED_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Short Bio with Character Counter (Section 12) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Short Bio
              </label>
              <span className={`text-[11px] font-mono ${bio.length > 500 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {bio.length} / 500
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other learners about yourself, your interests and your experience."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none resize-none"
            />
          </div>

          {/* Submit Action (Section 13) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={() => navigate('/profile')}
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              icon={isSubmitting ? undefined : Sparkles}
              className="w-full sm:w-auto min-w-[160px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  {isEditing ? 'Updating...' : 'Saving...'}
                </span>
              ) : isEditing ? (
                'Update Skills'
              ) : (
                'Save My Skills'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

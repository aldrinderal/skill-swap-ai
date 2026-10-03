import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Loader2, 
  AlertCircle,
  GraduationCap,
  Users,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import UserCard from '../components/UserCard';
import MatchCard from '../components/MatchCard';
import Button from '../components/Button';
import API from '../services/api';
import {
  AVAILABLE_SKILLS,
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
  PREFERRED_SESSIONS,
} from '../constants/skillsData';

export default function Skills() {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All Skills');
  const [experienceFilter, setExperienceFilter] = useState('All Levels');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [sessionFilter, setSessionFilter] = useState('All');

  // Data State
  const [partners, setPartners] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myProfile, setMyProfile] = useState(null);

  // Loading & Error States
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Debounce Search Input (Phase 8 Section 33)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Check current user's profile on mount (Section 25)
  useEffect(() => {
    let isMounted = true;

    const checkUserProfile = async () => {
      try {
        const res = await API.get('/skills/me');
        if (res.data.success && isMounted) {
          setMyProfile(res.data.profile);
        }
      } catch (err) {
        if (isMounted) setMyProfile(null);
      } finally {
        if (isMounted) setProfileChecked(true);
      }
    };

    checkUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch Recommended Matches (Sections 17-20)
  useEffect(() => {
    let isMounted = true;

    const fetchMatches = async () => {
      if (!myProfile) {
        setLoadingMatches(false);
        return;
      }

      try {
        setLoadingMatches(true);
        const res = await API.get('/skills/matches');
        if (res.data.success && isMounted) {
          setMatches(res.data.matches || []);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Could not fetch matches:', err.message);
          setMatches([]);
        }
      } finally {
        if (isMounted) setLoadingMatches(false);
      }
    };

    if (profileChecked && myProfile) {
      fetchMatches();
    } else if (profileChecked && !myProfile) {
      setLoadingMatches(false);
    }

    return () => {
      isMounted = false;
    };
  }, [profileChecked, myProfile]);

  // 4. Fetch Directory Partners with Search & Multiple Filters (Sections 9-11)
  const fetchPartners = useCallback(async () => {
    try {
      setLoadingPartners(true);
      setErrorMessage('');

      const params = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedSkill !== 'All Skills' && selectedSkill !== 'All') params.skill = selectedSkill;
      if (experienceFilter !== 'All Levels' && experienceFilter !== 'All') params.experienceLevel = experienceFilter;
      if (availabilityFilter !== 'All') params.availability = availabilityFilter;
      if (sessionFilter !== 'All') params.preferredSession = sessionFilter;

      const res = await API.get('/skills', { params });
      if (res.data.success) {
        setPartners(res.data.profiles || []);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to load skill partners. Please try again.'
      );
      setPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  }, [debouncedSearch, selectedSkill, experienceFilter, availabilityFilter, sessionFilter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // 5. Clear Filters Action (Section 8)
  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedSkill('All Skills');
    setExperienceFilter('All Levels');
    setAvailabilityFilter('All');
    setSessionFilter('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header (Section 2) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Skill Exchange Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Find Your Skill Partner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Find people who can teach what you want to learn and learn what you can teach.
          </p>
        </div>
      </div>

      {/* No Profile State Notice (Section 25) */}
      {profileChecked && !myProfile && (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Complete Your Skill Profile
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Register what you can teach and what you want to learn before finding skill partners.
              </p>
            </div>
          </div>
          <Link to="/skills/register" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" icon={Sparkles} fullWidth className="sm:w-auto">
              Register My Skills
            </Button>
          </Link>
        </div>
      )}

      {/* Recommended Skill Partners (Sections 17-20) */}
      {profileChecked && myProfile && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Recommended Skill Partners
              </h2>
            </div>
            {matches.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Found
              </span>
            )}
          </div>

          {loadingMatches ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading matches...</span>
            </div>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <MatchCard key={match.userId} match={match} />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              No direct reciprocal partners found yet. Browse all available skill partners below!
            </div>
          )}
        </section>
      )}

      {/* Search & Filter Controls (Sections 3-8) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Bar (Section 3) */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a skill..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none transition"
          />
        </div>

        {/* Filter Dropdowns Grid (Sections 4-7) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Skill Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All Skills">All Skills</option>
              {AVAILABLE_SKILLS.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Experience Level
            </label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All Levels">All Levels</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Availability
            </label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Availability</option>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Session Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Preferred Session
            </label>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Sessions</option>
              {PREFERRED_SESSIONS.map((sess) => (
                <option key={sess} value={sess}>
                  {sess}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Action & Count Bar (Sections 8 & 27) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {loadingPartners ? 'Searching...' : `${partners.length} skill ${partners.length === 1 ? 'partner' : 'partners'} found`}
          </span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
          </button>
        </div>
      </section>

      {/* Directory Search Results Section (Sections 21, 26, 27) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Skill Partners
            </h2>
          </div>
        </div>

        {/* Loading Indicator */}
        {loadingPartners ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">Finding skill partners...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <UserCard
                key={partner.id}
                userId={partner.userId}
                name={partner.name}
                profileImage={partner.profileImage}
                bio={partner.bio}
                skillToTeach={partner.skillToTeach}
                skillToLearn={partner.skillToLearn}
                experienceLevel={partner.experienceLevel}
                availability={partner.availability}
                preferredSession={partner.preferredSession}
                averageRating={partner.averageRating}
                totalReviews={partner.totalReviews}
              />
            ))}
          </div>
        ) : (
          /* No Results State (Section 26) */
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Skill Partners Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try changing your search or filters.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters} icon={RotateCcw}>
              Clear Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

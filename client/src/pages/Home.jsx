import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { 
  Sparkles, 
  ArrowRight, 
  Layout, 
  Layers, 
  Code2, 
  Globe, 
  Coffee, 
  Terminal, 
  Brain, 
  Cpu, 
  Palette, 
  Megaphone,
  UserCheck,
  Search,
  UserPlus,
  Video,
  Clock,
  MessageSquare,
  Users2,
  Zap,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Users
} from 'lucide-react';
import Button from '../components/Button';
import SkillCard from '../components/SkillCard';
import AIRecommendations from '../components/AIRecommendations';

export default function Home() {
  // Temporary Phase 3 backend connection verification
  const [apiHealth, setApiHealth] = useState(null);

  // Authenticated user skill profile state (Phase 7 Section 28)
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Authenticated user connections count state (Phase 9 Section 38)
  const [connectionsCount, setConnectionsCount] = useState(null);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  useEffect(() => {
    API.get('/health')
      .then((res) => {
        setApiHealth({ success: true, message: res.data.message });
      })
      .catch((err) => {
        setApiHealth({
          success: false,
          message: err.response?.data?.message || 'Could not connect to backend',
        });
      });

    // Check user's skill profile
    API.get('/skills/me')
      .then((res) => {
        if (res.data.success) {
          setUserProfile(res.data.profile);
        }
      })
      .catch(() => {
        setUserProfile(null);
      })
      .finally(() => {
        setProfileLoading(false);
      });

    // Check user's connections (Phase 9 Section 38)
    API.get('/connections')
      .then((res) => {
        if (res.data.success) {
          setConnectionsCount(res.data.connections?.length || 0);
        }
      })
      .catch(() => {
        setConnectionsCount(null);
      })
      .finally(() => {
        setConnectionsLoading(false);
      });
  }, []);
  // Popular skill catalog data array
  const popularSkills = [
    {
      title: 'UI/UX Design',
      description: 'Figma, user wireframing, interactive prototyping, and modern design systems.',
      icon: Layout,
      usersCount: '64 Learners',
      badge: 'High Demand',
    },
    {
      title: 'MERN Stack',
      description: 'Master MongoDB, Express.js, React, and Node.js full-stack development.',
      icon: Layers,
      usersCount: '92 Learners',
      badge: 'Popular',
    },
    {
      title: 'Full Stack Development',
      description: 'Frontend architectures, backend APIs, microservices, and database tuning.',
      icon: Code2,
      usersCount: '78 Learners',
      badge: 'Trending',
    },
    {
      title: 'Web Development',
      description: 'Core HTML5 semantic structures, CSS3 Flexbox/Grid, and modern JavaScript.',
      icon: Globe,
      usersCount: '85 Learners',
      badge: 'Foundation',
    },
    {
      title: 'Java',
      description: 'Object-oriented programming, data structures, algorithms, and Spring Boot.',
      icon: Coffee,
      usersCount: '53 Learners',
      badge: 'Core CS',
    },
    {
      title: 'Python',
      description: 'Pythonic coding, data analysis, automation scripts, and backend development.',
      icon: Terminal,
      usersCount: '110 Learners',
      badge: 'Top Pick',
    },
    {
      title: 'Artificial Intelligence',
      description: 'LLM prompt engineering, AI agents, neural concepts, and model fine-tuning.',
      icon: Brain,
      usersCount: '89 Learners',
      badge: 'Cutting Edge',
    },
    {
      title: 'Machine Learning',
      description: 'Scikit-learn, supervised learning, model evaluation, and predictive pipelines.',
      icon: Cpu,
      usersCount: '47 Learners',
      badge: 'Advanced',
    },
    {
      title: 'Graphic Design',
      description: 'Vector illustration, brand identity, color theory, and digital graphics.',
      icon: Palette,
      usersCount: '38 Learners',
      badge: 'Creative',
    },
    {
      title: 'Digital Marketing',
      description: 'SEO strategy, social media campaigns, analytics, and content marketing.',
      icon: Megaphone,
      usersCount: '31 Learners',
      badge: 'Growth',
    },
  ];

  // How it works 4-step workflow
  const steps = [
    {
      step: '01',
      title: 'Create Your Profile',
      description: 'Tell the community what you can teach and what you want to learn in return.',
      icon: UserCheck,
    },
    {
      step: '02',
      title: 'Find Your Match',
      description: 'Discover people with complementary skills using our reciprocal smart matcher.',
      icon: Search,
    },
    {
      step: '03',
      title: 'Connect',
      description: 'Send a request and connect directly with your verified skill partner.',
      icon: UserPlus,
    },
    {
      step: '04',
      title: 'Learn Together',
      description: 'Start a 30-minute peer video session with built-in voice and real-time chat.',
      icon: Video,
    },
  ];

  // Features list
  const features = [
    {
      title: 'Skill Exchange',
      description: 'Exchange real knowledge hands-on instead of passively consuming video courses.',
      icon: Zap,
    },
    {
      title: 'Smart Matching',
      description: 'Instantly find people based on exact complementary skills (You teach what they need).',
      icon: Brain,
    },
    {
      title: 'Live Sessions',
      description: 'Connect face-to-face through browser-native peer-to-peer real-time video and audio.',
      icon: Video,
    },
    {
      title: 'Real-Time Chat',
      description: 'Collaborate and exchange code snippets or links inside the active meeting room.',
      icon: MessageSquare,
    },
    {
      title: '30-Minute Sessions',
      description: 'Focused learning sessions governed by a 30-minute automatic timer to respect your time.',
      icon: Clock,
    },
    {
      title: 'Community Learning',
      description: 'Learn collaboratively from other students and share your own expertise freely.',
      icon: Users2,
    },
  ];

  return (
    <div className="space-y-24 py-6 sm:py-10">
      {/* Temporary Phase 3 Backend Health Status Banner */}
      {apiHealth && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-16">
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
              apiHealth.success
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  apiHealth.success ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>
                Backend Status: <strong>{apiHealth.message}</strong> (Phase 3 Connected)
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">GET /api/health</span>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              PEER-TO-PEER KNOWLEDGE EXCHANGE
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Learn a Skill. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600">
                Teach a Skill.
              </span> <br />
              Grow Together.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Connect with people who can teach what you want to learn, while sharing the skills you already know. 
              Structured 30-minute interactive video sessions with real-time chat.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/skills" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" icon={Search} fullWidth className="sm:w-auto">
                  Find a Skill Partner
                </Button>
              </Link>
              <Link to="/skills/register" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" icon={Sparkles} fullWidth className="sm:w-auto">
                  Register Your Skills
                </Button>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Peer Exchange
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 30-Min Focused Sessions
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> WebRTC Video & Audio
              </span>
            </div>
          </div>

          {/* Right Hero Graphic: Interactive CSS Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 backdrop-blur-sm shadow-xl">
              {/* Floating Match Card Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Live Reciprocal Match Found
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                    98% Match
                  </span>
                </div>

                {/* Simulated Partner A */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                    R
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Rahul (MERN Dev)</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Teaches: Full Stack MERN</p>
                    <p className="text-[11px] text-indigo-500 font-medium">Wants: UI/UX Design</p>
                  </div>
                </div>

                {/* Match Divider */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    Instant Swap
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>

                {/* Simulated Partner B (You) */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center font-bold">
                    Y
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">You (Designer)</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Teaches: UI/UX Design</p>
                    <p className="text-[11px] text-indigo-500 font-medium">Wants: Full Stack MERN</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/skills">
                    <Button variant="primary" size="sm" fullWidth icon={ArrowRight}>
                      Start Skill Exchange
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Skill Profile Card (Phase 7 Section 28) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your Skill Profile
                </h3>
              </div>

              {profileLoading ? (
                <p className="text-xs text-slate-400">Loading skill profile...</p>
              ) : userProfile ? (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                    I Teach: <strong>{userProfile.skillToTeach}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    I Learn: <strong>{userProfile.skillToLearn}</strong>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Register your skills to find people to learn and teach with.
                </p>
              )}
            </div>

            <div className="self-stretch sm:self-auto flex items-center">
              {profileLoading ? null : userProfile ? (
                <Link to="/profile" className="w-full sm:w-auto">
                  <Button variant="primary" size="md" icon={ArrowRight} fullWidth className="sm:w-auto">
                    View My Skills
                  </Button>
                </Link>
              ) : (
                <Link to="/skills/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="md" icon={Sparkles} fullWidth className="sm:w-auto">
                    Register Skills
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AI Skill Matches For You (Phase 13 Section 38) */}
      <AIRecommendations />

      {/* Find Your Skill Partner Section (Phase 8 Section 36) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-3xl p-6 sm:p-8 border border-indigo-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Find Your Skill Partner
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Discover people who can teach what you want to learn and exchange skills with you.
            </p>
          </div>
          <Link to="/skills" className="w-full sm:w-auto shrink-0">
            <Button variant="primary" size="md" icon={Search} fullWidth className="sm:w-auto">
              Find Skill Partners
            </Button>
          </Link>
        </div>
      </section>

      {/* Your Skill Connections Section (Phase 9 Section 38) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Your Skill Connections
              </h2>
            </div>

            {connectionsLoading ? (
              <p className="text-xs text-slate-400">Loading your connections...</p>
            ) : connectionsCount !== null && connectionsCount > 0 ? (
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                You are connected with{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {connectionsCount}
                </strong>{' '}
                skill partner{connectionsCount > 1 ? 's' : ''}.
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You haven't connected with anyone yet. Find learners with compatible skills and start trading knowledge.
              </p>
            )}
          </div>

          <div className="self-stretch sm:self-auto flex items-center">
            {connectionsLoading ? null : connectionsCount !== null && connectionsCount > 0 ? (
              <Link to="/connections" className="w-full sm:w-auto">
                <Button variant="primary" size="md" icon={ArrowRight} fullWidth className="sm:w-auto">
                  View Connections
                </Button>
              </Link>
            ) : (
              <Link to="/skills" className="w-full sm:w-auto">
                <Button variant="outline" size="md" icon={Search} fullWidth className="sm:w-auto">
                  Find Skill Partners
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Skill Reference Section: Explore Popular Skills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Skill Directory
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Explore Popular Skills
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Browse high-demand tech & creative categories or discover learners ready to trade knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {popularSkills.map((skill, index) => (
            <SkillCard
              key={index}
              title={skill.title}
              description={skill.description}
              icon={skill.icon}
              usersCount={skill.usersCount}
              badge={skill.badge}
              to="/skills"
            />
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-100/60 dark:bg-slate-900/40 rounded-3xl py-14 border border-slate-200/60 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            How Skill Swap AI Works
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Four easy steps to exchange knowledge directly with students around the globe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 dark:text-slate-700">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section: Why Skill Swap AI? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Platform Benefits
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Why Skill Swap AI?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Purpose-built for authentic interactive student learning and genuine collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl shadow-indigo-600/10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to swap skills and learn together?
          </h2>
          <p className="text-indigo-100 max-w-xl mx-auto text-sm sm:text-base">
            Join other students exchanging knowledge. Register your skills now and find your perfect peer match.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/skills/register">
              <Button variant="secondary" size="lg" icon={Sparkles}>
                Register Your Skills
              </Button>
            </Link>
            <Link to="/skills">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Explore Skills Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

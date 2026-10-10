import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  Sparkles, 
  Menu, 
  X, 
  User, 
  LogOut, 
  LogIn, 
  Compass, 
  Home as HomeIcon, 
  Inbox, 
  Users, 
  ShieldAlert,
  Brain,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import SocketStatus from './SocketStatus';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      API.get('/connections/requests/received')
        .then((res) => {
          if (res.data.success) {
            setPendingCount(res.data.count || 0);
          }
        })
        .catch(() => {
          setPendingCount(0);
        });
    } else {
      setPendingCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/home', icon: HomeIcon },
    { name: 'Find Skills', path: '/skills', icon: Compass },
    { name: 'AI Matches', path: '/recommendations', icon: Brain },
    { name: 'My Skills', path: '/skills/register', icon: GraduationCap },
    { name: 'Requests', path: '/requests', icon: Inbox },
    { name: 'Connections', path: '/connections', icon: Users },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/home" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center
  text-white font-bold text-xs tracking-tight
  border border-slate-700
  shadow-sm
  group-hover:scale-105 transition-transform duration-200">
  AD
</div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Skill Swap<span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
            <p className="hidden sm:block text-[10px] text-slate-500 font-medium">
              Learn a Skill. Teach a Skill.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 opacity-75" />
                <span>{link.name}</span>
                {link.name === 'Requests' && pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Right Side / Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/admin"
            className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-1"
            title="Admin Dashboard"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden lg:inline">Admin</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <SocketStatus />
              <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-medium hover:text-indigo-600">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                icon={LogOut}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" icon={LogIn}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center md:hidden gap-2">
          {isAuthenticated && <SocketStatus />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </div>
                {link.name === 'Requests' && pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          <NavLink
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Admin Dashboard
          </NavLink>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={handleLogout}
                  icon={LogOut}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

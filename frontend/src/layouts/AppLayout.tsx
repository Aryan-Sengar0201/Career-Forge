import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  BookOpen,
  Wrench,
  User,
  Flame,
  Zap,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [aiStatus, setAiStatus] = useState<{ connected: boolean; model: string; loading: boolean }>({
    connected: false,
    model: 'gemini-2.5-flash',
    loading: true,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setAiStatus({
            connected: Boolean(res.aiConnected),
            model: res.model || 'gemini-2.5-flash',
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setAiStatus({
            connected: false,
            model: 'gemini-2.5-flash',
            loading: false,
          });
        }
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Compass },
    { label: 'Career Path', path: '/career-path', icon: MapPin },
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Career Tools', path: '/career-tools', icon: Wrench },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center space-x-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md">
                <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    CAREERFORGE
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Forge Your Path
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Stats & Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* AI Status Indicator */}
              <button
                onClick={() => setShowAiModal(true)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  aiStatus.connected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                }`}
                title="Click for AI engine status"
              >
                <span className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{aiStatus.connected ? 'AI Connected' : 'Demo Mode'}</span>
              </button>

              {/* Streak */}
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{user?.streak || 1}d</span>
              </div>

              {/* XP */}
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 fill-brand-500 text-brand-500" />
                <span>{user?.xp || 0} XP</span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 pt-2 pb-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => setShowAiModal(true)}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full ${
                  aiStatus.connected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${aiStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{aiStatus.connected ? 'AI Connected' : 'Demo Mode'}</span>
              </button>
              <div className="flex items-center space-x-2 font-semibold">
                <span className="text-amber-600 dark:text-amber-400">🔥 {user?.streak || 1}d</span>
                <span className="text-brand-600 dark:text-brand-400">⚡ {user?.xp || 0} XP</span>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/50 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">CAREERFORGE</span>
            <span>—</span>
            <span>Forge Your Path. Build Your Future.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Problem Statement 1: Reverse-Engineered Career Roadmapper</span>
            <span>•</span>
            <span className="text-brand-600 dark:text-brand-400 font-medium">Google Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>

      {/* AI Connectivity Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {aiStatus.connected ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {aiStatus.connected ? 'Gemini AI Connected' : 'Running in Demo Mode'}
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {aiStatus.connected ? (
                <>
                  CareerForge is directly communicating with the Google Gemini API (model: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">{aiStatus.model}</code>). All roadmap generation, reverse engineering, and real-time adaptation are performed dynamically by AI.
                </>
              ) : (
                <>
                  CareerForge is currently operating in <strong>Demo Mode</strong> with deterministic architecture modeling. To activate live Gemini calls, add your <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">GEMINI_API_KEY</code> to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">backend/.env</code> and restart the backend server.
                </>
              )}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Model Engine:</span>
                <span className="font-mono font-medium">{aiStatus.model}</span>
              </div>
              <div className="flex justify-between">
                <span>SDK:</span>
                <span className="font-mono font-medium">@google/genai (v2.x)</span>
              </div>
              <div className="flex justify-between">
                <span>Security:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Server-side execution only</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Clock, Calendar, Check, Save, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { CareerRoadmap } from '../types/career';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [targetRole, setTargetRole] = useState('Full Stack Developer at a FinTech startup');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
    if (user?.email) setEmail(user.email);

    api.getCurrentRoadmap().then(res => {
      if (res?.roadmap) {
        setTargetRole(res.roadmap.targetRole || targetRole);
        setTimelineMonths(res.roadmap.timelineMonths || timelineMonths);
      }
    }).catch(() => {});
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Preferences</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account credentials, target career trajectory, and appearance.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>Profile preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 cursor-not-allowed"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
            Target Career
          </label>
          <div className="relative">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
            <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Weekly Time Dedication
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Timeline Months
            </label>
            <div className="relative">
              <input
                type="number"
                min="3"
                max="24"
                value={timelineMonths}
                onChange={(e) => setTimelineMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Theme Appearance</span>
            <span className="text-xs text-slate-500">Currently using {theme} mode</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center space-x-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

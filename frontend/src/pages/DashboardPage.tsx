import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  CheckCircle2,
  PlayCircle,
  Flag,
  MapPin,
  TrendingUp,
  Award,
  Layers,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CareerRoadmap, RoadmapNodeData, Mission } from '../types/career';
import { MissionModal } from '../components/roadmap/MissionModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active mission modal state
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [activeNode, setActiveNode] = useState<RoadmapNodeData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [progressRes, rmRes] = await Promise.all([
          api.getProgress().catch(() => null),
          api.getCurrentRoadmap().catch(() => null),
        ]);

        if (rmRes?.success && rmRes.roadmap) {
          setRoadmap(rmRes.roadmap);
        } else if (progressRes?.activeRoadmap) {
          setRoadmap(progressRes.activeRoadmap);
        }

        if (progressRes?.readiness) {
          setReadiness(progressRes.readiness);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Determine Next Available Quest & Node
  const availableNode = roadmap?.nodes.find(n => n.status === 'in_progress' || n.status === 'available');
  const todaysQuest: Mission | undefined = availableNode?.missions?.[0] || {
    id: 'quest-today',
    title: 'Master React State Management',
    description: 'Learn optimistic UI updates and resilient revalidation patterns.',
    xp: 50,
    estimatedMinutes: 20,
    type: 'practice',
  };

  const completedSkills = roadmap?.nodes.filter(n => n.status === 'completed').length || 0;
  const totalSkills = roadmap?.nodes.length || 10;
  const progressPercent = Math.min(100, Math.round((completedSkills / totalSkills) * 100));

  const readinessScore = readiness?.overallScore || Math.min(85, 20 + progressPercent * 0.6);

  const handleStartTodayQuest = () => {
    if (availableNode && todaysQuest) {
      setActiveMission(todaysQuest);
      setActiveNode(availableNode);
    } else {
      navigate('/career-path');
    }
  };

  const handleMissionComplete = () => {
    api.getProgress().then(res => {
      if (res?.readiness) setReadiness(res.readiness);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Good morning, {user?.fullName || 'Explorer'}
          </h1>
          <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Target:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {roadmap?.targetRole || 'Full Stack Developer at FinTech startup'}
            </span>
          </div>
        </div>

        {/* Level & Streak Stats */}
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-center space-x-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{user?.streak || 1} Day Streak</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/50 flex items-center space-x-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
            <Zap className="w-4 h-4 fill-brand-500 text-brand-500" />
            <span>Level {user?.level || 1} • {user?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      {/* CORE UX CARD: TODAY'S QUEST (Make the next step obvious) */}
      <div className="p-6 sm:p-8 rounded-2xl border-2 border-brand-500 bg-white dark:bg-slate-900 shadow-md shadow-brand-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Today's Primary Quest
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{todaysQuest.estimatedMinutes} min • +{todaysQuest.xp} XP</span>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
          {todaysQuest.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
          {todaysQuest.description}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartTodayQuest}
            className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-sm flex items-center justify-center space-x-2 text-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Continue Today's Quest</span>
          </button>
          <Link
            to="/career-path"
            className="w-full sm:w-auto px-5 py-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
          >
            <span>View Full Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Two Column Section: Career Readiness & Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Career Readiness Score */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Career Readiness
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">CareerForge Estimate</span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
              {Math.round(readinessScore)}%
            </span>
            <span className="text-xs text-slate-500">
              {readinessScore > 70 ? 'On Track for Production Roles' : 'Developing Core Competencies'}
            </span>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Skills Mastery</span>
              <span className="font-semibold text-slate-900 dark:text-white">{readiness?.skillsScore || 65}%</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Projects Portfolio</span>
              <span className="font-semibold text-slate-900 dark:text-white">{readiness?.projectsScore || 50}%</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Interview Preparedness</span>
              <span className="font-semibold text-slate-900 dark:text-white">{readiness?.interviewScore || 40}%</span>
            </div>
          </div>

          <Link
            to="/career-tools"
            className="block pt-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Optimize Readiness in Career Tools →
          </Link>
        </div>

        {/* Roadmap Progress & Next Milestone */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Roadmap Milestones
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {completedSkills}/{totalSkills} Complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Upcoming Portfolio Milestone:
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {roadmap?.milestones?.[1] || "Build your first production-grade full-stack project"}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Includes double-entry ledger design and end-to-end integration tests.
            </p>
          </div>

          <Link
            to="/career-path"
            className="block text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Explore Interactive Visual Graph →
          </Link>
        </div>
      </div>

      {/* Active Mission Runner Modal */}
      {activeMission && (
        <MissionModal
          mission={activeMission}
          node={activeNode}
          onClose={() => setActiveMission(null)}
          onCompleted={handleMissionComplete}
        />
      )}
    </div>
  );
};

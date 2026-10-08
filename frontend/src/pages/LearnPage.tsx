import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Briefcase,
  ExternalLink,
  Zap,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { CareerRoadmap, RoadmapNodeData, Mission, ProjectDetail, ResourceItem } from '../types/career';
import { MissionModal } from '../components/roadmap/MissionModal';

export const LearnPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [activeTab, setActiveTab] = useState<'missions' | 'quizzes' | 'projects' | 'resources'>('missions');
  const [loading, setLoading] = useState(true);

  // Active mission modal state
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [activeNode, setActiveNode] = useState<RoadmapNodeData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getCurrentRoadmap();
        if (res.success && res.roadmap) {
          setRoadmap(res.roadmap);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Aggregate all missions, projects, and resources from roadmap
  const allMissions: Array<{ mission: Mission; node: RoadmapNodeData }> = [];
  const allProjects: ProjectDetail[] = [];
  const allResources: ResourceItem[] = [];

  if (roadmap?.nodes) {
    roadmap.nodes.forEach(node => {
      if (node.missions) {
        node.missions.forEach(m => allMissions.push({ mission: m, node }));
      }
      if (node.project) {
        allProjects.push(node.project);
      }
      if (node.resources) {
        node.resources.forEach(r => allResources.push(r));
      }
    });
  }

  // Fallback sample projects if nodes don't embed direct project objects
  if (allProjects.length === 0 && roadmap?.projects) {
    allProjects.push(...roadmap.projects);
  }

  const handleStartMission = (item: { mission: Mission; node: RoadmapNodeData }) => {
    setActiveMission(item.mission);
    setActiveNode(item.node);
  };

  const handleMissionCompleted = (missionId: string) => {
    if (!roadmap) return;
    const updated = { ...roadmap };
    for (const n of updated.nodes) {
      const m = n.missions?.find(x => x.id === missionId);
      if (m) {
        m.isCompleted = true;
        break;
      }
    }
    setRoadmap(updated);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Learning Quests & Curriculum
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Targeted missions, quizzes, and concrete portfolio projects aligned to {roadmap?.targetRole || 'your target career'}.
        </p>

        {/* Tab switcher */}
        <div className="flex space-x-2 mt-5">
          {[
            { id: 'missions', label: `Missions (${allMissions.length})` },
            { id: 'quizzes', label: 'Quizzes & Practice' },
            { id: 'projects', label: `Projects (${allProjects.length})` },
            { id: 'resources', label: `Resources (${allResources.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MISSIONS TAB */}
      {activeTab === 'missions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allMissions.map((item, idx) => (
            <div
              key={item.mission.id || idx}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <span>{item.node.name}</span>
                  <span className="text-brand-600 dark:text-brand-400">+{item.mission.xp} XP</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.mission.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.mission.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">~{item.mission.estimatedMinutes} mins</span>
                {item.mission.isCompleted ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartMission(item)}
                    className="px-3.5 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center space-x-1"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Start Quest</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUIZZES TAB */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            AI-calibrated micro-quizzes testing practical edge cases and production architectures.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allMissions
              .filter(m => m.mission.content?.quizQuestions && m.mission.content.quizQuestions.length > 0)
              .map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-brand-600">Knowledge Check</span>
                    <span className="text-xs font-semibold text-slate-500">+{item.mission.xp} XP</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.node.name}: {item.mission.title}
                  </h3>
                  <button
                    onClick={() => handleStartMission(item)}
                    className="w-full mt-2 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Take Quiz</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allProjects.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  {p.difficulty} • ~{p.estimatedTime}
                </span>
                <span className="text-xs font-bold text-brand-600">+{p.xp} XP</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {p.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {p.description}
              </p>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Stack:</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.technologies?.map(tech => (
                    <span key={tech} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                <strong>Interview Value:</strong> {p.careerRelevance}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allResources.map((r, idx) => (
            <a
              key={idx}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-brand-500 transition-colors group flex items-start justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-600">
                  {r.type}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-brand-600">
                  {r.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{r.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-500 shrink-0 ml-3 mt-1" />
            </a>
          ))}
        </div>
      )}

      {/* Active Mission Runner Modal */}
      {activeMission && (
        <MissionModal
          mission={activeMission}
          node={activeNode}
          onClose={() => setActiveMission(null)}
          onCompleted={handleMissionCompleted}
        />
      )}
    </div>
  );
};

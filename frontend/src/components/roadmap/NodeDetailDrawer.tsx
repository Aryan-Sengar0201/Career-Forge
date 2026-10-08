import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  Sparkles,
  BookOpen,
  Briefcase,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Code2,
  Check,
  Send,
  MessageSquare
} from 'lucide-react';
import { RoadmapNodeData, Mission } from '../../types/career';
import { api } from '../../services/api';

interface NodeDetailDrawerProps {
  node: RoadmapNodeData | null;
  targetRole: string;
  onClose: () => void;
  onAlreadyKnow: (nodeId: string, nodeName: string) => Promise<void>;
  onStartMission: (mission: Mission, node: RoadmapNodeData) => void;
  isAdapting: boolean;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  targetRole,
  onClose,
  onAlreadyKnow,
  onStartMission,
  isAdapting,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'project' | 'resources' | 'interview' | 'ai'>('overview');

  // AI Deep-Dive Advice state
  const [loadingAiAdvice, setLoadingAiAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);

  // Ask AI Assistant state
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantConversation, setAssistantConversation] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [askingAi, setAskingAi] = useState(false);

  if (!node) return null;

  const isCompleted = node.status === 'completed';
  const isAvailable = node.status === 'available' || node.status === 'in_progress';

  const handleFetchAiAdvice = async () => {
    if (aiAdvice) return;
    setLoadingAiAdvice(true);
    try {
      const res = await api.getNodeAdvice({
        nodeId: node.id,
        nodeName: node.name,
        targetRole,
        whyItMatters: node.whyItMatters,
      });
      if (res.success) {
        setAiAdvice(res.advice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAiAdvice(false);
    }
  };

  const handleSendAssistantQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuestion.trim() || askingAi) return;

    const q = assistantQuestion.trim();
    setAssistantQuestion('');
    setAssistantConversation(prev => [...prev, { sender: 'user', text: q }]);
    setAskingAi(true);

    try {
      const res = await api.askCareerAssistant({
        question: q,
        targetRole,
        currentSkill: node.name,
        context: {
          nodeId: node.id,
          status: node.status,
          whyItMatters: node.whyItMatters,
        },
      });
      setAssistantConversation(prev => [...prev, { sender: 'ai', text: res.answer }]);
    } catch (err) {
      setAssistantConversation(prev => [
        ...prev,
        { sender: 'ai', text: "I'm temporarily unable to answer. Please focus on your current mission tasks." },
      ]);
    } finally {
      setAskingAi(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-[#0f172a] shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col font-sans transition-all">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/60 dark:bg-slate-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/40">
              {node.category || 'Skill Node'}
            </span>
            {isCompleted && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </span>
            )}
            {isAvailable && !isCompleted && (
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
                <PlayCircle className="w-3 h-3" />
                <span>Ready to Learn</span>
              </span>
            )}
            {node.status === 'locked' && (
              <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
            {node.name}
          </h2>
          <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
            {node.estimatedWeeks && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>~{node.estimatedWeeks} weeks</span>
              </span>
            )}
            <span>Level: <strong className="capitalize text-slate-700 dark:text-slate-300">{node.level}</strong></span>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close details"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto bg-white dark:bg-[#0f172a]">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'missions', label: `Missions (${node.missions?.length || 0})` },
          { id: 'project', label: 'Project' },
          { id: 'resources', label: 'Resources' },
          { id: 'interview', label: 'Interview Q&A' },
          { id: 'ai', label: '✦ AI Advisor' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'ai') handleFetchAiAdvice();
            }}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Why It Matters For {targetRole}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {node.whyItMatters}
              </p>
            </div>

            {node.dependencies && node.dependencies.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Prerequisites & Dependencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {node.dependencies.map(dep => (
                    <span
                      key={dep}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Next Mission preview */}
            {node.missions && node.missions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Primary Mission Quest
                </h4>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {node.missions[0].title}
                    </span>
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      +{node.missions[0].xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {node.missions[0].description}
                  </p>
                  <button
                    onClick={() => onStartMission(node.missions[0], node)}
                    className="w-full mt-2 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Start Mission</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MISSIONS TAB */}
        {activeTab === 'missions' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Complete these targeted missions to prove production mastery of this node.
            </p>
            {node.missions && node.missions.length > 0 ? (
              node.missions.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-600 dark:text-brand-400">
                        {m.type} • {m.estimatedMinutes} mins
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {m.title}
                      </h4>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300">
                      +{m.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {m.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    {m.isCompleted ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Mission Completed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onStartMission(m, node)}
                        className="px-3.5 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center space-x-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Quest</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                No individual missions for this milestone node.
              </div>
            )}
          </div>
        )}

        {/* PROJECT TAB */}
        {activeTab === 'project' && (
          <div className="space-y-4">
            {node.project ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">
                    {node.project.difficulty} • ~{node.project.estimatedTime}
                  </span>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    +{node.project.xp} XP
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {node.project.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {node.project.description}
                </p>

                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Technologies
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {node.project.technologies.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Expected Core Features
                  </h5>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {node.project.features.map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <strong className="block text-slate-900 dark:text-white mb-0.5">Career & Interview Relevance:</strong>
                  {node.project.careerRelevance}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                This node is focused on foundational conceptual mastery. Projects will unlock at subsequent milestones.
              </div>
            )}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Authoritative, verified documentation and references for {node.name}.
            </p>
            {node.resources && node.resources.length > 0 ? (
              node.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {r.type}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-brand-600">
                    {r.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                </a>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Official resources are available in the AI Advisor tab.
              </div>
            )}
          </div>
        )}

        {/* INTERVIEW QUESTIONS TAB */}
        {activeTab === 'interview' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Real questions hiring managers ask for {targetRole} concerning {node.name}.
            </p>
            {node.interviewQuestions && node.interviewQuestions.length > 0 ? (
              node.interviewQuestions.map((iq, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Category: {iq.category}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {iq.question}
                  </h4>
                  <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-1 font-semibold">
                      Senior Engineering Answer:
                    </strong>
                    {iq.sampleAnswer}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Interview questions will be generated via Career Tools → Interview Prep.
              </div>
            )}
          </div>
        )}

        {/* AI ADVISOR TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* Actionable Gemini Node Advice */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  <span>Actionable Gemini Blueprint</span>
                </h4>
                {loadingAiAdvice && (
                  <span className="text-xs text-brand-600 animate-pulse">Generating blueprint...</span>
                )}
              </div>

              {aiAdvice ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 text-xs">
                  {aiAdvice.weekendProject && (
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Weekend Mastery Project: {aiAdvice.weekendProject.title}
                      </span>
                      <p className="text-slate-500 mt-0.5">{aiAdvice.weekendProject.objective}</p>
                      <ul className="list-disc list-inside mt-2 space-y-0.5 text-slate-600 dark:text-slate-400">
                        {aiAdvice.weekendProject.steps?.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAdvice.gitHubBlueprint && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        GitHub Portfolio Blueprint: <code className="font-mono text-brand-600">{aiAdvice.gitHubBlueprint.repoName}</code>
                      </span>
                      <p className="text-slate-500 mt-0.5">{aiAdvice.gitHubBlueprint.description}</p>
                    </div>
                  )}

                  {aiAdvice.seniorInsight && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 p-2.5 rounded bg-brand-50/40 dark:bg-brand-950/30 text-brand-900 dark:text-brand-300">
                      <strong>Hiring Manager Insight:</strong> {aiAdvice.seniorInsight}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleFetchAiAdvice}
                  disabled={loadingAiAdvice}
                  className="w-full py-2.5 border border-dashed border-brand-300 dark:border-brand-800 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50/50 flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Blueprint & Weekend Project</span>
                </button>
              )}
            </div>

            {/* Interactive Ask Career Assistant Box */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                <span>Ask CareerForge AI</span>
              </h4>

              {assistantConversation.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assistantConversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-brand-600 text-white ml-6'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendAssistantQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={assistantQuestion}
                  onChange={(e) => setAssistantQuestion(e.target.value)}
                  placeholder="Why do I need this skill? What should I build?"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={askingAi}
                  className="px-3.5 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3">
        {/* "I Already Know This" button — Prompt Section 17 */}
        <button
          onClick={() => onAlreadyKnow(node.id, node.name)}
          disabled={isAdapting || isCompleted}
          className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
          title="Dynamic rerouting: Gemini re-plans the roadmap and unlocks advanced concepts"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isAdapting ? 'Re-planning Path...' : isCompleted ? 'Already Known' : 'I Already Know This'}</span>
        </button>

        {node.missions && node.missions.length > 0 && !isCompleted && (
          <button
            onClick={() => onStartMission(node.missions[0], node)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Start Mission</span>
          </button>
        )}
      </div>
    </div>
  );
};

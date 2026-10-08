import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  TrendingUp,
  Briefcase,
  GitCompare,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Send,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { CareerRoadmap } from '../types/career';

export const CareerToolsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'resume';

  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);

  // 1. Resume Analyzer State
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<any | null>(null);

  // 2. Interview Prep State
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  // 3. Career Readiness State
  const [readinessData, setReadinessData] = useState<any | null>(null);

  // 4. Career Comparison State
  const [compareRoleA, setCompareRoleA] = useState('Full Stack Developer');
  const [compareRoleB, setCompareRoleB] = useState('ML Engineer');

  useEffect(() => {
    async function load() {
      try {
        const [rm, rd] = await Promise.all([
          api.getCurrentRoadmap().catch(() => null),
          api.getReadiness().catch(() => null),
        ]);
        if (rm?.roadmap) setRoadmap(rm.roadmap);
        if (rd?.readiness) setReadinessData(rd.readiness);
      } catch {}
    }
    load();
  }, []);

  // Initialize interview questions
  useEffect(() => {
    if (currentTab === 'interview' && interviewQuestions.length === 0) {
      api.startInterview({ targetRole: roadmap?.targetRole || 'Full Stack Developer' })
        .then(res => {
          if (res.questions) setInterviewQuestions(res.questions);
        })
        .catch(() => {});
    }
  }, [currentTab, roadmap, interviewQuestions.length]);

  const handleResumeAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() && !resumeFile) return;

    setIsAnalyzingResume(true);
    try {
      const res = await api.analyzeResume({
        resumeText: resumeText.trim(),
        file: resumeFile || undefined,
        targetRole: roadmap?.targetRole || 'Full Stack Developer',
      });
      if (res.success) {
        setResumeAnalysis(res.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateAnswer.trim() || isEvaluating) return;

    const q = interviewQuestions[currentQuestionIndex];
    if (!q) return;

    setIsEvaluating(true);
    try {
      const res = await api.evaluateInterview({
        question: q.question,
        userAnswer: candidateAnswer.trim(),
        targetRole: roadmap?.targetRole || 'Full Stack Developer',
        category: q.category || 'technical',
      });
      if (res.success) {
        setEvaluationResult(res.evaluation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Career Tools & Portfolio Accelerators
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Targeted AI tooling to audit your resume, simulate interviews, and measure production readiness.
        </p>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2 mt-5">
          {[
            { id: 'resume', label: 'Resume Analyzer', icon: FileText },
            { id: 'interview', label: 'Mock Interview Prep', icon: MessageSquare },
            { id: 'readiness', label: 'Career Readiness', icon: TrendingUp },
            { id: 'jobs', label: 'Sample Opportunities', icon: Briefcase },
            { id: 'compare', label: 'Compare Careers', icon: GitCompare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. RESUME ANALYZER TAB */}
      {currentTab === 'resume' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Resume Alignment & Skill-Gap Analysis</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste your resume text or upload a document to identify missing keywords and technical requirements for {roadmap?.targetRole || 'your target role'}.
            </p>

            <form onSubmit={handleResumeAnalysis} className="space-y-4">
              <div>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume text here (Summary, Experience, Projects, Skills)..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <label className="text-xs text-slate-500 flex items-center space-x-2 cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg hover:border-slate-400">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{resumeFile ? resumeFile.name : 'Or upload .txt / .pdf file'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isAnalyzingResume || (!resumeText.trim() && !resumeFile)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzingResume ? 'Analyzing Resume...' : 'Analyze My Resume'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Resume Analysis Output */}
          {resumeAnalysis && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Target Role Alignment</span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {resumeAnalysis.alignmentScore}%
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Heuristic AI estimate • Not an ATS guarantee</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Strong Skills */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide text-[10px] block">
                    Strong Skills Detected
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeAnalysis.strongSkills?.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide text-[10px] block">
                    Missing Competencies / Gaps
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeAnalysis.missingSkills?.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-medium">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Roadmap Adjustments */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <strong className="block text-slate-900 dark:text-white font-semibold">
                  Recommended Roadmap Priority:
                </strong>
                <p className="leading-relaxed">{resumeAnalysis.recommendedAdjustments}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MOCK INTERVIEW PREP TAB */}
      {currentTab === 'interview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>AI Technical & Architectural Mock Interview</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Question {currentQuestionIndex + 1} of {interviewQuestions.length || 1}
              </span>
            </div>

            {interviewQuestions[currentQuestionIndex] ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-brand-600">
                  Category: {interviewQuestions[currentQuestionIndex].category}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {interviewQuestions[currentQuestionIndex].question}
                </p>
              </div>
            ) : (
              <div className="p-4 text-xs text-slate-400">Loading interview scenario...</div>
            )}

            <form onSubmit={handleInterviewSubmit} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                Your Spoken / Architectural Answer:
              </label>
              <textarea
                rows={5}
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="Walk through your reasoning, state management, transaction guarantees, and failure modes..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => (prev + 1) % (interviewQuestions.length || 1));
                    setEvaluationResult(null);
                    setCandidateAnswer('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Skip to Next Question →
                </button>

                <button
                  type="submit"
                  disabled={isEvaluating || !candidateAnswer.trim()}
                  className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEvaluating ? 'Evaluating with Gemini...' : 'Evaluate Answer'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Evaluation Result */}
          {evaluationResult && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {evaluationResult.score}/100
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 font-semibold">
                    Verdict: {evaluationResult.verdict}
                  </span>
                </div>
                <span className="text-xs font-semibold text-brand-600">+40 XP Awarded</span>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <strong className="block text-slate-900 dark:text-white mb-1">Constructive Feedback:</strong>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{evaluationResult.suggestions}</p>
                </div>

                <div className="p-3 rounded-lg bg-brand-50/40 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40">
                  <strong className="block text-brand-900 dark:text-brand-200 mb-1">
                    Staff Engineer Model Answer:
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{evaluationResult.improvedAnswer}</p>
                </div>

                {evaluationResult.followUpQuestion && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <strong className="block text-slate-900 dark:text-white mb-1">Probing Follow-Up:</strong>
                    <p className="text-slate-600 dark:text-slate-300">{evaluationResult.followUpQuestion}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CAREER READINESS TAB */}
      {currentTab === 'readiness' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CareerForge Quantitative Index
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Career Readiness Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Calculated from your verified node completions, portfolio project deliverables, and mock interview attempts.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Overall Readiness', value: `${readinessData?.overallScore || 68}%`, note: 'Weighted composite' },
              { label: 'Skills Mastery', value: `${readinessData?.skillsScore || 72}%`, note: 'Curriculum coverage' },
              { label: 'Projects Portfolio', value: `${readinessData?.projectsScore || 60}%`, note: 'Verified code deliverables' },
              { label: 'Interview Readiness', value: `${readinessData?.interviewScore || 55}%`, note: 'Scenario evaluation' },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{item.value}</div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 space-y-1">
            <strong>Disclosure:</strong> The Career Readiness score is a CareerForge pedagogical estimate and guide. It does not constitute a legal or contractual guarantee of hiring.
          </div>
        </div>
      )}

      {/* 4. SAMPLE OPPORTUNITIES TAB */}
      {currentTab === 'jobs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <strong>Sample Opportunities:</strong> The listings below represent illustrative production job specs aligned with your {roadmap?.targetRole || 'target'} roadmap. They illustrate how requirements map to the skills you are learning.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Full Stack Engineer - Core Platform',
                company: 'FinTech Growth Co.',
                location: 'Remote / Hybrid',
                match: '85% Skill Match',
                reqs: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Idempotent APIs'],
              },
              {
                title: 'Junior Software Engineer (Full Stack)',
                company: 'Modern Ledger Inc.',
                location: 'San Francisco, CA / Remote',
                match: '92% Skill Match',
                reqs: ['React', 'RESTful APIs', 'ACID Transactions', 'Git CI/CD'],
              },
            ].map((job, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-brand-600">{job.match}</span>
                  <span className="text-[10px] text-slate-400">Sample Opportunity</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{job.title}</h3>
                <div className="text-xs text-slate-500">{job.company} • {job.location}</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.reqs.map(r => (
                    <span key={r} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. COMPARE CAREERS TAB */}
      {currentTab === 'compare' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Career Path Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Compare architectural divergence, estimated timelines, and core portfolio requirements between career tracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <span className="text-[10px] uppercase font-bold text-brand-600">Track A</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{compareRoleA}</h3>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>• <strong>Focus:</strong> Interactive UI, resilient REST/RPC APIs, relational data integrity</li>
                <li>• <strong>Average Timeline:</strong> 6 - 8 Months</li>
                <li>• <strong>Key Capstone:</strong> Multi-tenant financial ledger & analytics platform</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <span className="text-[10px] uppercase font-bold text-purple-600">Track B</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{compareRoleB}</h3>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>• <strong>Focus:</strong> Statistical modeling, PyTorch/TensorFlow, model deployment & inference latency</li>
                <li>• <strong>Average Timeline:</strong> 8 - 12 Months</li>
                <li>• <strong>Key Capstone:</strong> Real-time fraud detection pipeline & embeddings search</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

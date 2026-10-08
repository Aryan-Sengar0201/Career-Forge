import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  Calendar,
  Layers,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  // Current Step: 1 to 5
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [dreamRoleInput, setDreamRoleInput] = useState('Full Stack Developer at a FinTech startup');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [industry, setIndustry] = useState('FinTech');
  const [companyType, setCompanyType] = useState('Startup');
  const [location, setLocation] = useState('Global');

  // Step 2: Known skills
  const [skillsList, setSkillsList] = useState<string[]>(['Python']);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Step 3: Experience
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  // Step 4: Hours per week
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);

  // Step 5: Timeline
  const [timelineMonths, setTimelineMonths] = useState<number>(6);

  // Suggested popular skills
  const popularSkills = ['Python', 'JavaScript', 'HTML/CSS', 'Git', 'Java', 'C++', 'SQL', 'React Basics'];

  const toggleSkill = (skill: string) => {
    if (skillsList.includes(skill)) {
      setSkillsList(skillsList.filter(s => s !== skill));
    } else {
      setSkillsList([...skillsList, skill]);
    }
  };

  const addCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (customSkillInput.trim() && !skillsList.includes(customSkillInput.trim())) {
      setSkillsList([...skillsList, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handleBuildCareerPath = async () => {
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      // Auto-parse role and industry from natural language if needed
      let role = targetRole;
      let ind = industry;

      if (dreamRoleInput.toLowerCase().includes('fintech')) {
        ind = 'FinTech';
      }
      if (dreamRoleInput.toLowerCase().includes('full stack') || dreamRoleInput.toLowerCase().includes('fullstack')) {
        role = 'Full Stack Developer';
      } else if (dreamRoleInput.trim()) {
        role = dreamRoleInput.split(' at ')[0].trim();
      }

      const res = await api.generateCareerRoadmap({
        targetRole: role || dreamRoleInput,
        industry: ind,
        companyType,
        location,
        experienceLevel,
        currentSkills: skillsList,
        hoursPerWeek,
        timelineMonths,
      });

      if (res.success) {
        navigate('/career-path');
      } else {
        throw new Error('Failed to generate career path.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("CareerForge couldn't generate your path right now. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white">
              CAREERFORGE
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Step {currentStep} of 5
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <button
                onClick={handleBuildCareerPath}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: DREAM CAREER */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Step 1: Your Target Destination
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                What is your dream career?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Tell us where you want to go. You can use natural language describing your ideal role and industry.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Target Role (Natural Language)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dreamRoleInput}
                    onChange={(e) => setDreamRoleInput(e.target.value)}
                    placeholder="e.g. Full Stack Developer at a FinTech startup"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="FinTech, HealthTech, AI, SaaS..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Company Type
                  </label>
                  <input
                    type="text"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    placeholder="Startup, Enterprise, Agency..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: KNOWN SKILLS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Step 2: Existing Competencies
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                What do you already know?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Select or type the skills you already possess. We'll skip beginner tutorials and reverse-engineer from where you currently are.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill) => {
                  const isSelected = skillsList.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom skill input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={addCustomSkill}
                  placeholder="Type other skill (e.g. SQL, Git, Docker) & press Enter"
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                >
                  Add
                </button>
              </div>

              {skillsList.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-slate-500 block mb-2 font-medium">Selected skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs font-medium flex items-center space-x-1"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => toggleSkill(s)}
                          className="hover:text-red-500 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: EXPERIENCE LEVEL */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Step 3: Background Calibration
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                What is your experience level?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This helps our AI calibrate how quickly concepts and architectural patterns should be introduced.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'Beginner',
                  title: 'Beginner',
                  desc: 'New to coding or early in your learning journey.',
                },
                {
                  id: 'Intermediate',
                  title: 'Intermediate',
                  desc: 'Comfortable with basics, looking to build production systems.',
                },
                {
                  id: 'Advanced',
                  title: 'Advanced',
                  desc: 'Experienced engineer pivoting to new stacks or leadership.',
                },
              ].map((opt) => {
                const isSelected = experienceLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExperienceLevel(opt.id as any)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/30 dark:bg-brand-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{opt.title}</h4>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: TIME DEDICATION */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Step 4: Weekly Commitment
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                How much time can you dedicate?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                We use your weekly hours to ensure each roadmap milestone has realistic expectations and manageable missions.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { hours: 5, label: '5 hrs / wk', desc: 'Casual pace' },
                { hours: 10, label: '10 hrs / wk', desc: 'Standard focus' },
                { hours: 15, label: '15 hrs / wk', desc: 'Accelerated' },
                { hours: 25, label: '20+ hrs / wk', desc: 'Intensive' },
              ].map((item) => {
                const isSelected = hoursPerWeek === item.hours;
                return (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setHoursPerWeek(item.hours)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-2 text-slate-400" />
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: TIMELINE TARGET */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Step 5: Target Horizon
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                When do you want to reach your goal?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                We calculate whether your desired timeline is achievable and reverse-engineer every dependency into that timeframe.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { months: 3, label: '3 Months', desc: 'Sprint' },
                { months: 6, label: '6 Months', desc: 'Balanced' },
                { months: 9, label: '9 Months', desc: 'Comprehensive' },
                { months: 12, label: '12 Months', desc: 'Mastery' },
              ].map((item) => {
                const isSelected = timelineMonths === item.months;
                return (
                  <button
                    key={item.months}
                    type="button"
                    onClick={() => setTimelineMonths(item.months)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mx-auto mb-2 text-slate-400" />
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Honest Timeline Guidance Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                AI Feasibility Calibration:
              </span>
              <p>
                At {hoursPerWeek} hrs/week over {timelineMonths} months, you will invest approximately{' '}
                <strong className="text-brand-600 dark:text-brand-400 font-semibold">
                  {hoursPerWeek * 4 * timelineMonths} hours
                </strong>{' '}
                of focused practice. Our AI will optimize milestones strictly for high-yield production competencies.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleBuildCareerPath}
              className="px-7 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20 flex items-center space-x-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Reverse-Engineering Path...' : 'Build My Career Path'}</span>
            </button>
          )}
        </div>
      </main>

      {/* Loading Overlay when Gemini is actively reverse-engineering */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin text-brand-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reverse-Engineering Career Path
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Google Gemini is analyzing target competencies, deriving dependencies, and structuring your personalized roadmap...
            </p>
          </div>
        </div>
      )}

      {/* Bottom Minimal Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        CareerForge • Simple on the surface, powerful underneath.
      </footer>
    </div>
  );
};

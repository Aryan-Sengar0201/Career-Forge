import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Shield, Compass, Layers, ArrowUpRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Minimal Top Header */}
      <header className="border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white">
            CAREERFORGE
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium">
          <Link
            to="/login"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 flex flex-col items-center text-center">
        {/* Subtle Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          <span>Problem Statement 1 • Reverse-Engineered Career Roadmapper</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl leading-[1.15]">
          Forge Your Path.<br />
          <span className="text-brand-600 dark:text-brand-400">Build Your Future.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
          Turn your dream career into a personalized, AI-powered career path.
          We reverse-engineer what high-growth companies hire for into a clear, interactive visual roadmap.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-7 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2 text-base"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-base transition-colors"
          >
            Already have an account? <span className="underline underline-offset-4 font-semibold">Log In</span>
          </Link>
        </div>

        {/* Visual Roadmap Preview Container */}
        <div className="mt-16 w-full max-w-4xl border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Target: Full Stack Developer at FinTech Startup</span>
            </div>
            <span className="text-slate-400">Interactive DAG Visualization Preview</span>
          </div>

          {/* Interactive DAG Simulation Graphic */}
          <div className="py-8 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Completed</span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">TypeScript & Core Types</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Strict type narrowing & generics</p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border-2 border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 text-left shadow-sm">
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">Current Focus</span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">React State Management</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optimistic UI & revalidation</p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-left opacity-80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Upcoming</span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">PostgreSQL & ACID</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ledger design & row locking</p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-left opacity-60">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destination</span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">FinTech Full-Stack</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Idempotency & ledger capstone</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Powered by Google Gemini 2.5 Flash</span>
            <span className="font-medium text-brand-600 dark:text-brand-400">Dynamic rerouting with "I Already Know This"</span>
          </div>
        </div>

        {/* 3 Core Principles */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full max-w-4xl">
          <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0f172a]/40">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 mb-3">
              <Compass className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Reverse-Engineered</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              We start at your target role and work backwards, deriving required dependencies, architectural patterns, and domain competencies.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0f172a]/40">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 mb-3">
              <Layers className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dynamic Rerouting</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Already know a skill? Click "I Already Know This". Gemini genuinely re-plans subsequent milestones, elevating you to senior concepts.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0f172a]/40">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 mb-3">
              <Shield className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Concrete Projects</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              No generic tutorials. Build portfolio projects with real-world architecture that hiring managers respect.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

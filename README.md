# CareerForge

> **"Forge Your Path. Build Your Future."**  
> *Turn your dream career into a personalized, AI-powered career path.*

---

## 1. Problem Statement

**Problem Statement 1 — Reverse-Engineered Career Roadmapper**

Aspiring software engineers, students, and career changers frequently encounter ambiguous, generic career advice. When a candidate says:

> *"I want to become a Full Stack Developer at a FinTech startup."*

Generic platforms simply provide laundry lists of tutorial videos ("Learn Python", "Build a project", "Apply to jobs"). They fail to communicate:
1. **Where am I?**
2. **Where am I going?**
3. **What have I completed?**
4. **What should I do next?**

**CareerForge** solves this by fundamentally reverse-engineering the destination role backwards into an interactive Directed Acyclic Graph (DAG) of architectural proficiencies, dependencies, real-world portfolio projects, and daily missions.

---

## 2. What CareerForge Does

1. **Natural Language Reverse-Engineering**: Accepts natural language goal statements (e.g. *"Full Stack Developer at a FinTech startup"*) along with current skills, commitment, and desired timeline.
2. **Dynamic Skill-Gap Analysis**: Identifies exact architectural proficiencies required in production (e.g., ACID transactions, idempotency keys, typed distributed systems) and excludes what you already know.
3. **Interactive Visual Career Graph**: Uses `@xyflow/react` to render a pan-and-zoom dependency roadmap with state-aware nodes (Locked, Ready to Start, Completed).
4. **"I Already Know This" Dynamic Rerouting**: When a user marks a skill as known, CareerForge calls Google Gemini to genuinely reconsider subsequent milestones, unlocking dependent nodes and elevating the curriculum to senior architectural patterns (e.g. Advanced State Machines, Performance Profiling).
5. **Time-Based Replanning**: Recalculates paths when schedules change and honestly flags unrealistic sprint expectations.
6. **Actionable AI Blueprints**: Generates weekend projects, GitHub repository structures, hiring manager insights, and interview challenges for every node.
7. **Production Portfolio Projects**: Prescribes concrete, industry-grade projects (e.g., *Multi-Tenant Financial Ledger & Settlement Engine*) that hiring managers respect.
8. **Professional Gamification**: Duolingo-inspired motivation (XP, streaks, quests, celebrations) without childish visual clutter.
9. **Career Acceleration Tools**: Includes an AI Resume Analyzer, Mock Technical Interview Simulator with AI evaluation, and a Quantitative Career Readiness Score.

---

## 3. Done / Left / Plan

| Status | Milestone / Feature | Description |
| :--- | :--- | :--- |
| ✅ **DONE** | **Clean Full-Stack Architecture** | Clean decoupled frontend (React/Vite/Tailwind) & backend (Node/Express/TypeScript). |
| ✅ **DONE** | **Authentication & Sessions** | Supabase Auth integration with local persistent fallback session store. |
| ✅ **DONE** | **5-Step Onboarding Flow** | Natural language dream career, existing skills, experience calibration, commitment & timeline. |
| ✅ **DONE** | **Real Google Gemini Integration** | Server-side `@google/genai` SDK calling `gemini-2.5-flash` with structured JSON and Zod validation. |
| ✅ **DONE** | **Interactive React Flow Roadmap** | `@xyflow/react` DAG graph with automatic Dagre hierarchical layout calculation. |
| ✅ **DONE** | **Node Types & Progressive Disclosure** | Skill, Project, Intermediate Role, Certification, Milestone, and Target Role nodes. |
| ✅ **DONE** | **"I Already Know This" Dynamic Rerouting** | Live AI re-planning of subsequent dependencies and advanced elevation. |
| ✅ **DONE** | **Time-Based Replanning** | Dynamic timeline adjustment with honest feasibility calibration. |
| ✅ **DONE** | **Actionable Node Advice** | Weekend projects, GitHub blueprints, senior insights, and checklists. |
| ✅ **DONE** | **Mission Runner & Knowledge Checks** | Interactive quiz challenges with instant explanations and XP awards. |
| ✅ **DONE** | **AI Resume Analyzer** | Skill extraction, alignment scoring, missing keyword detection, and roadmap adjustments. |
| ✅ **DONE** | **AI Mock Interview Simulator** | Scenario questions with Gemini evaluation (score, feedback, Staff Engineer model answer). |
| ✅ **DONE** | **Career Readiness Index** | Multi-dimensional scoring across Skills, Projects, Interview, and Resume. |
| ✅ **DONE** | **Dark / Light Mode Support** | Restrained minimal theme system with local persistence. |
| 🔄 **PLAN** | **Live Job Board API Connector** | Integrating real-time ATS job scraping feeds (e.g., Greenhouse/Lever API). |
| 🔄 **PLAN** | **GitHub PR Code Review Bot** | Automatically reviewing candidate capstone repository commits against mission requirements. |

---

## 4. Architecture and Why

```
CareerForge Architecture
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│            React 19 + TypeScript + Vite                │
│    Tailwind CSS v4 • @xyflow/react • Framer Motion     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (REST + JWT)
┌───────────────────────────▼────────────────────────────┐
│                      Server Layer                      │
│               Node.js + Express + TypeScript           │
│   • Auth Middleware (Supabase JWT / Local Session)     │
│   • Zod Schema Validation & Retry Engine               │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│         AI Layer         │  │      Database Layer      │
│   @google/genai SDK      │  │  Supabase PostgreSQL      │
│   Model: gemini-2.5-flash│  │  Row Level Security (RLS) │
│   (Strict Server-Side)   │  │  + Persistent Local JSON  │
└──────────────────────────┘  └──────────────────────────┘
```

### Architectural Decisions:
- **Zero Frontend Secret Exposure**: All AI calls to Google Gemini occur strictly through Express backend routes. `GEMINI_API_KEY` is never bundled into client assets.
- **Client-Side Graph Layout**: Gemini generates logical graphs and dependency arrays (`dependencies: ["node-ts"]`), and the frontend layout engine (`dagre`) computes geometric coordinates (`x`, `y`).
- **Resilient Fallback Storage**: The backend contains a persistent storage engine (`backend/src/services/storeService.ts`) mirroring Supabase PostgreSQL. The application is instantly functional out-of-the-box before cloud credentials are added, and connects to Supabase as soon as credentials are provided.

---

## 5. Technologies Used

- **Frontend**:
  - React 19, TypeScript
  - Vite (build tool & dev server)
  - Tailwind CSS v4 (`@tailwindcss/postcss`)
  - `@xyflow/react` (React Flow visual DAG roadmaps)
  - `dagre` (hierarchical layout engine)
  - `lucide-react` (iconography)
  - `framer-motion` (calm UI transitions)
  - `canvas-confetti` (gamification celebration particle effects)
- **Backend**:
  - Node.js (v24), Express
  - TypeScript, `tsx`
  - `@google/genai` (official Google Gemini SDK)
  - `@supabase/supabase-js` (Supabase PostgreSQL client)
  - `zod` (schema definition and validation)
  - `multer` (multipart resume file handling)
  - `cors`, `dotenv`

---

## 6. AI Usage

CareerForge integrates Google Gemini (`gemini-2.5-flash`) via the official `@google/genai` SDK:

1. **Career Reverse-Engineering (`POST /api/career/generate`)**:
   - Takes target role, industry, candidate experience, known skills, hours/week, and timeline.
   - Instructs Gemini to reverse-engineer production-grade requirements into discrete nodes with typed dependencies.
2. **Structured JSON Output & Validation**:
   - Uses `responseMimeType: "application/json"` with schema-guided prompts.
   - Output is parsed and validated against Zod schemas (`geminiRoadmapResponseSchema`). If validation fails, an automatic retry is triggered.
3. **Dynamic Path Adaptation (`POST /api/career/adapt`)**:
   - When a user triggers *"I Already Know This"*, Gemini analyzes the graph, unlocks dependent competencies, and injects advanced architectural concepts.
4. **Actionable Node Guidance (`POST /api/career/node-advice`)**:
   - Produces weekend mastery projects, GitHub repository structures, and senior engineering trade-offs.
5. **Interactive AI Assistant (`POST /api/career/ask`)**:
   - Context-aware mentor answering questions about why skills matter and portfolio advice.
6. **Resume Auditing (`POST /api/resume/analyze`)**:
   - Extracts skills and provides honest alignment scoring without false ATS guarantees.
7. **Mock Interview Evaluation (`POST /api/interview/evaluate`)**:
   - Evaluates scenario answers, identifies missing edge cases, and provides Staff Engineer model responses.

---

## 7. Database

The database uses **Supabase PostgreSQL** with **Row Level Security (RLS)**.

Tables defined:
- `public.profiles`: Extends `auth.users` with XP, levels, and streaks.
- `public.career_profiles`: Onboarding preferences and target career roles.
- `public.career_roadmaps`: Generated high-level roadmaps, timeline, and phase summaries.
- `public.roadmap_nodes`: Graph nodes with status, dependencies, and resources.
- `public.missions`: Daily actionable quests and quiz challenges per node.
- `public.quiz_attempts`: Knowledge check attempts and scores.
- `public.resume_analysis`: Skill extraction results and recommendations.
- `public.career_readiness`: Quantitative readiness score breakdown.
- `public.achievements`: Unlocked badges and milestones.
- `public.notifications`: System updates.

The full schema migration file is located at `supabase_schema.sql` (and `backend/supabase/schema.sql`).

---

## 8. Authentication

- **Supabase Auth**: Supports signup, login, persistent JWT sessions, and protected routes.
- **Protected Routes**:
  - `/dashboard`
  - `/career-path`
  - `/learn`
  - `/career-tools`
  - `/profile`
- Unauthenticated requests are redirected to `/login`.
- Automatically syncs user credentials with the backend profile store.

---

## 9. Environment Variables

### Backend (`backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
```

### Frontend (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:3001
```

*(Reference `.env.example` files are provided in both directories).*

---

## 10. Setup Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### Repository Clone & Navigation
```bash
cd CareerForge
```

---

## 11. Backend Startup

```bash
cd backend
npm install
npm run build
npm start
```
*The backend server will start on `http://localhost:3001`.*

To run in auto-reload development mode:
```bash
npm run dev
```

---

## 12. Frontend Startup

```bash
cd frontend
npm install
npm run dev
```
*The Vite frontend will open at `http://127.0.0.1:5173/`.*

To build for production:
```bash
npm run build
```

---

## 13. Database Setup (Supabase)

1. Create a free project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and execute the contents of `supabase_schema.sql`.
4. Copy your project URL and service role key into `backend/.env`.
5. Copy your project URL and anon public key into `frontend/.env`.

---

## 14. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Live health check verifying Gemini connectivity |
| `POST` | `/api/career/generate` | Generates reverse-engineered career roadmap |
| `GET` | `/api/career/current` | Retrieves active career roadmap for logged-in user |
| `POST` | `/api/career/adapt` | Dynamic rerouting ("I Already Know This" / timeline recalculation) |
| `POST` | `/api/career/node-advice` | Actionable weekend project & GitHub blueprint for a node |
| `POST` | `/api/career/ask` | Context-aware AI Career Assistant mentor |
| `PATCH`| `/api/career/node-status` | Updates node status (e.g. in_progress, completed) |
| `POST` | `/api/missions/:id/complete`| Completes a mission, awards XP, and updates streaks |
| `POST` | `/api/quiz/submit` | Records quiz attempt and awards score-based XP |
| `GET` | `/api/progress` | Fetches user level, streak, XP, and readiness |
| `GET` | `/api/readiness` | Fetches quantitative Career Readiness score breakdown |
| `POST` | `/api/resume/analyze` | AI resume skill extraction and gap analysis |
| `POST` | `/api/interview/start` | Fetches role-specific mock interview questions |
| `POST` | `/api/interview/evaluate`| Evaluates interview answers and provides Staff model response |

---

## 15. Deployment Instructions

### Backend (Railway, Render, or AWS ECS):
1. Set the root directory to `backend/`.
2. Set build command: `npm install && npm run build`.
3. Set start command: `npm start`.
4. Configure environment variables (`PORT`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### Frontend (Vercel, Netlify, or Cloudflare Pages):
1. Set the root directory to `frontend/`.
2. Set build command: `npm run build`.
3. Set output directory: `dist`.
4. Configure environment variable: `VITE_API_URL=https://your-backend-domain.com`.

---

## 16. Who It Is For

- **Students & Self-Taught Developers**: Seeking a clear, non-overwhelming step-by-step path from zero to job-ready.
- **Engineers Pivoting Stacks**: (e.g., Python scripts to Full-Stack FinTech) who need to skip beginner basics and focus immediately on production architectural patterns.
- **Bootcamp Graduates**: Needing portfolio capstone projects with real-world technical depth instead of generic todo apps.

---

## 17. What Was Added Beyond Core PS1

1. **Interactive Mission Runner & Live Quizzes**: Users don't just view skills—they take micro-challenges with instant feedback and XP awards.
2. **AI Resume Alignment Analyzer**: Directly analyzes resumes against target roles to recommend roadmap adjustments.
3. **Mock Architectural Interview Simulator**: Rigorous interview practice evaluating scenario trade-offs with Staff Engineer model answers.
4. **Quantified Career Readiness Score**: Multi-factor readiness index evaluating skills, portfolio deliverables, resume alignment, and interview answers.
5. **Career Track Comparison**: Side-by-side analysis contrasting timeline, difficulty, and portfolio deliverables between alternative engineering tracks.
6. **Dark & Light Mode**: Accessible, restrained aesthetic adhering to the "Simple on the surface, powerful underneath" design philosophy.

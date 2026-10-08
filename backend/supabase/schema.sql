-- ====================================================================
-- CAREERFORGE DATABASE SCHEMA
-- Supabase PostgreSQL with Row Level Security (RLS)
-- ====================================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Career Profiles (Onboarding target role & preferences)
CREATE TABLE IF NOT EXISTS public.career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  industry TEXT,
  company_type TEXT,
  company_name TEXT,
  location TEXT,
  experience_level TEXT NOT NULL,
  current_skills TEXT[] DEFAULT '{}',
  hours_per_week INTEGER DEFAULT 10,
  timeline_months INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Career Roadmaps (The generated high-level reverse-engineered roadmap)
CREATE TABLE IF NOT EXISTS public.career_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  career_profile_id UUID REFERENCES public.career_profiles ON DELETE SET NULL,
  target_role TEXT NOT NULL,
  summary TEXT,
  timeline_months INTEGER NOT NULL,
  total_skills INTEGER DEFAULT 0,
  completed_skills INTEGER DEFAULT 0,
  phases JSONB DEFAULT '[]'::jsonb,
  roles JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Roadmap Nodes (Graph nodes for skills, projects, milestones, roles)
CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
  id TEXT NOT NULL,
  roadmap_id UUID REFERENCES public.career_roadmaps ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'skill', 'project', 'intermediate_role', 'certification', 'milestone', 'target_role'
  category TEXT,
  level TEXT,
  estimated_weeks NUMERIC DEFAULT 1,
  why_it_matters TEXT,
  status TEXT DEFAULT 'locked', -- 'locked', 'available', 'in_progress', 'completed', 'skipped'
  dependencies TEXT[] DEFAULT '{}',
  resources JSONB DEFAULT '[]'::jsonb,
  interview_questions JSONB DEFAULT '[]'::jsonb,
  project_details JSONB DEFAULT '{}'::jsonb,
  missions JSONB DEFAULT '[]'::jsonb,
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (roadmap_id, id)
);

-- 5. Missions (Daily quests & action items per node)
CREATE TABLE IF NOT EXISTS public.missions (
  id TEXT NOT NULL,
  roadmap_id UUID REFERENCES public.career_roadmaps ON DELETE CASCADE NOT NULL,
  node_id TEXT,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp INTEGER DEFAULT 50,
  estimated_minutes INTEGER DEFAULT 20,
  type TEXT DEFAULT 'learn', -- 'learn', 'practice', 'quiz', 'build', 'interview'
  content JSONB DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (roadmap_id, id)
);

-- 6. Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  node_id TEXT,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Resume Analysis
CREATE TABLE IF NOT EXISTS public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  filename TEXT,
  extracted_skills TEXT[] DEFAULT '{}',
  strong_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  missing_keywords TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  alignment_score INTEGER DEFAULT 0,
  recommended_adjustments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Career Readiness Scores
CREATE TABLE IF NOT EXISTS public.career_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  overall_score INTEGER DEFAULT 0,
  skills_score INTEGER DEFAULT 0,
  projects_score INTEGER DEFAULT 0,
  interview_score INTEGER DEFAULT 0,
  resume_score INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Achievements & Badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Career Profiles
CREATE POLICY "Users can view own career profiles" ON public.career_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own career profiles" ON public.career_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career profiles" ON public.career_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own career profiles" ON public.career_profiles FOR DELETE USING (auth.uid() = user_id);

-- Career Roadmaps
CREATE POLICY "Users can view own roadmaps" ON public.career_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own roadmaps" ON public.career_roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.career_roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.career_roadmaps FOR DELETE USING (auth.uid() = user_id);

-- Roadmap Nodes
CREATE POLICY "Users can view own roadmap nodes" ON public.roadmap_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmap nodes" ON public.roadmap_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmap nodes" ON public.roadmap_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmap nodes" ON public.roadmap_nodes FOR DELETE USING (auth.uid() = user_id);

-- Missions
CREATE POLICY "Users can view own missions" ON public.missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.missions FOR UPDATE USING (auth.uid() = user_id);

-- Quiz Attempts
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resume Analysis
CREATE POLICY "Users can view own resume analyses" ON public.resume_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume analyses" ON public.resume_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Career Readiness
CREATE POLICY "Users can view own career readiness" ON public.career_readiness FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own career readiness" ON public.career_readiness FOR ALL USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ====================================================================
-- AUTO PROFILE CREATION ON AUTH SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

export type NodeType = 'skill' | 'project' | 'intermediate_role' | 'certification' | 'milestone' | 'target_role';
export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';

export interface Mission {
  id: string;
  title: string;
  description: string;
  xp: number;
  estimatedMinutes: number;
  type: 'learn' | 'practice' | 'quiz' | 'build' | 'interview';
  isCompleted?: boolean;
  completedAt?: string;
  content?: {
    instructions?: string;
    starterCode?: string;
    quizQuestions?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  };
}

export interface ResourceItem {
  title: string;
  type: 'documentation' | 'tutorial' | 'course' | 'github' | 'book' | 'article';
  url: string;
  description: string;
  isVerified?: boolean;
}

export interface InterviewQuestionItem {
  question: string;
  sampleAnswer: string;
  category: 'technical' | 'behavioral' | 'scenario' | 'system_design';
}

export interface ProjectDetail {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  technologies: string[];
  features: string[];
  careerRelevance: string;
  interviewValue?: string;
  xp: number;
}

export interface RoadmapNodeData {
  id: string;
  name: string;
  type: NodeType;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedWeeks: number;
  whyItMatters: string;
  status: NodeStatus;
  dependencies: string[];
  missions: Mission[];
  resources: ResourceItem[];
  interviewQuestions: InterviewQuestionItem[];
  project?: ProjectDetail;
  position?: { x: number; y: number };
}

export interface CareerPhase {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  nodeIds: string[];
}

export interface IntermediateRole {
  title: string;
  description: string;
  typicalTimeframe: string;
  prerequisites: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  relevance: string;
  difficulty: string;
  estimatedPrepWeeks: number;
}

export interface CareerRoadmap {
  id: string;
  userId: string;
  targetRole: string;
  industry?: string;
  companyType?: string;
  location?: string;
  summary: string;
  timelineMonths: number;
  experienceLevel: string;
  totalSkills: number;
  completedSkills: number;
  phases: CareerPhase[];
  nodes: RoadmapNodeData[];
  roles: IntermediateRole[];
  certifications: CertificationItem[];
  projects: ProjectDetail[];
  milestones: string[];
  isDemoFallback?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareerReadinessScore {
  overallScore: number;
  skillsScore: number;
  projectsScore: number;
  interviewScore: number;
  resumeScore: number;
  breakdown: {
    skillsCompleted: number;
    skillsTotal: number;
    projectsCompleted: number;
    projectsTotal: number;
    interviewsCompleted: number;
    resumeOptimized: boolean;
  };
}

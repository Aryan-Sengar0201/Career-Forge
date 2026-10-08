import { z } from 'zod';

export const generateCareerInputSchema = z.object({
  targetRole: z.string().min(2, "Target role is required"),
  industry: z.string().optional().default("Technology"),
  companyType: z.string().optional().default("Startup / Enterprise"),
  location: z.string().optional().default("Global"),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
  currentSkills: z.array(z.string()).default([]),
  hoursPerWeek: z.number().min(1).max(80).default(10),
  timelineMonths: z.number().min(1).max(36).default(6),
});

export const missionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  xp: z.number().default(50),
  estimatedMinutes: z.number().default(20),
  type: z.enum(['learn', 'practice', 'quiz', 'build', 'interview']).default('learn'),
  content: z.object({
    instructions: z.string().optional(),
    starterCode: z.string().optional(),
    quizQuestions: z.array(z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      explanation: z.string(),
    })).optional(),
  }).optional(),
});

export const resourceItemSchema = z.object({
  title: z.string(),
  type: z.enum(['documentation', 'tutorial', 'course', 'github', 'book', 'article']).default('documentation'),
  url: z.string(),
  description: z.string(),
  isVerified: z.boolean().optional().default(true),
});

export const interviewQuestionSchema = z.object({
  question: z.string(),
  sampleAnswer: z.string(),
  category: z.enum(['technical', 'behavioral', 'scenario', 'system_design']).default('technical'),
});

export const projectDetailSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  estimatedTime: z.string(),
  technologies: z.array(z.string()),
  features: z.array(z.string()),
  careerRelevance: z.string(),
  interviewValue: z.string().optional(),
  xp: z.number().default(150),
});

export const roadmapNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['skill', 'project', 'intermediate_role', 'certification', 'milestone', 'target_role']).default('skill'),
  category: z.string().default('Core'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimatedWeeks: z.number().default(1),
  whyItMatters: z.string(),
  status: z.enum(['locked', 'available', 'in_progress', 'completed', 'skipped']).default('locked'),
  dependencies: z.array(z.string()).default([]),
  missions: z.array(missionSchema).default([]),
  resources: z.array(resourceItemSchema).default([]),
  interviewQuestions: z.array(interviewQuestionSchema).default([]),
  project: projectDetailSchema.optional(),
});

export const careerPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  durationWeeks: z.number(),
  nodeIds: z.array(z.string()),
});

export const intermediateRoleSchema = z.object({
  title: z.string(),
  description: z.string(),
  typicalTimeframe: z.string(),
  prerequisites: z.array(z.string()),
});

export const certificationItemSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  relevance: z.string(),
  difficulty: z.string(),
  estimatedPrepWeeks: z.number(),
});

export const geminiRoadmapResponseSchema = z.object({
  targetRole: z.string(),
  summary: z.string(),
  timelineMonths: z.number(),
  phases: z.array(careerPhaseSchema),
  nodes: z.array(roadmapNodeSchema),
  roles: z.array(intermediateRoleSchema),
  certifications: z.array(certificationItemSchema),
  projects: z.array(projectDetailSchema),
  milestones: z.array(z.string()),
});

export const adaptCareerInputSchema = z.object({
  knownSkillId: z.string().optional(),
  knownSkillName: z.string().optional(),
  updatedHoursPerWeek: z.number().optional(),
  updatedTimelineMonths: z.number().optional(),
  roadmapId: z.string().optional(),
});

export const nodeAdviceInputSchema = z.object({
  nodeId: z.string(),
  targetRole: z.string(),
  nodeName: z.string(),
  whyItMatters: z.string().optional(),
});

export const askAiInputSchema = z.object({
  question: z.string().min(2),
  targetRole: z.string().optional(),
  currentSkill: z.string().optional(),
  context: z.record(z.any()).optional(),
});

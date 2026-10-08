import { GoogleGenAI } from '@google/genai';
import {
  buildCareerRoadmapPrompt,
  buildDynamicAdaptationPrompt,
  buildNodeAdvicePrompt,
  buildResumeAnalysisPrompt,
  buildInterviewEvaluationPrompt,
} from '../prompts/careerPrompts.js';
import {
  geminiRoadmapResponseSchema,
  type generateCareerInputSchema,
} from '../schemas/careerSchemas.js';
import { z } from 'zod';

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

export function getModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export const geminiService = {
  async testConnectivity(): Promise<boolean> {
    try {
      const client = getGeminiClient();
      if (!client) return false;

      const model = getModelName();
      const response = await client.models.generateContent({
        model,
        contents: 'Return {"status": "ok"} in pure JSON.',
        config: {
          responseMimeType: 'application/json',
        },
      });

      return !!(response && response.text && response.text.length > 0);
    } catch (error) {
      console.warn('[Gemini Connectivity Test Failed]:', (error as Error).message);
      return false;
    }
  },

  async generateCareerRoadmap(input: z.infer<typeof generateCareerInputSchema>): Promise<{ data: any; isAiGenerated: boolean }> {
    const client = getGeminiClient();
    const prompt = buildCareerRoadmapPrompt(input);

    if (client) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Gemini] Calling ${getModelName()} for target role: "${input.targetRole}" (Attempt ${attempt})`);
          const response = await client.models.generateContent({
            model: getModelName(),
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });

          const rawText = response.text || '';
          const cleaned = cleanJsonString(rawText);
          const parsed = JSON.parse(cleaned);

          // Validate against schema
          const validated = geminiRoadmapResponseSchema.safeParse(parsed);
          if (validated.success) {
            console.log(`[Gemini] Successfully generated & validated roadmap with ${validated.data.nodes.length} nodes.`);
            return { data: validated.data, isAiGenerated: true };
          } else {
            console.warn(`[Gemini Validation Warning, attempt ${attempt}]:`, validated.error.errors);
            if (attempt === 2) {
              // Return parsed if structural basics exist
              if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
                return { data: parsed, isAiGenerated: true };
              }
            }
          }
        } catch (err) {
          console.error(`[Gemini Generation Error, attempt ${attempt}]:`, (err as Error).message);
          if (attempt === 2) {
            console.warn('[Gemini] Retries exhausted. Falling back to structured generation.');
          }
        }
      }
    } else {
      console.log('[Gemini] No GEMINI_API_KEY configured. Generating deterministic fallback roadmap.');
    }

    // Controlled deterministic generator for offline/demo fallback
    const fallback = generateSmartFallbackRoadmap(input);
    return { data: fallback, isAiGenerated: false };
  },

  async adaptCareerRoadmap(params: {
    targetRole: string;
    knownSkillId?: string;
    knownSkillName?: string;
    updatedHoursPerWeek?: number;
    updatedTimelineMonths?: number;
    existingRoadmap: any;
  }): Promise<{ data: any; isAiGenerated: boolean }> {
    const client = getGeminiClient();
    const prompt = buildDynamicAdaptationPrompt(params);

    if (client) {
      try {
        console.log(`[Gemini] Adapting roadmap for skill: ${params.knownSkillName || params.knownSkillId}`);
        const response = await client.models.generateContent({
          model: getModelName(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const rawText = response.text || '';
        const cleaned = cleanJsonString(rawText);
        const parsed = JSON.parse(cleaned);

        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          return { data: parsed, isAiGenerated: true };
        }
      } catch (err) {
        console.error('[Gemini Adaptation Error]:', (err as Error).message);
      }
    }

    // Local smart adaptation fallback
    const adapted = adaptRoadmapLocally(params);
    return { data: adapted, isAiGenerated: false };
  },

  async getNodeAdvice(params: {
    nodeName: string;
    targetRole: string;
    whyItMatters?: string;
  }): Promise<any> {
    const client = getGeminiClient();
    const prompt = buildNodeAdvicePrompt(params);

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: getModelName(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });
        const rawText = response.text || '';
        const cleaned = cleanJsonString(rawText);
        return JSON.parse(cleaned);
      } catch (err) {
        console.error('[Gemini Node Advice Error]:', (err as Error).message);
      }
    }

    return {
      skillName: params.nodeName,
      weekendProject: {
        title: `Production ${params.nodeName} Deep-Dive Implementation`,
        objective: `Build a concrete mini-service demonstrating end-to-end fluency in ${params.nodeName}.`,
        steps: [
          `Initialize typed project with structured error handling`,
          `Implement core design pattern tailored for ${params.targetRole}`,
          `Add comprehensive unit and integration test coverage`,
          `Deploy with live demo link and documented architecture README`
        ]
      },
      gitHubBlueprint: {
        repoName: `${params.nodeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-production-blueprint`,
        description: `Production-ready showcase of ${params.nodeName} architecture and testing patterns`,
        suggestedFiles: ['src/index.ts', 'src/core/handler.ts', 'tests/unit.test.ts', 'README.md', 'Dockerfile']
      },
      seniorInsight: `In production for ${params.targetRole}, hiring managers look for how you handle failure states, performance bottlenecks, and observability, not just happy-path syntax.`,
      interviewQuestions: [
        {
          question: `How do you handle edge cases and scale with ${params.nodeName}?`,
          seniorAnswer: `Discuss asynchronous backpressure, state synchronization, idempotency, and graceful degradation.`,
          dangerPitfall: `Assuming in-memory state or single-threaded synchronous guarantees.`
        }
      ],
      checklist: [
        `Understand core abstractions and lifecycle`,
        `Proficiency with debugging and profiling tools`,
        `Ability to explain architectural trade-offs in an interview`,
        `Built at least one verifiable project leveraging this skill`,
        `Reviewed official documentation best practices`
      ]
    };
  },

  async askCareerAssistant(params: {
    question: string;
    targetRole?: string;
    currentSkill?: string;
    context?: any;
  }): Promise<string> {
    const client = getGeminiClient();
    const prompt = `You are CareerForge's AI Career Assistant, a senior engineering mentor.
Target Goal: "${params.targetRole || 'Software Engineering'}"
Current Focus Skill: "${params.currentSkill || 'General Roadmap'}"
User Question: "${params.question}"
Context: ${JSON.stringify(params.context || {})}

Provide a direct, inspiring, highly actionable answer without fluff. Focus on pragmatic career velocity, system-level clarity, and practical next steps. Keep to 2-3 concise paragraphs.`;

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: getModelName(),
          contents: prompt,
          config: {
            temperature: 0.5,
          },
        });
        return response.text || 'Keep pushing forward on your roadmap missions. Consistency builds mastery.';
      } catch (err) {
        console.error('[Gemini Ask Assistant Error]:', (err as Error).message);
      }
    }

    return `For ${params.targetRole || 'your target role'}, focus on mastering the architectural primitives behind ${params.currentSkill || 'your current mission'}. Build small, measurable proofs of concept and document your trade-offs in GitHub READMEs. Employers hire engineers who can reason about reliability and system constraints.`;
  },

  async analyzeResume(resumeText: string, targetRole: string): Promise<any> {
    const client = getGeminiClient();
    const prompt = buildResumeAnalysisPrompt(resumeText, targetRole);

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: getModelName(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
        const rawText = response.text || '';
        return JSON.parse(cleanJsonString(rawText));
      } catch (err) {
        console.error('[Gemini Resume Analysis Error]:', (err as Error).message);
      }
    }

    // Heuristic extraction
    const skillsFound: string[] = [];
    const keywords = ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Next.js', 'Redis', 'Kubernetes', 'Java', 'Go'];
    keywords.forEach(kw => {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(resumeText)) {
        skillsFound.push(kw);
      }
    });

    return {
      targetRole,
      alignmentScore: skillsFound.length > 3 ? 72 : 55,
      strongSkills: skillsFound.slice(0, 4),
      missingSkills: ['System Design', 'Cloud Deployment & CI/CD', 'Production Observability'],
      missingKeywords: ['Latency SLA', 'Distributed Ledger', 'Horizontal Scaling', 'Idempotency'],
      strengths: ['Hands-on language fundamentals', 'Demonstrated willingness to build projects'],
      weaknesses: ['Limited metrics-driven impact statements in project descriptions', 'Needs deeper cloud architecture evidence'],
      recommendedAdjustments: `Prioritize the backend architecture and containerized deployment nodes in your CareerForge roadmap to strengthen portfolio alignment for ${targetRole}.`,
      extractedSkills: skillsFound
    };
  },

  async evaluateInterview(params: {
    question: string;
    userAnswer: string;
    targetRole: string;
    category: string;
  }): Promise<any> {
    const client = getGeminiClient();
    const prompt = buildInterviewEvaluationPrompt(params);

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: getModelName(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
        const rawText = response.text || '';
        return JSON.parse(cleanJsonString(rawText));
      } catch (err) {
        console.error('[Gemini Interview Evaluation Error]:', (err as Error).message);
      }
    }

    const wordCount = params.userAnswer.trim().split(/\s+/).length;
    const score = wordCount > 40 ? 82 : (wordCount > 15 ? 68 : 45);

    return {
      score,
      verdict: score >= 80 ? 'Strong' : 'Satisfactory',
      strengths: [
        'Clear direct response to the core question',
        'Demonstrates practical familiarity with underlying concepts'
      ],
      weaknesses: [
        'Could include more specific architectural metrics (latency, caching, failure recovery)',
        'Mention testing or production deployment considerations'
      ],
      suggestions: `Structure your response using the STAR (Situation, Task, Action, Result) format and explicitly name architectural trade-offs.`,
      improvedAnswer: `In production systems for ${params.targetRole}, I would approach this by first defining SLA requirements, choosing appropriate data structures, ensuring transactional consistency, and observing with structured metrics.`,
      followUpQuestion: `How would your proposed solution behave if traffic spiked 10x or if a downstream network partition occurred?`
    };
  }
};

// ====================================================================
// SMART DETERMINISTIC GENERATOR (WHEN RUNNING IN DEMO MODE / NO API KEY)
// ====================================================================
function generateSmartFallbackRoadmap(input: z.infer<typeof generateCareerInputSchema>): any {
  const isFinTech = /fintech|finance|banking|trading|crypto|payment/i.test(`${input.targetRole} ${input.industry}`);
  const isFullStack = /full stack|fullstack|web|developer|engineer/i.test(input.targetRole);

  const prefix = isFinTech ? 'FinTech' : (isFullStack ? 'Full-Stack' : input.targetRole);

  return {
    targetRole: input.targetRole,
    summary: `A reverse-engineered, accelerated career blueprint tailored for becoming a ${input.targetRole} in the ${input.industry} sector. Designed for a ${input.experienceLevel} dedicating ${input.hoursPerWeek} hours/week over ${input.timelineMonths} months.`,
    timelineMonths: input.timelineMonths,
    phases: [
      {
        id: "phase-1",
        title: "Phase 1: Modern Typed Systems & Core Architecture",
        description: "Master modern TypeScript and production full-stack engineering fundamentals.",
        durationWeeks: 6,
        nodeIds: ["node-ts", "node-fe", "node-be"]
      },
      {
        id: "phase-2",
        title: "Phase 2: Relational Modeling & Transaction Integrity",
        description: "Deep dive into PostgreSQL, transaction safety, and API resilience.",
        durationWeeks: 8,
        nodeIds: ["node-db", "node-proj-1", "node-role-junior"]
      },
      {
        id: "phase-3",
        title: "Phase 3: Domain Specialization & Production Scale",
        description: isFinTech 
          ? "Implement double-entry ledgers, idempotency keys, and payment webhooks." 
          : "Scalable system design, asynchronous worker queues, and caching.",
        durationWeeks: 10,
        nodeIds: ["node-domain", "node-proj-capstone", "node-cert", "node-target"]
      }
    ],
    nodes: [
      {
        id: "node-ts",
        name: "TypeScript & Typed Architecture",
        type: "skill",
        category: "Language Foundations",
        level: "beginner",
        estimatedWeeks: 2,
        whyItMatters: `Modern engineering teams building for ${input.targetRole} mandate strict typing to eliminate runtime bugs and enforce domain schemas.`,
        status: "available",
        dependencies: [],
        missions: [
          {
            id: "m-ts-1",
            title: "Strict Type Narrowing & Generics",
            description: "Build robust generic response wrappers and runtime validator schemas.",
            xp: 50,
            estimatedMinutes: 20,
            type: "practice",
            content: {
              instructions: "Implement generic API response models with discriminated unions.",
              quizQuestions: [
                {
                  question: "What is the primary architectural advantage of discriminated unions in TypeScript?",
                  options: [
                    "They allow faster runtime JIT compilation",
                    "They provide compile-time exhaustiveness checking for state machines",
                    "They convert JSON strings to binary buffers automatically",
                    "They replace database migrations"
                  ],
                  correctAnswer: 1,
                  explanation: "Discriminated unions ensure every possible state variant is handled safely at compile time."
                }
              ]
            }
          }
        ],
        resources: [
          {
            title: "Official TypeScript Handbook",
            type: "documentation",
            url: "https://www.typescriptlang.org/docs/",
            description: "Definitive handbook for production TypeScript practices",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "How do you distinguish between 'unknown' and 'any' in TypeScript?",
            sampleAnswer: "'any' turns off type checking completely, whereas 'unknown' is type-safe and forces runtime type checking before performing operations on the value.",
            category: "technical"
          }
        ],
        project: {
          title: "Typed Domain Model Package",
          description: "A standalone zero-dependency library modeling core domain entities with strict runtime Zod parsing.",
          difficulty: "beginner",
          estimatedTime: "6 hours",
          technologies: ["TypeScript", "Zod", "Vitest"],
          features: ["Generic Result<T, E> types", "Immutable domain entities", "Unit test suite"],
          careerRelevance: "Demonstrates production code hygiene in GitHub code reviews.",
          xp: 120
        }
      },
      {
        id: "node-fe",
        name: "React & Resilient State Management",
        type: "skill",
        category: "Frontend",
        level: "intermediate",
        estimatedWeeks: 2.5,
        whyItMatters: "High-performance interactive interfaces require optimized render lifecycles, optimistic UI updates, and atomic state handling.",
        status: "locked",
        dependencies: ["node-ts"],
        missions: [
          {
            id: "m-fe-1",
            title: "Optimistic State Updates & Revalidation",
            description: "Implement zero-latency UI interactions with automatic rollback on server errors.",
            xp: 60,
            estimatedMinutes: 25,
            type: "practice"
          }
        ],
        resources: [
          {
            title: "React Official Documentation",
            type: "documentation",
            url: "https://react.dev",
            description: "Interactive documentation on hooks, reconciliation, and modern patterns",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "Explain the reconciliation algorithm and why keys matter in React lists.",
            sampleAnswer: "React uses keys to identify which items have changed, been added, or removed during virtual DOM diffing, preventing unnecessary DOM mutations and preserving component state.",
            category: "technical"
          }
        ],
        project: {
          title: "Real-Time Financial Dashboard",
          description: "High-frequency dashboard with live websocket charts, data filtering, and optimistic transaction entry.",
          difficulty: "intermediate",
          estimatedTime: "12 hours",
          technologies: ["React", "TypeScript", "Tailwind CSS"],
          features: ["Optimistic UI updates", "Responsive layout", "Mock WebSocket data feed"],
          careerRelevance: "Essential portfolio piece showing complex state manipulation.",
          xp: 180
        }
      },
      {
        id: "node-be",
        name: "Node.js, Express & REST/RPC Architecture",
        type: "skill",
        category: "Backend",
        level: "intermediate",
        estimatedWeeks: 2.5,
        whyItMatters: `Backend services for ${input.targetRole} must process concurrent requests gracefully with middleware pipelining and structured logging.`,
        status: "locked",
        dependencies: ["node-ts"],
        missions: [
          {
            id: "m-be-1",
            title: "Middleware Pipelines & Centralized Error Handling",
            description: "Construct clean layered architectures with Controller-Service-Repository separation.",
            xp: 60,
            estimatedMinutes: 25,
            type: "practice"
          }
        ],
        resources: [
          {
            title: "Node.js Official Documentation",
            type: "documentation",
            url: "https://nodejs.org/docs/latest/api/",
            description: "Comprehensive runtime API documentation",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "How does the Node.js event loop handle CPU-bound vs I/O-bound tasks?",
            sampleAnswer: "Node.js runs I/O asynchronously via libuv on thread pools without blocking the main event loop, while intensive CPU-bound tasks block the loop unless offloaded to worker threads.",
            category: "technical"
          }
        ]
      },
      {
        id: "node-db",
        name: "PostgreSQL & Transaction Integrity",
        type: "skill",
        category: "Database & Persistence",
        level: "intermediate",
        estimatedWeeks: 2,
        whyItMatters: isFinTech 
          ? "Financial systems require strict ACID compliance, serializable transaction isolation, and row-level locking to avoid double-spend anomalies."
          : "Relational modeling, indexing strategies, and database migrations are core backend requirements.",
        status: "locked",
        dependencies: ["node-be"],
        missions: [
          {
            id: "m-db-1",
            title: "ACID Transactions & Row Locking",
            description: "Implement SELECT FOR UPDATE and optimistic concurrency checks.",
            xp: 75,
            estimatedMinutes: 30,
            type: "practice"
          }
        ],
        resources: [
          {
            title: "PostgreSQL Documentation",
            type: "documentation",
            url: "https://www.postgresql.org/docs/",
            description: "Official PostgreSQL manual on transactions and concurrency",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "What is an idempotency key and how do you implement it with PostgreSQL?",
            sampleAnswer: "An idempotency key is a unique client-generated token stored with an expiration window and unique constraint in the database to ensure duplicate network requests do not result in repeated executions.",
            category: "system_design"
          }
        ]
      },
      {
        id: "node-proj-1",
        name: "Portfolio Project: Multi-Tenant Ledger API",
        type: "project",
        category: "Portfolio Projects",
        level: "intermediate",
        estimatedWeeks: 3,
        whyItMatters: "Proves that you can architect and deliver a complete end-to-end service with clean database schemas and automated tests.",
        status: "locked",
        dependencies: ["node-fe", "node-db"],
        missions: [
          {
            id: "m-p1-1",
            title: "Deploy API & Setup GitHub CI",
            description: "Publish your working repository with automated linting, test suites, and Dockerfile.",
            xp: 150,
            estimatedMinutes: 45,
            type: "build"
          }
        ],
        resources: [
          {
            title: "GitHub Actions Documentation",
            type: "documentation",
            url: "https://docs.github.com/en/actions",
            description: "CI/CD setup guidelines",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "Walk me through how you structured your database schema for multi-tenant isolation.",
            sampleAnswer: "I utilized foreign key tenant_id partitioning with PostgreSQL Row Level Security (RLS) policies to guarantee zero cross-tenant data leakage.",
            category: "scenario"
          }
        ],
        project: {
          title: "Multi-Tenant Transaction & Ledger API",
          description: "Production API featuring JWT authentication, ACID double-entry bookkeeping, and transaction audit trails.",
          difficulty: "intermediate",
          estimatedTime: "20 hours",
          technologies: ["Node.js", "Express", "TypeScript", "PostgreSQL", "React"],
          features: ["Idempotent API endpoints", "Double-entry accounting logic", "Interactive transaction browser UI"],
          careerRelevance: "Directly showcases the core technical skills needed for FinTech and high-growth SaaS engineering teams.",
          xp: 250
        }
      },
      {
        id: "node-role-junior",
        name: "Intermediate Milestone: Junior / Associate Engineer",
        type: "intermediate_role",
        category: "Career Milestones",
        level: "intermediate",
        estimatedWeeks: 1,
        whyItMatters: "At this juncture, your portfolio and technical comprehension meet requirements for junior developer and paid internship opportunities.",
        status: "locked",
        dependencies: ["node-proj-1"],
        missions: [],
        resources: [],
        interviewQuestions: []
      },
      {
        id: "node-domain",
        name: isFinTech ? "FinTech Protocols & Payment Integrations" : "Distributed Systems & Cloud Caching",
        type: "skill",
        category: isFinTech ? "FinTech Domain" : "Distributed Systems",
        level: "advanced",
        estimatedWeeks: 3,
        whyItMatters: isFinTech 
          ? "Understanding webhook signature verification, PCI-DSS compliance boundaries, and banking rails distinguishes serious candidates from generic web devs."
          : "Distributed caching with Redis, message brokers, and resilient microservice communication.",
        status: "locked",
        dependencies: ["node-proj-1"],
        missions: [
          {
            id: "m-dom-1",
            title: "Secure Webhook Event Verification",
            description: "Implement HMAC-SHA256 signature verification and replay attack prevention.",
            xp: 80,
            estimatedMinutes: 30,
            type: "practice"
          }
        ],
        resources: [
          {
            title: "Stripe Developer Documentation",
            type: "documentation",
            url: "https://docs.stripe.com/webhooks",
            description: "Gold standard reference for payment webhook security",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "How do you defend webhook consumers against replay attacks?",
            sampleAnswer: "By including a timestamp inside the signed header payload, validating the timestamp falls within a 5-minute tolerance window, and storing event IDs to reject duplicates.",
            category: "technical"
          }
        ]
      },
      {
        id: "node-cert",
        name: "AWS Certified Developer / Cloud Practitioner",
        type: "certification",
        category: "Cloud Credentials",
        level: "intermediate",
        estimatedWeeks: 3,
        whyItMatters: "Industry-recognized credential validating your ability to build and deploy resilient applications in cloud environments.",
        status: "locked",
        dependencies: ["node-domain"],
        missions: [],
        resources: [
          {
            title: "AWS Certification Portal",
            type: "documentation",
            url: "https://aws.amazon.com/certification/",
            description: "Official AWS exam guides and whitepapers",
            isVerified: true
          }
        ],
        interviewQuestions: []
      },
      {
        id: "node-proj-capstone",
        name: "Capstone: Production Scalable Platform",
        type: "project",
        category: "Portfolio Projects",
        level: "advanced",
        estimatedWeeks: 4,
        whyItMatters: "The centerpiece of your resume: an enterprise-grade full stack deployment solving a genuine domain problem with real-time telemetry.",
        status: "locked",
        dependencies: ["node-domain"],
        missions: [
          {
            id: "m-cap-1",
            title: "System Performance Profiling & Load Testing",
            description: "Simulate concurrent user traffic and profile latency percentiles (p95, p99).",
            xp: 200,
            estimatedMinutes: 60,
            type: "build"
          }
        ],
        resources: [
          {
            title: "System Design Primer",
            type: "documentation",
            url: "https://github.com/donnemartin/system-design-primer",
            description: "Comprehensive guide to scalable architecture",
            isVerified: true
          }
        ],
        interviewQuestions: [
          {
            question: "How did your capstone platform handle peak write throughput under database lock contention?",
            sampleAnswer: "We introduced in-memory Redis queuing for ingest with batch inserts into PostgreSQL, decreasing transaction lock duration by 70%.",
            category: "scenario"
          }
        ],
        project: {
          title: "Production Financial Analytics & Real-Time Settlement Engine",
          description: "End-to-end full stack platform featuring real-time transaction streaming, distributed audit logs, and analytics visualization.",
          difficulty: "advanced",
          estimatedTime: "35 hours",
          technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker"],
          features: ["Real-time transaction feed", "Replay protection", "Automated reconciliation", "Interactive dashboard"],
          careerRelevance: "Definitive evidence of production readiness for senior hiring managers.",
          xp: 400
        }
      },
      {
        id: "node-target",
        name: `Target Career: ${input.targetRole}`,
        type: "target_role",
        category: "Final Destination",
        level: "advanced",
        estimatedWeeks: 1,
        whyItMatters: `You have acquired verified practical competencies, built two production-grade portfolio projects, and practiced targeted interview challenges to step into ${input.targetRole}.`,
        status: "locked",
        dependencies: ["node-proj-capstone", "node-cert"],
        missions: [],
        resources: [],
        interviewQuestions: []
      }
    ],
    roles: [
      {
        title: "Junior Full-Stack Engineer / Intern",
        description: "Focuses on delivering well-tested user stories, fixing bugs, and collaborating on feature branches under senior code review.",
        typicalTimeframe: "Month 3 - 5",
        prerequisites: ["TypeScript & Typed Architecture", "Node.js, Express & REST/RPC Architecture"]
      },
      {
        title: input.targetRole,
        description: "Autonomous ownership of full-stack domain features, architectural trade-offs, and production deployments.",
        typicalTimeframe: `Month ${input.timelineMonths}`,
        prerequisites: ["Capstone: Production Scalable Platform", isFinTech ? "FinTech Protocols & Payment Integrations" : "Distributed Systems & Cloud Caching"]
      }
    ],
    certifications: [
      {
        name: "AWS Certified Developer - Associate",
        issuer: "Amazon Web Services",
        relevance: "Demonstrates core understanding of cloud infrastructure, IAM security, and serverless compute.",
        difficulty: "Moderate",
        estimatedPrepWeeks: 4
      }
    ],
    projects: [
      {
        title: "Multi-Tenant Transaction & Ledger API",
        description: "Production API with idempotent endpoints, ACID transaction accounting, and unit test suites.",
        difficulty: "intermediate",
        estimatedTime: "20 hours",
        technologies: ["Node.js", "Express", "TypeScript", "PostgreSQL"],
        features: ["Double-entry ledger", "Idempotency key enforcement", "Dockerized DB setup"],
        careerRelevance: "Validates reliable backend design",
        xp: 250
      },
      {
        title: "Production Financial Analytics & Real-Time Settlement Engine",
        description: "Full stack capstone platform with real-time websocket updates, audit logs, and interactive analytics.",
        difficulty: "advanced",
        estimatedTime: "35 hours",
        technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
        features: ["Live analytics stream", "Reconciliation engine", "Micro-service architecture"],
        careerRelevance: "Demonstrates job-ready engineering maturity",
        xp: 400
      }
    ],
    milestones: [
      "Milestone 1: Complete TypeScript & Full-Stack Fundamentals",
      "Milestone 2: Ship Multi-Tenant Transaction API with 85%+ Test Coverage",
      "Milestone 3: Successfully Deploy Capstone Portfolio Platform to Cloud",
      "Milestone 4: Interview Ready & Portfolio Live"
    ]
  };
}

function adaptRoadmapLocally(params: {
  targetRole: string;
  knownSkillId?: string;
  knownSkillName?: string;
  updatedHoursPerWeek?: number;
  updatedTimelineMonths?: number;
  existingRoadmap: any;
}): any {
  const rm = JSON.parse(JSON.stringify(params.existingRoadmap));
  const skillId = params.knownSkillId;

  if (skillId) {
    const node = rm.nodes.find((n: any) => n.id === skillId);
    if (node) {
      node.status = 'completed';
      if (node.missions) {
        node.missions.forEach((m: any) => { m.isCompleted = true; });
      }
    }

    // Unlock dependent nodes
    rm.nodes.forEach((candidate: any) => {
      if (candidate.status === 'locked' && candidate.dependencies) {
        const allCompleted = candidate.dependencies.every((depId: string) => {
          const depNode = rm.nodes.find((n: any) => n.id === depId);
          return depNode && depNode.status === 'completed';
        });
        if (allCompleted) {
          candidate.status = 'available';
        }
      }
    });

    // Elevate the path: if TypeScript or React was already known, suggest advanced architecture
    if (node && /typescript|react/i.test(node.name)) {
      const advancedNodeId = `adv-${node.id}`;
      if (!rm.nodes.find((n: any) => n.id === advancedNodeId)) {
        rm.nodes.splice(1, 0, {
          id: advancedNodeId,
          name: `Advanced Architecture & Performance for ${node.name}`,
          type: "skill",
          category: "Advanced Engineering",
          level: "advanced",
          estimatedWeeks: 1.5,
          whyItMatters: `Because you already know ${node.name}, this module elevates your skillset to Staff/Principal patterns: memory leak profiling, micro-frontends, and AST codemods.`,
          status: "available",
          dependencies: [node.id],
          missions: [
            {
              id: `m-${advancedNodeId}`,
              title: "Performance Profiling & Bundle Splitting",
              description: "Audit render bottlenecks and optimize critical rendering paths.",
              xp: 75,
              estimatedMinutes: 25,
              type: "practice"
            }
          ],
          resources: [
            {
              title: "Advanced Web Performance Guide",
              type: "documentation",
              url: "https://web.dev/performance/",
              description: "Core Web Vitals and runtime optimization",
              isVerified: true
            }
          ],
          interviewQuestions: [
            {
              question: "How do you diagnose and eliminate unnecessary re-renders in deep component hierarchies?",
              sampleAnswer: "Using the React DevTools Profiler to identify commit phases, memoizing expensive subtrees with useMemo, and separating context slices to avoid cascade invalidation.",
              category: "technical"
            }
          ]
        });
      }
    }
  }

  if (params.updatedTimelineMonths) {
    rm.timelineMonths = params.updatedTimelineMonths;
  }

  rm.completedSkills = rm.nodes.filter((n: any) => n.status === 'completed').length;
  rm.totalSkills = rm.nodes.length;
  rm.updatedAt = new Date().toISOString();
  return rm;
}

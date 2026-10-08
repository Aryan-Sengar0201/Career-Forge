const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  body?: any;
}

export const api = {
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('careerforge_token');
    const userJson = localStorage.getItem('careerforge_user');

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.id) headers['x-user-id'] = user.id;
        if (user.email) headers['x-user-email'] = user.email;
      } catch (e) {
        // Ignored
      }
    }

    return headers;
  },

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...this.getAuthHeaders(),
      ...(options.headers as Record<string, string> || {}),
    };

    let body = options.body;
    if (body && !(body instanceof FormData) && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    if (!response.ok) {
      let errMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errMessage = errorData.message || errorData.error || errMessage;
      } catch {
        // Fallback
      }
      throw new Error(errMessage);
    }

    return response.json();
  },

  // Health Check
  async getHealth(): Promise<{ status: string; aiConnected: boolean; model: string }> {
    try {
      return await this.request('/api/health');
    } catch {
      return {
        status: 'ok',
        aiConnected: false,
        model: 'gemini-2.5-flash (Demo Mode)',
      };
    }
  },

  // Career Roadmap Generation
  async generateCareerRoadmap(input: {
    targetRole: string;
    industry?: string;
    companyType?: string;
    location?: string;
    experienceLevel: string;
    currentSkills: string[];
    hoursPerWeek: number;
    timelineMonths: number;
  }): Promise<{ success: boolean; roadmap: any; isAiGenerated: boolean }> {
    try {
      const res = await this.request<{ success: boolean; roadmap: any; isAiGenerated: boolean }>('/api/career/generate', {
        method: 'POST',
        body: input,
      });
      if (res?.roadmap) {
        localStorage.setItem('careerforge_local_roadmap', JSON.stringify(res.roadmap));
      }
      return res;
    } catch {
      // Robust client-side fallback for static cloud deployments
      const fallback = generateClientRoadmap(input);
      localStorage.setItem('careerforge_local_roadmap', JSON.stringify(fallback));
      return {
        success: true,
        roadmap: fallback,
        isAiGenerated: false,
      };
    }
  },

  async getCurrentRoadmap(): Promise<{ success: boolean; roadmap: any }> {
    try {
      const res = await this.request<{ success: boolean; roadmap: any }>('/api/career/current');
      if (res?.roadmap) {
        localStorage.setItem('careerforge_local_roadmap', JSON.stringify(res.roadmap));
      }
      return res;
    } catch {
      const stored = localStorage.getItem('careerforge_local_roadmap');
      if (stored) {
        return { success: true, roadmap: JSON.parse(stored) };
      }
      // Generate default
      const defaultRm = generateClientRoadmap({
        targetRole: 'Full Stack Developer at a FinTech startup',
        industry: 'FinTech',
        experienceLevel: 'Beginner',
        currentSkills: ['Python'],
        hoursPerWeek: 10,
        timelineMonths: 6,
      });
      localStorage.setItem('careerforge_local_roadmap', JSON.stringify(defaultRm));
      return { success: true, roadmap: defaultRm };
    }
  },

  async adaptCareerRoadmap(data: {
    knownSkillId?: string;
    knownSkillName?: string;
    updatedHoursPerWeek?: number;
    updatedTimelineMonths?: number;
  }): Promise<{ success: boolean; roadmap: any; isAiGenerated: boolean }> {
    try {
      const res = await this.request<{ success: boolean; roadmap: any; isAiGenerated: boolean }>('/api/career/adapt', {
        method: 'POST',
        body: data,
      });
      if (res?.roadmap) {
        localStorage.setItem('careerforge_local_roadmap', JSON.stringify(res.roadmap));
      }
      return res;
    } catch {
      const stored = localStorage.getItem('careerforge_local_roadmap');
      let rm = stored ? JSON.parse(stored) : generateClientRoadmap({
        targetRole: 'Full Stack Developer at a FinTech startup',
        industry: 'FinTech',
        experienceLevel: 'Beginner',
        currentSkills: ['Python'],
        hoursPerWeek: 10,
        timelineMonths: 6,
      });

      if (data.knownSkillId) {
        const node = rm.nodes.find((n: any) => n.id === data.knownSkillId);
        if (node) {
          node.status = 'completed';
          if (node.missions) node.missions.forEach((m: any) => { m.isCompleted = true; });
        }
        // Unlock dependent
        rm.nodes.forEach((c: any) => {
          if (c.status === 'locked' && c.dependencies) {
            const allDone = c.dependencies.every((depId: string) => {
              const depNode = rm.nodes.find((n: any) => n.id === depId);
              return depNode && depNode.status === 'completed';
            });
            if (allDone) c.status = 'available';
          }
        });

        // Inject Advanced Architecture pattern
        if (node && !rm.nodes.some((n: any) => n.id === `adv-${node.id}`)) {
          rm.nodes.splice(1, 0, {
            id: `adv-${node.id}`,
            name: `Advanced Architecture & Performance for ${node.name}`,
            type: 'skill',
            category: 'Advanced Systems',
            level: 'advanced',
            estimatedWeeks: 1.5,
            whyItMatters: `Elevates your practical knowledge of ${node.name} to Staff/Principal patterns: memory leak profiling, zero-downtime schemas, and concurrency management.`,
            status: 'available',
            dependencies: [node.id],
            missions: [
              {
                id: `m-adv-${node.id}`,
                title: 'High-Throughput Concurrency Profiling',
                description: 'Profile event loop bottlenecks and eliminate resource contention.',
                xp: 75,
                estimatedMinutes: 25,
                type: 'practice',
              }
            ],
            resources: [],
            interviewQuestions: []
          });
        }
      }

      if (data.updatedTimelineMonths) {
        rm.timelineMonths = data.updatedTimelineMonths;
      }
      rm.completedSkills = rm.nodes.filter((n: any) => n.status === 'completed').length;
      rm.totalSkills = rm.nodes.length;
      localStorage.setItem('careerforge_local_roadmap', JSON.stringify(rm));
      return { success: true, roadmap: rm, isAiGenerated: false };
    }
  },

  async getNodeAdvice(data: {
    nodeId: string;
    nodeName: string;
    targetRole: string;
    whyItMatters?: string;
  }): Promise<{ success: boolean; advice: any }> {
    try {
      return await this.request('/api/career/node-advice', {
        method: 'POST',
        body: data,
      });
    } catch {
      return {
        success: true,
        advice: {
          skillName: data.nodeName,
          weekendProject: {
            title: `Production ${data.nodeName} Deep-Dive`,
            objective: `Build a concrete mini-service demonstrating end-to-end fluency in ${data.nodeName}.`,
            steps: [
              'Initialize typed project with structured error handling',
              'Implement core architectural pattern tailored for your target role',
              'Add comprehensive unit test coverage and Dockerfile',
              'Deploy with live demo link and documented trade-offs',
            ]
          },
          gitHubBlueprint: {
            repoName: `${data.nodeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-production-blueprint`,
            description: `Showcase of ${data.nodeName} architecture and testing patterns`,
            suggestedFiles: ['src/index.ts', 'src/core/handler.ts', 'tests/unit.test.ts', 'README.md']
          },
          seniorInsight: 'Hiring managers look for how you handle failure states, latency bottlenecks, and observability, not just syntax.',
          checklist: [
            'Understand core abstractions and lifecycle',
            'Proficiency with debugging and profiling tools',
            'Ability to explain architectural trade-offs in an interview',
            'Built at least one verifiable project leveraging this skill',
          ]
        }
      };
    }
  },

  async askCareerAssistant(data: {
    question: string;
    targetRole?: string;
    currentSkill?: string;
    context?: any;
  }): Promise<{ success: boolean; answer: string }> {
    try {
      return await this.request('/api/career/ask', {
        method: 'POST',
        body: data,
      });
    } catch {
      return {
        success: true,
        answer: `For ${data.targetRole || 'your target role'}, focus on mastering the architectural primitives behind ${data.currentSkill || 'your current mission'}. Build small, measurable proofs of concept and document your trade-offs in GitHub READMEs. Employers hire engineers who can reason about reliability and system constraints.`,
      };
    }
  },

  async updateNodeStatus(data: {
    roadmapId: string;
    nodeId: string;
    status: string;
  }): Promise<{ success: boolean; roadmap: any }> {
    try {
      return await this.request('/api/career/node-status', {
        method: 'PATCH',
        body: data,
      });
    } catch {
      const stored = localStorage.getItem('careerforge_local_roadmap');
      if (stored) {
        const rm = JSON.parse(stored);
        const node = rm.nodes.find((n: any) => n.id === data.nodeId);
        if (node) node.status = data.status;
        localStorage.setItem('careerforge_local_roadmap', JSON.stringify(rm));
        return { success: true, roadmap: rm };
      }
      return { success: false, roadmap: null };
    }
  },

  // Learning & Missions
  async completeMission(missionId: string): Promise<{ success: boolean; xpGained: number; profile: any; readiness: any }> {
    try {
      return await this.request(`/api/missions/${missionId}/complete`, {
        method: 'POST',
      });
    } catch {
      const userStr = localStorage.getItem('careerforge_user');
      const user = userStr ? JSON.parse(userStr) : { xp: 100, level: 1, streak: 1 };
      user.xp = (user.xp || 0) + 50;
      user.level = Math.floor(user.xp / 200) + 1;
      localStorage.setItem('careerforge_user', JSON.stringify(user));

      const stored = localStorage.getItem('careerforge_local_roadmap');
      if (stored) {
        const rm = JSON.parse(stored);
        for (const n of rm.nodes) {
          const m = n.missions?.find((x: any) => x.id === missionId);
          if (m) {
            m.isCompleted = true;
            if (n.missions.every((x: any) => x.isCompleted)) n.status = 'completed';
            break;
          }
        }
        localStorage.setItem('careerforge_local_roadmap', JSON.stringify(rm));
      }

      return {
        success: true,
        xpGained: 50,
        profile: user,
        readiness: { overallScore: 72, skillsScore: 75, projectsScore: 65, interviewScore: 60, resumeScore: 70 },
      };
    }
  },

  async submitQuiz(data: {
    nodeId: string;
    topic: string;
    score: number;
    totalQuestions: number;
    answers: any[];
  }): Promise<{ success: boolean; xpAwarded: number; profile: any }> {
    try {
      return await this.request('/api/quiz/submit', {
        method: 'POST',
        body: data,
      });
    } catch {
      return { success: true, xpAwarded: 40, profile: null };
    }
  },

  async getProgress(): Promise<{ success: boolean; profile: any; readiness: any; activeRoadmap: any }> {
    try {
      return await this.request('/api/progress');
    } catch {
      const userStr = localStorage.getItem('careerforge_user');
      const user = userStr ? JSON.parse(userStr) : { xp: 120, level: 1, streak: 1, fullName: 'Explorer' };
      const stored = localStorage.getItem('careerforge_local_roadmap');
      const rm = stored ? JSON.parse(stored) : null;
      return {
        success: true,
        profile: user,
        readiness: {
          overallScore: 68,
          skillsScore: 72,
          projectsScore: 60,
          interviewScore: 55,
          resumeScore: 70,
        },
        activeRoadmap: rm,
      };
    }
  },

  async getReadiness(): Promise<{ success: boolean; readiness: any }> {
    try {
      return await this.request('/api/readiness');
    } catch {
      return {
        success: true,
        readiness: {
          overallScore: 68,
          skillsScore: 72,
          projectsScore: 60,
          interviewScore: 55,
          resumeScore: 70,
        },
      };
    }
  },

  // Resume
  async analyzeResume(data: { resumeText?: string; targetRole: string; file?: File }): Promise<{ success: boolean; analysis: any }> {
    try {
      if (data.file) {
        const formData = new FormData();
        formData.append('resume', data.file);
        formData.append('targetRole', data.targetRole);
        return await this.request('/api/resume/analyze', {
          method: 'POST',
          body: formData,
        });
      }
      return await this.request('/api/resume/analyze', {
        method: 'POST',
        body: data,
      });
    } catch {
      const text = data.resumeText || '';
      const skillsFound: string[] = [];
      ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL'].forEach(kw => {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) skillsFound.push(kw);
      });
      return {
        success: true,
        analysis: {
          targetRole: data.targetRole,
          alignmentScore: skillsFound.length > 2 ? 74 : 58,
          strongSkills: skillsFound.length > 0 ? skillsFound : ['JavaScript', 'HTML/CSS', 'Python'],
          missingSkills: ['System Design', 'Cloud Deployment & CI/CD', 'Production Observability'],
          missingKeywords: ['Latency SLA', 'Distributed Ledger', 'Horizontal Scaling', 'Idempotency'],
          recommendedAdjustments: `Prioritize the backend architecture and containerized deployment nodes in your roadmap to strengthen portfolio alignment for ${data.targetRole}.`,
        }
      };
    }
  },

  // Interview
  async startInterview(data: { targetRole: string; category?: string }): Promise<{ success: boolean; targetRole: string; questions: any[] }> {
    try {
      return await this.request('/api/interview/start', {
        method: 'POST',
        body: data,
      });
    } catch {
      return {
        success: true,
        targetRole: data.targetRole,
        questions: [
          {
            id: 'q-1',
            category: 'technical',
            question: `In a production system for a ${data.targetRole}, how do you ensure zero-downtime database schema migrations with backward compatibility?`,
          },
          {
            id: 'q-2',
            category: 'scenario',
            question: 'Your microservice is experiencing sporadic 504 Gateway Timeouts under sudden traffic spikes. Walk me through your triage and architectural remediation steps.',
          },
          {
            id: 'q-3',
            category: 'system_design',
            question: 'Design an idempotent payment processing webhook pipeline that prevents duplicate charges even if the external gateway delivers duplicate events.',
          }
        ]
      };
    }
  },

  async evaluateInterview(data: {
    question: string;
    userAnswer: string;
    targetRole: string;
    category: string;
  }): Promise<{ success: boolean; evaluation: any; xpAwarded: number }> {
    try {
      return await this.request('/api/interview/evaluate', {
        method: 'POST',
        body: data,
      });
    } catch {
      const words = data.userAnswer.trim().split(/\s+/).length;
      const score = words > 30 ? 84 : 70;
      return {
        success: true,
        evaluation: {
          score,
          verdict: score >= 80 ? 'Strong' : 'Satisfactory',
          suggestions: 'Structure your response using the STAR format and explicitly state latency and data consistency trade-offs.',
          improvedAnswer: `In production systems for ${data.targetRole}, I would approach this by defining SLA targets, isolating state mutations via ACID transactions, and ensuring idempotent event replay.`,
          followUpQuestion: 'How would your solution handle a partition between the caching layer and primary database replica?',
        },
        xpAwarded: 40,
      };
    }
  },

  async syncProfile(user: { id: string; email: string; fullName: string }): Promise<{ success: boolean; profile: any }> {
    try {
      return await this.request('/api/auth/sync-profile', {
        method: 'POST',
        body: user,
      });
    } catch {
      return { success: true, profile: user };
    }
  }
};

function generateClientRoadmap(input: any) {
  return {
    id: `rm-${Date.now()}`,
    targetRole: input.targetRole,
    summary: `A reverse-engineered, accelerated career blueprint tailored for becoming a ${input.targetRole} in the ${input.industry || 'Technology'} sector. Designed for a ${input.experienceLevel} dedicating ${input.hoursPerWeek} hours/week over ${input.timelineMonths} months.`,
    timelineMonths: input.timelineMonths || 6,
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
        description: "Double-entry ledgers, idempotency keys, and payment webhooks.",
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
        whyItMatters: "Financial systems require strict ACID compliance, serializable transaction isolation, and row-level locking to avoid double-spend anomalies.",
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
        name: "FinTech Protocols & Payment Integrations",
        type: "skill",
        category: "FinTech Domain",
        level: "advanced",
        estimatedWeeks: 3,
        whyItMatters: "Understanding webhook signature verification, PCI-DSS compliance boundaries, and banking rails distinguishes serious candidates from generic web devs.",
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
        typicalTimeframe: `Month ${input.timelineMonths || 6}`,
        prerequisites: ["Capstone: Production Scalable Platform", "FinTech Protocols & Payment Integrations"]
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

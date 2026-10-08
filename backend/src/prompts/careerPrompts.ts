export function buildCareerRoadmapPrompt(input: {
  targetRole: string;
  industry?: string;
  companyType?: string;
  location?: string;
  experienceLevel: string;
  currentSkills: string[];
  hoursPerWeek: number;
  timelineMonths: number;
}): string {
  return `You are CareerForge's Principal AI Career Architect and Staff Engineering Director.
Your task is to REVERSE-ENGINEER a realistic, highly personalized, rigorous career path for a student/professional aiming for their dream role.

TARGET GOAL:
- Target Role: "${input.targetRole}"
- Target Industry: "${input.industry || 'Technology'}"
- Target Company Profile: "${input.companyType || 'High-growth startup or tech firm'}"
- Target Location: "${input.location || 'Global'}"

CANDIDATE BACKGROUND:
- Current Experience Level: ${input.experienceLevel}
- Known Skills & Experience: ${input.currentSkills.length > 0 ? input.currentSkills.join(', ') : 'None specified'}
- Available Commitment: ${input.hoursPerWeek} hours/week
- Target Timeline: ${input.timelineMonths} months

REVERSE-ENGINEERING METHODOLOGY:
1. Begin at the target role ("Where you are going"). Identify the non-negotiable architectural, technical, and domain proficiencies required in production.
2. Skill-Gap Analysis: Exclude or build upon their already known skills (${input.currentSkills.join(', ')}). Never recommend beginner basics of a skill they already know; elevate them to production-grade proficiency.
3. Realistic Timeline Calculation: ${input.hoursPerWeek} hrs/week over ${input.timelineMonths} months = ~${input.hoursPerWeek * 4 * input.timelineMonths} total study hours. Keep the path realistic and focused.
4. Construct a Directed Acyclic Graph (DAG) of 8 to 14 discrete roadmap nodes:
   - Node Types allowed: 'skill', 'project', 'intermediate_role', 'certification', 'milestone', 'target_role'.
   - The first accessible node(s) should have status 'available' (dependencies empty) or 'in_progress'. All subsequent dependent nodes should have status 'locked'.
   - Dependencies MUST contain exact 'id's of predecessor nodes.
5. Provide actionable missions and concrete projects:
   - Concrete project matching the exact industry (e.g. if FinTech: "High-Throughput Financial Ledger & Double-Entry Accounting Service" with idempotency keys, ACID transactions, and interactive React analytics dashboard).
   - Authoritative resources (use real, official documentation URLs such as https://react.dev, https://developer.mozilla.org, https://nodejs.org/docs, https://postgresql.org/docs).
   - Targeted technical interview questions with deep architectural answers.

OUTPUT STRICTLY VALID JSON matching this exact schema:
{
  "targetRole": "${input.targetRole}",
  "summary": "Crisp executive summary analyzing the candidate's journey from their current level to the target role.",
  "timelineMonths": ${input.timelineMonths},
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase Title (e.g. Modern Full-Stack Fundamentals & Typed Architectures)",
      "description": "Concrete summary of what this phase accomplishes",
      "durationWeeks": 6,
      "nodeIds": ["node-1", "node-2"]
    }
  ],
  "nodes": [
    {
      "id": "node-1",
      "name": "Node/Skill Title",
      "type": "skill",
      "category": "Frontend | Backend | Systems | Security | FinTech Domain | Cloud",
      "level": "beginner | intermediate | advanced",
      "estimatedWeeks": 2,
      "whyItMatters": "Deep technical explanation of why this skill is vital for this exact target role and industry.",
      "status": "available",
      "dependencies": [],
      "missions": [
        {
          "id": "m-1",
          "title": "Mission Name (e.g. Master Concurrency & Optimistic Locking)",
          "description": "Clear practical task description",
          "xp": 50,
          "estimatedMinutes": 25,
          "type": "practice",
          "content": {
            "instructions": "Step by step execution details",
            "quizQuestions": [
              {
                "question": "Realistic scenario question testing deep knowledge?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 1,
                "explanation": "Why Option B is the right engineering approach."
              }
            ]
          }
        }
      ],
      "resources": [
        {
          "title": "Official Documentation",
          "type": "documentation",
          "url": "https://developer.mozilla.org",
          "description": "Authoritative reference",
          "isVerified": true
        }
      ],
      "interviewQuestions": [
        {
          "question": "Realistic technical interview question",
          "sampleAnswer": "Comprehensive engineering answer covering trade-offs",
          "category": "technical"
        }
      ],
      "project": {
        "title": "Industry-grade Project Title",
        "description": "Description of what to build and why it demonstrates production readiness",
        "difficulty": "intermediate",
        "estimatedTime": "15 hours",
        "technologies": ["TypeScript", "React", "PostgreSQL"],
        "features": ["Feature 1", "Feature 2", "Feature 3"],
        "careerRelevance": "Why hiring managers will be impressed by this project on your portfolio",
        "xp": 150
      }
    }
  ],
  "roles": [
    {
      "title": "Intermediate Role Title (e.g. Junior Backend Engineer)",
      "description": "Realistic intermediate stepping stone role",
      "typicalTimeframe": "Month 4 - 6",
      "prerequisites": ["node-1", "node-2"]
    }
  ],
  "certifications": [
    {
      "name": "Relevant Industry Certification (e.g. AWS Certified Developer)",
      "issuer": "Amazon Web Services",
      "relevance": "Direct value for FinTech cloud compliance",
      "difficulty": "Moderate",
      "estimatedPrepWeeks": 4
    }
  ],
  "projects": [
    {
      "title": "Capstone Industry Project",
      "description": "End-to-end full stack deployment ready project",
      "difficulty": "advanced",
      "estimatedTime": "30 hours",
      "technologies": ["Node.js", "Express", "TypeScript", "PostgreSQL", "React"],
      "features": ["Double-entry ledger", "Webhook event bus", "Real-time SSE dashboard"],
      "careerRelevance": "Demonstrates domain expertise for FinTech engineering roles",
      "xp": 300
    }
  ],
  "milestones": [
    "Milestone 1: Production-ready API architecture with idempotent transactions",
    "Milestone 2: First deployed full-stack portfolio application",
    "Milestone 3: Technical interview mock readiness"
  ]
}

DO NOT include any markdown codeblocks or text outside of the JSON object. Output pure JSON.`;
}

export function buildDynamicAdaptationPrompt(params: {
  targetRole: string;
  knownSkillId?: string;
  knownSkillName?: string;
  updatedHoursPerWeek?: number;
  updatedTimelineMonths?: number;
  existingRoadmap: any;
}): string {
  return `You are CareerForge's AI Career Architect.
The candidate is dynamically updating their learning path.

EVENT DETAILS:
- Target Role: "${params.targetRole}"
- Action Taken: Candidate marked skill "${params.knownSkillName || params.knownSkillId}" as "I Already Know This".
- Updated Availability: ${params.updatedHoursPerWeek ? `${params.updatedHoursPerWeek} hrs/week` : 'Unchanged'}
- Updated Timeline: ${params.updatedTimelineMonths ? `${params.updatedTimelineMonths} months` : 'Unchanged'}

EXISTING ROADMAP SUMMARY:
- Current Nodes: ${params.existingRoadmap.nodes?.map((n: any) => `${n.id}: ${n.name} (status: ${n.status})`).join(', ')}

ADAPTATION RULES (CRITICAL PS1 REQUIREMENT):
1. Do NOT simply delete or hide the node!
2. Mark the known skill node as "completed" (or replace it with an advanced architectural counterpart if they want mastery).
3. Unlock dependent nodes whose prerequisite requirements are now met (status changed from 'locked' to 'available').
4. If the candidate already possesses this skill, determine if higher-order production skills should be introduced (e.g. if they know React, introduce Advanced State Machines, Performance Profiling, Micro-frontends, or System Design).
5. Recalculate estimated timeline and provide an updated, coherent graph.
6. Return the updated JSON matching the complete roadmap structure.

DO NOT include any markdown formatting. Return strictly valid JSON.`;
}

export function buildNodeAdvicePrompt(params: {
  nodeName: string;
  targetRole: string;
  whyItMatters?: string;
}): string {
  return `You are a Principal Engineer and Hiring Manager for the role "${params.targetRole}".
Provide deep, highly actionable, practical mastery guidance for the skill: "${params.nodeName}".

Provide:
1. Weekend Project: A concrete 4-8 hour project they can build this Saturday to prove mastery.
2. GitHub Repository Blueprint: Specific folder structure and key files to showcase on GitHub.
3. Common Trap / Pitfall: What junior candidates get wrong in interviews vs what senior engineers do.
4. Top 3 Real-World Interview Questions with model answers.
5. Actionable 5-item Checklist for mastery.

Output strictly valid JSON:
{
  "skillName": "${params.nodeName}",
  "weekendProject": {
    "title": "...",
    "objective": "...",
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "gitHubBlueprint": {
    "repoName": "...",
    "description": "...",
    "suggestedFiles": ["..."]
  },
  "seniorInsight": "...",
  "interviewQuestions": [
    {
      "question": "...",
      "seniorAnswer": "...",
      "dangerPitfall": "..."
    }
  ],
  "checklist": ["...", "...", "...", "...", "..."]
}`;
}

export function buildResumeAnalysisPrompt(resumeText: string, targetRole: string): string {
  return `You are an executive tech recruiter and Engineering Hiring Manager.
Analyze this candidate's resume for the target role: "${targetRole}".

RESUME TEXT:
${resumeText.slice(0, 5000)}

Perform an honest, constructive skill-gap analysis. Do NOT promise guaranteed ATS scores or job offers.

Return strictly valid JSON:
{
  "targetRole": "${targetRole}",
  "alignmentScore": 74,
  "strongSkills": ["...", "..."],
  "missingSkills": ["...", "..."],
  "missingKeywords": ["...", "..."],
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendedAdjustments": "Specific recommendation on what topics in the roadmap to prioritize.",
  "extractedSkills": ["...", "..."]
}`;
}

export function buildInterviewEvaluationPrompt(params: {
  question: string;
  userAnswer: string;
  targetRole: string;
  category: string;
}): string {
  return `You are an elite Engineering Director conducting an interview for "${params.targetRole}".
Question: "${params.question}"
Category: "${params.category}"
Candidate's Answer: "${params.userAnswer}"

Evaluate this answer rigorously. Give credit for practical insights, identify missing edge cases or system-level trade-offs, and provide a constructive senior-level model answer.

Return strictly valid JSON:
{
  "score": 85,
  "verdict": "Strong | Satisfactory | Needs Improvement",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": "Actionable feedback to elevate the answer.",
  "improvedAnswer": "How a Staff Engineer would answer this question.",
  "followUpQuestion": "A probing follow-up question."
}`;
}

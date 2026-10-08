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

  // Health
  async getHealth(): Promise<{ status: string; aiConnected: boolean; model: string }> {
    return this.request('/api/health');
  },

  // Career Roadmap
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
    return this.request('/api/career/generate', {
      method: 'POST',
      body: input,
    });
  },

  async getCurrentRoadmap(): Promise<{ success: boolean; roadmap: any }> {
    return this.request('/api/career/current');
  },

  async adaptCareerRoadmap(data: {
    knownSkillId?: string;
    knownSkillName?: string;
    updatedHoursPerWeek?: number;
    updatedTimelineMonths?: number;
  }): Promise<{ success: boolean; roadmap: any; isAiGenerated: boolean }> {
    return this.request('/api/career/adapt', {
      method: 'POST',
      body: data,
    });
  },

  async getNodeAdvice(data: {
    nodeId: string;
    nodeName: string;
    targetRole: string;
    whyItMatters?: string;
  }): Promise<{ success: boolean; advice: any }> {
    return this.request('/api/career/node-advice', {
      method: 'POST',
      body: data,
    });
  },

  async askCareerAssistant(data: {
    question: string;
    targetRole?: string;
    currentSkill?: string;
    context?: any;
  }): Promise<{ success: boolean; answer: string }> {
    return this.request('/api/career/ask', {
      method: 'POST',
      body: data,
    });
  },

  async updateNodeStatus(data: {
    roadmapId: string;
    nodeId: string;
    status: string;
  }): Promise<{ success: boolean; roadmap: any }> {
    return this.request('/api/career/node-status', {
      method: 'PATCH',
      body: data,
    });
  },

  // Learning & Missions
  async completeMission(missionId: string): Promise<{ success: boolean; xpGained: number; profile: any; readiness: any }> {
    return this.request(`/api/missions/${missionId}/complete`, {
      method: 'POST',
    });
  },

  async submitQuiz(data: {
    nodeId: string;
    topic: string;
    score: number;
    totalQuestions: number;
    answers: any[];
  }): Promise<{ success: boolean; xpAwarded: number; profile: any }> {
    return this.request('/api/quiz/submit', {
      method: 'POST',
      body: data,
    });
  },

  async getProgress(): Promise<{ success: boolean; profile: any; readiness: any; activeRoadmap: any }> {
    return this.request('/api/progress');
  },

  async getReadiness(): Promise<{ success: boolean; readiness: any }> {
    return this.request('/api/readiness');
  },

  // Resume
  async analyzeResume(data: { resumeText?: string; targetRole: string; file?: File }): Promise<{ success: boolean; analysis: any }> {
    if (data.file) {
      const formData = new FormData();
      formData.append('resume', data.file);
      formData.append('targetRole', data.targetRole);
      return this.request('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });
    }

    return this.request('/api/resume/analyze', {
      method: 'POST',
      body: {
        resumeText: data.resumeText,
        targetRole: data.targetRole,
      },
    });
  },

  // Interview
  async startInterview(data: { targetRole: string; category?: string }): Promise<{ success: boolean; targetRole: string; questions: any[] }> {
    return this.request('/api/interview/start', {
      method: 'POST',
      body: data,
    });
  },

  async evaluateInterview(data: {
    question: string;
    userAnswer: string;
    targetRole: string;
    category: string;
  }): Promise<{ success: boolean; evaluation: any; xpAwarded: number }> {
    return this.request('/api/interview/evaluate', {
      method: 'POST',
      body: data,
    });
  },

  // Profile Sync
  async syncProfile(user: { id: string; email: string; fullName: string }): Promise<{ success: boolean; profile: any }> {
    return this.request('/api/auth/sync-profile', {
      method: 'POST',
      body: user,
    });
  }
};

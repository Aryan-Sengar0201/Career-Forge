import fs from 'fs';
import path from 'path';

export interface UserStoreData {
  profile: {
    id: string;
    email: string;
    fullName: string;
    xp: number;
    level: number;
    streak: number;
    lastActiveAt: string;
    createdAt: string;
  };
  careerProfile?: {
    targetRole: string;
    industry: string;
    companyType: string;
    location: string;
    experienceLevel: string;
    currentSkills: string[];
    hoursPerWeek: number;
    timelineMonths: number;
  };
  roadmaps: Record<string, any>;
  activeRoadmapId?: string;
  quizAttempts: any[];
  resumeAnalyses: any[];
  interviewAttempts: any[];
  achievements: any[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAll(): Record<string, UserStoreData> {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json:', err);
    return {};
  }
}

function writeAll(data: Record<string, UserStoreData>): void {
  ensureDataDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const storeService = {
  getUser(userId: string): UserStoreData | undefined {
    const db = readAll();
    return db[userId];
  },

  getUserByEmail(email: string): { userId: string; data: UserStoreData } | undefined {
    const db = readAll();
    for (const [userId, data] of Object.entries(db)) {
      if (data.profile.email.toLowerCase() === email.toLowerCase()) {
        return { userId, data };
      }
    }
    return undefined;
  },

  createUser(userId: string, email: string, fullName: string): UserStoreData {
    const db = readAll();
    const newUser: UserStoreData = {
      profile: {
        id: userId,
        email,
        fullName,
        xp: 0,
        level: 1,
        streak: 1,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      roadmaps: {},
      quizAttempts: [],
      resumeAnalyses: [],
      interviewAttempts: [],
      achievements: [
        {
          id: 'ach-welcome',
          title: 'Pathfinder',
          description: 'Joined CareerForge to forge your career path',
          unlockedAt: new Date().toISOString(),
        }
      ],
    };
    db[userId] = newUser;
    writeAll(db);
    return newUser;
  },

  saveCareerProfile(userId: string, profile: any): void {
    let db = readAll();
    if (!db[userId]) {
      this.createUser(userId, 'user@careerforge.local', 'Explorer');
      db = readAll();
    }
    db[userId].careerProfile = profile;
    writeAll(db);
  },

  saveRoadmap(userId: string, roadmap: any): void {
    let db = readAll();
    if (!db[userId]) {
      this.createUser(userId, 'user@careerforge.local', 'Explorer');
      db = readAll();
    }
    db[userId].roadmaps[roadmap.id] = roadmap;
    db[userId].activeRoadmapId = roadmap.id;
    writeAll(db);
  },

  getActiveRoadmap(userId: string): any | undefined {
    const db = readAll();
    const user = db[userId];
    if (!user || !user.activeRoadmapId) return undefined;
    return user.roadmaps[user.activeRoadmapId];
  },

  updateNodeStatus(userId: string, roadmapId: string, nodeId: string, status: string): any | undefined {
    const db = readAll();
    const user = db[userId];
    if (!user || !user.roadmaps[roadmapId]) return undefined;

    const roadmap = user.roadmaps[roadmapId];
    const node = roadmap.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      node.status = status;
      // Recount completed
      roadmap.completedSkills = roadmap.nodes.filter((n: any) => n.status === 'completed').length;
      roadmap.totalSkills = roadmap.nodes.length;
      roadmap.updatedAt = new Date().toISOString();
      writeAll(db);
      return roadmap;
    }
    return undefined;
  },

  completeMission(userId: string, missionId: string): { user: UserStoreData; xpGained: number } | undefined {
    const db = readAll();
    const user = db[userId];
    if (!user) return undefined;

    let xpGained = 50;
    // Find mission across active roadmap
    if (user.activeRoadmapId && user.roadmaps[user.activeRoadmapId]) {
      const rm = user.roadmaps[user.activeRoadmapId];
      for (const node of rm.nodes) {
        if (node.missions) {
          const mission = node.missions.find((m: any) => m.id === missionId);
          if (mission && !mission.isCompleted) {
            mission.isCompleted = true;
            mission.completedAt = new Date().toISOString();
            xpGained = mission.xp || 50;

            // Check if all missions for this node are completed
            const allDone = node.missions.every((m: any) => m.isCompleted);
            if (allDone && node.status !== 'completed') {
              node.status = 'completed';
            }
            break;
          }
        }
      }
      rm.completedSkills = rm.nodes.filter((n: any) => n.status === 'completed').length;
    }

    user.profile.xp += xpGained;
    user.profile.level = Math.floor(user.profile.xp / 200) + 1;
    user.profile.lastActiveAt = new Date().toISOString();
    writeAll(db);
    return { user, xpGained };
  },

  addQuizAttempt(userId: string, attempt: any): void {
    const db = readAll();
    if (db[userId]) {
      db[userId].quizAttempts.push(attempt);
      db[userId].profile.xp += attempt.xpAwarded || 30;
      writeAll(db);
    }
  },

  addResumeAnalysis(userId: string, analysis: any): void {
    const db = readAll();
    if (db[userId]) {
      db[userId].resumeAnalyses.push(analysis);
      writeAll(db);
    }
  },

  calculateReadiness(userId: string): any {
    const db = readAll();
    const user = db[userId];
    if (!user) {
      return {
        overallScore: 0,
        skillsScore: 0,
        projectsScore: 0,
        interviewScore: 0,
        resumeScore: 0,
      };
    }

    const rm = user.activeRoadmapId ? user.roadmaps[user.activeRoadmapId] : null;
    let skillsScore = 20;
    let projectsScore = 15;
    let interviewScore = 20;
    let resumeScore = user.resumeAnalyses.length > 0 ? (user.resumeAnalyses[user.resumeAnalyses.length - 1].alignmentScore || 65) : 35;

    if (rm && rm.nodes) {
      const totalSkills = rm.nodes.filter((n: any) => n.type === 'skill').length || 1;
      const doneSkills = rm.nodes.filter((n: any) => n.type === 'skill' && n.status === 'completed').length;
      skillsScore = Math.min(100, Math.round((doneSkills / totalSkills) * 90) + 10);

      const totalProjects = rm.nodes.filter((n: any) => n.type === 'project').length || 1;
      const doneProjects = rm.nodes.filter((n: any) => n.type === 'project' && n.status === 'completed').length;
      projectsScore = Math.min(100, Math.round((doneProjects / totalProjects) * 90) + 10);
    }

    if (user.quizAttempts.length > 0) {
      interviewScore = Math.min(95, 40 + user.quizAttempts.length * 15);
    }

    const overallScore = Math.round(
      (skillsScore * 0.4) + (projectsScore * 0.25) + (interviewScore * 0.2) + (resumeScore * 0.15)
    );

    return {
      overallScore,
      skillsScore,
      projectsScore,
      interviewScore,
      resumeScore,
      breakdown: {
        skillsCompleted: rm ? rm.nodes.filter((n: any) => n.status === 'completed').length : 0,
        skillsTotal: rm ? rm.nodes.length : 0,
        projectsCompleted: rm ? rm.nodes.filter((n: any) => n.type === 'project' && n.status === 'completed').length : 0,
        projectsTotal: rm ? rm.nodes.filter((n: any) => n.type === 'project').length : 0,
        interviewsCompleted: user.quizAttempts.length,
        resumeOptimized: user.resumeAnalyses.length > 0,
      }
    };
  }
};

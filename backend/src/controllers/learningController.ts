import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { dbService } from '../services/supabaseService.js';
import { storeService } from '../services/storeService.js';

export const learningController = {
  async completeMission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const missionId = req.params.id;

      if (!missionId) {
        res.status(400).json({ error: 'Mission ID is required' });
        return;
      }

      const result = await dbService.completeMission(userId, missionId);

      if (!result) {
        res.status(404).json({ error: 'User or mission not found' });
        return;
      }

      const readiness = await dbService.getCareerReadiness(userId);

      res.status(200).json({
        success: true,
        xpGained: result.xpGained,
        profile: result.user.profile,
        readiness,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to complete mission',
        message: (error as Error).message,
      });
    }
  },

  async submitQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const { nodeId, topic, score, totalQuestions, answers } = req.body;

      const xpAwarded = Math.round((score / totalQuestions) * 50) + 10;

      const attempt = {
        nodeId,
        topic: topic || 'Knowledge Check',
        score,
        totalQuestions,
        xpAwarded,
        answers: answers || [],
        createdAt: new Date().toISOString(),
      };

      storeService.addQuizAttempt(userId, attempt);
      const user = storeService.getUser(userId);

      res.status(200).json({
        success: true,
        xpAwarded,
        profile: user?.profile,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to record quiz attempt',
        message: (error as Error).message,
      });
    }
  },

  async getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const user = storeService.getUser(userId);
      const roadmap = await dbService.getActiveRoadmap(userId);
      const readiness = await dbService.getCareerReadiness(userId);

      res.status(200).json({
        success: true,
        profile: user?.profile || {
          id: userId,
          email: req.user?.email || 'user@careerforge.local',
          fullName: req.user?.fullName || 'Explorer',
          xp: 120,
          level: 1,
          streak: 1,
        },
        readiness,
        activeRoadmap: roadmap,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve progress',
        message: (error as Error).message,
      });
    }
  },

  async getReadiness(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const readiness = await dbService.getCareerReadiness(userId);
      res.status(200).json({
        success: true,
        readiness,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve readiness score',
        message: (error as Error).message,
      });
    }
  }
};

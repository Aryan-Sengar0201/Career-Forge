import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { geminiService } from '../services/geminiService.js';
import { storeService } from '../services/storeService.js';

export const interviewController = {
  async startInterview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetRole = req.body.targetRole || 'Full Stack Developer';
      const category = req.body.category || 'technical';

      // Generate question bank
      const questions = [
        {
          id: 'q-1',
          category: 'technical',
          question: `In a production system for a ${targetRole}, how do you ensure zero-downtime database schema migrations with backward compatibility?`,
        },
        {
          id: 'q-2',
          category: 'scenario',
          question: `Your microservice is experiencing sporadic 504 Gateway Timeouts under sudden traffic spikes. Walk me through your triage and architectural remediation steps.`,
        },
        {
          id: 'q-3',
          category: 'system_design',
          question: `Design an idempotent payment processing webhook pipeline that prevents duplicate charges even if the external gateway delivers duplicate events.`,
        },
        {
          id: 'q-4',
          category: 'behavioral',
          question: `Describe a scenario where you disagreed with a senior engineer or product manager on an architectural trade-off. How did you resolve it?`,
        }
      ];

      res.status(200).json({
        success: true,
        targetRole,
        questions,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to initialize interview session',
        message: (error as Error).message,
      });
    }
  },

  async evaluateAnswer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const { question, userAnswer, targetRole, category } = req.body;

      if (!question || !userAnswer) {
        res.status(400).json({ error: 'Question and candidate answer are required.' });
        return;
      }

      const evaluation = await geminiService.evaluateInterview({
        question,
        userAnswer,
        targetRole: targetRole || 'Full Stack Developer',
        category: category || 'technical',
      });

      // Award XP for completing an interview challenge
      const user = storeService.getUser(userId);
      if (user) {
        user.profile.xp += 40;
        storeService.addQuizAttempt(userId, {
          topic: `Interview: ${category || 'technical'}`,
          score: evaluation.score || 80,
          totalQuestions: 100,
          xpAwarded: 40,
        });
      }

      res.status(200).json({
        success: true,
        evaluation,
        xpAwarded: 40,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to evaluate interview answer',
        message: (error as Error).message,
      });
    }
  }
};

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { generateCareerInputSchema, adaptCareerInputSchema, nodeAdviceInputSchema, askAiInputSchema } from '../schemas/careerSchemas.js';
import { geminiService } from '../services/geminiService.js';
import { dbService } from '../services/supabaseService.js';
import { storeService } from '../services/storeService.js';
import crypto from 'crypto';

export const careerController = {
  async generateRoadmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const parsed = generateCareerInputSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.format(),
        });
        return;
      }

      // Persist onboarding inputs
      storeService.saveCareerProfile(userId, parsed.data);

      // Generate via Gemini
      const { data, isAiGenerated } = await geminiService.generateCareerRoadmap(parsed.data);

      const roadmapId = `rm-${crypto.randomUUID()}`;
      const completedSkills = (data.nodes || []).filter((n: any) => n.status === 'completed').length;
      const totalSkills = (data.nodes || []).length;

      const formattedRoadmap = {
        ...data,
        id: roadmapId,
        userId,
        experienceLevel: parsed.data.experienceLevel,
        totalSkills,
        completedSkills,
        isAiGenerated,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveRoadmap(userId, formattedRoadmap);

      res.status(200).json({
        success: true,
        roadmap: formattedRoadmap,
        isAiGenerated,
      });
    } catch (error) {
      console.error('[Generate Roadmap Controller Error]:', error);
      res.status(500).json({
        error: "CareerForge couldn't generate your path right now.",
        message: (error as Error).message,
      });
    }
  },

  async getCurrentRoadmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const roadmap = await dbService.getActiveRoadmap(userId);

      if (!roadmap) {
        res.status(404).json({
          success: false,
          message: 'No active career roadmap found. Please complete onboarding.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        roadmap,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve career roadmap',
        message: (error as Error).message,
      });
    }
  },

  async adaptRoadmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const parsed = adaptCareerInputSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.format(),
        });
        return;
      }

      const currentRoadmap = await dbService.getActiveRoadmap(userId);
      if (!currentRoadmap) {
        res.status(404).json({
          error: 'No active roadmap found to adapt',
        });
        return;
      }

      const { data, isAiGenerated } = await geminiService.adaptCareerRoadmap({
        targetRole: currentRoadmap.targetRole,
        knownSkillId: parsed.data.knownSkillId,
        knownSkillName: parsed.data.knownSkillName,
        updatedHoursPerWeek: parsed.data.updatedHoursPerWeek,
        updatedTimelineMonths: parsed.data.updatedTimelineMonths,
        existingRoadmap: currentRoadmap,
      });

      const updatedRoadmap = {
        ...currentRoadmap,
        ...data,
        id: currentRoadmap.id,
        userId,
        isAiGenerated,
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveRoadmap(userId, updatedRoadmap);

      res.status(200).json({
        success: true,
        roadmap: updatedRoadmap,
        isAiGenerated,
      });
    } catch (error) {
      console.error('[Adapt Roadmap Controller Error]:', error);
      res.status(500).json({
        error: "Failed to adapt career roadmap",
        message: (error as Error).message,
      });
    }
  },

  async getNodeAdvice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = nodeAdviceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
        return;
      }

      const advice = await geminiService.getNodeAdvice({
        nodeName: parsed.data.nodeName,
        targetRole: parsed.data.targetRole,
        whyItMatters: parsed.data.whyItMatters,
      });

      res.status(200).json({
        success: true,
        advice,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve node advice',
        message: (error as Error).message,
      });
    }
  },

  async askCareerAssistant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = askAiInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
        return;
      }

      const responseText = await geminiService.askCareerAssistant({
        question: parsed.data.question,
        targetRole: parsed.data.targetRole,
        currentSkill: parsed.data.currentSkill,
        context: parsed.data.context,
      });

      res.status(200).json({
        success: true,
        answer: responseText,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to query AI Assistant',
        message: (error as Error).message,
      });
    }
  },

  async updateNodeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      const { roadmapId, nodeId, status } = req.body;

      if (!roadmapId || !nodeId || !status) {
        res.status(400).json({ error: 'roadmapId, nodeId, and status are required' });
        return;
      }

      const updated = await dbService.updateNodeStatus(userId, roadmapId, nodeId, status);
      res.status(200).json({
        success: true,
        roadmap: updated,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update node status',
        message: (error as Error).message,
      });
    }
  }
};

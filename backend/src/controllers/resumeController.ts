import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { geminiService } from '../services/geminiService.js';
import { storeService } from '../services/storeService.js';

export const resumeController = {
  async analyzeResume(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default-user';
      let resumeText = '';
      const targetRole = req.body.targetRole || 'Full Stack Developer';

      if (req.file) {
        // Simple buffer text decoding
        resumeText = req.file.buffer.toString('utf-8');
      } else if (req.body.resumeText) {
        resumeText = req.body.resumeText;
      }

      if (!resumeText || resumeText.trim().length < 20) {
        res.status(400).json({
          error: 'Please provide valid resume content or text (minimum 20 characters).',
        });
        return;
      }

      const analysis = await geminiService.analyzeResume(resumeText, targetRole);
      storeService.addResumeAnalysis(userId, analysis);

      res.status(200).json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error('[Resume Controller Error]:', error);
      res.status(500).json({
        error: 'Failed to analyze resume',
        message: (error as Error).message,
      });
    }
  }
};

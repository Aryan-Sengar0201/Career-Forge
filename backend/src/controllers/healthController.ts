import { Request, Response } from 'express';
import { geminiService, getModelName } from '../services/geminiService.js';

export const healthController = {
  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const isConnected = await geminiService.testConnectivity();

      res.status(200).json({
        status: 'ok',
        aiConnected: isConnected,
        model: getModelName(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(200).json({
        status: 'degraded',
        aiConnected: false,
        model: getModelName(),
        error: (error as Error).message,
      });
    }
  }
};

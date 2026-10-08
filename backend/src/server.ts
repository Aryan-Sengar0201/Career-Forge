import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import healthRoutes from './routes/healthRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { geminiService, getModelName } from './services/geminiService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', learningRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);

// Root greeting / API index
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CareerForge API',
    tagline: 'Forge Your Path. Build Your Future.',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Centralized error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err.stack || err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 CareerForge Backend listening on port ${PORT}`);
  console.log(`🎯 Reverse-Engineered Career Roadmapper Engine`);
  console.log(`🤖 Configured Gemini Model: ${getModelName()}`);

  const aiConnected = await geminiService.testConnectivity();
  console.log(`✨ AI Connectivity Status: ${aiConnected ? 'CONNECTED (Live Gemini API)' : 'OFFLINE / DEMO MODE (Deterministic Fallback)'}`);
  console.log(`====================================================`);
});

export default app;

import { Router } from 'express';
import { interviewController } from '../controllers/interviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware as any);

router.post('/start', interviewController.startInterview as any);
router.post('/evaluate', interviewController.evaluateAnswer as any);

export default router;

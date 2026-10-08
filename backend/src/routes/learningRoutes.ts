import { Router } from 'express';
import { learningController } from '../controllers/learningController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware as any);

router.post('/missions/:id/complete', learningController.completeMission as any);
router.post('/quiz/submit', learningController.submitQuiz as any);
router.get('/progress', learningController.getProgress as any);
router.get('/readiness', learningController.getReadiness as any);

export default router;

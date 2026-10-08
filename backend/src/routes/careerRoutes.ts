import { Router } from 'express';
import { careerController } from '../controllers/careerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All career routes are authenticated
router.use(authMiddleware as any);

router.post('/generate', careerController.generateRoadmap as any);
router.get('/current', careerController.getCurrentRoadmap as any);
router.post('/adapt', careerController.adaptRoadmap as any);
router.post('/node-advice', careerController.getNodeAdvice as any);
router.post('/ask', careerController.askCareerAssistant as any);
router.patch('/node-status', careerController.updateNodeStatus as any);

export default router;

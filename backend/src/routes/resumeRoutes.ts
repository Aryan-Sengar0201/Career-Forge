import { Router } from 'express';
import multer from 'multer';
import { resumeController } from '../controllers/resumeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(authMiddleware as any);

router.post('/analyze', upload.single('resume') as any, resumeController.analyzeResume as any);

export default router;

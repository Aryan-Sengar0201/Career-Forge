import { Router, Request, Response } from 'express';
import { storeService } from '../services/storeService.js';

const router = Router();

router.post('/sync-profile', (req: Request, res: Response) => {
  const { id, email, fullName } = req.body;
  if (!id || !email) {
    res.status(400).json({ error: 'id and email are required' });
    return;
  }

  let user = storeService.getUser(id);
  if (!user) {
    user = storeService.createUser(id, email, fullName || 'Explorer');
  } else if (fullName && fullName !== user.profile.fullName) {
    user.profile.fullName = fullName;
  }

  res.status(200).json({
    success: true,
    profile: user.profile,
  });
});

router.get('/profile/:id', (req: Request, res: Response) => {
  const user = storeService.getUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.status(200).json({
    success: true,
    profile: user.profile,
  });
});

export default router;

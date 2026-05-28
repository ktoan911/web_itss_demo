import { Router } from 'express';
import authRoutes from './auth.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);

export default router;

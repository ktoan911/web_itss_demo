import { Router } from 'express';
import authRoutes from './auth.routes.js';
import settingsRoutes from './settings.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);

export default router;

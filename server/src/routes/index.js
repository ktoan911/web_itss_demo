import { Router } from 'express';
import authRoutes from './auth.routes.js';
import settingsRoutes from './settings.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';
import pomodoroRoutes from './pomodoro.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import statsRoutes from './statistics.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/pomodoro-sessions', pomodoroRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/statistics', statsRoutes);

export default router;

import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authRequired);

router.get('/tasks', statisticsController.tasks);
router.get('/pomodoros', statisticsController.pomodoros);

export default router;

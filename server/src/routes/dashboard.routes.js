import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authRequired);
router.get('/summary', dashboardController.summary);
export default router;

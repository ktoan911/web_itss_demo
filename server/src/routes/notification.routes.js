import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { z } from 'zod';

const router = Router();
router.use(authRequired);

const idParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate({ params: idParam }), notificationController.markRead);

export default router;

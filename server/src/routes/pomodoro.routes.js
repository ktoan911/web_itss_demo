import { Router } from 'express';
import { pomodoroController } from '../controllers/pomodoro.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sessionCreateSchema } from '../validators/pomodoro.validator.js';

const router = Router();
router.use(authRequired);

router.post('/', validate({ body: sessionCreateSchema }), pomodoroController.create);
router.get('/recent', pomodoroController.recent);

export default router;

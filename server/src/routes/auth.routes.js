import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();
router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login',    authLimiter, validate({ body: loginSchema }),    authController.login);
router.get('/me',        authRequired, authController.me);

export default router;

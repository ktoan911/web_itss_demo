import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
  settingsUpdateSchema, profileUpdateSchema, passwordChangeSchema,
} from '../validators/settings.validator.js';

const router = Router();
router.use(authRequired);

router.get('/',          settingsController.get);
router.put('/',          validate({ body: settingsUpdateSchema }), settingsController.update);
router.put('/profile',   validate({ body: profileUpdateSchema }),  settingsController.updateProfile);
router.put('/password',  validate({ body: passwordChangeSchema }), settingsController.changePassword);

export default router;

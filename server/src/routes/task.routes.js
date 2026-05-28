import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  taskCreateSchema, taskUpdateSchema, taskListQuerySchema, taskIdParam, taskStatusSchema,
} from '../validators/task.validator.js';

const router = Router();
router.use(authRequired);

router.get('/',    validate({ query: taskListQuerySchema }), taskController.list);
router.post('/',   validate({ body: taskCreateSchema }),     taskController.create);
router.get('/:id', validate({ params: taskIdParam }),        taskController.get);
router.put('/:id', validate({ params: taskIdParam, body: taskUpdateSchema }), taskController.update);
router.delete('/:id', validate({ params: taskIdParam }), taskController.remove);
router.patch('/:id/status',   validate({ params: taskIdParam, body: taskStatusSchema }), taskController.changeStatus);
router.patch('/:id/complete', validate({ params: taskIdParam }), taskController.markCompleted);
router.patch('/:id/pomodoro/increment', validate({ params: taskIdParam }), taskController.incrementPomo);

export default router;

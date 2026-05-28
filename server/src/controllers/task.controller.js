import { taskService } from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const uid = (req) => req.user.id;

export const taskController = {
  list: asyncHandler(async (req, res) => res.json(await taskService.list(uid(req), req.query))),
  get: asyncHandler(async (req, res) => res.json(await taskService.get(uid(req), req.params.id))),
  create: asyncHandler(async (req, res) =>
    res.status(201).json(await taskService.create(uid(req), req.body)),
  ),
  update: asyncHandler(async (req, res) =>
    res.json(await taskService.update(uid(req), req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req, res) =>
    res.json(await taskService.remove(uid(req), req.params.id)),
  ),
  changeStatus: asyncHandler(async (req, res) =>
    res.json(await taskService.changeStatus(uid(req), req.params.id, req.body.status)),
  ),
  markCompleted: asyncHandler(async (req, res) =>
    res.json(await taskService.markCompleted(uid(req), req.params.id)),
  ),
  incrementPomo: asyncHandler(async (req, res) =>
    res.json(await taskService.incrementPomodoro(uid(req), req.params.id)),
  ),
  bulkDelete: asyncHandler(async (req, res) =>
    res.json(await taskService.bulkDelete(uid(req), req.body.ids)),
  ),
  bulkComplete: asyncHandler(async (req, res) =>
    res.json(await taskService.bulkComplete(uid(req), req.body.ids)),
  ),
  bulkPriority: asyncHandler(async (req, res) =>
    res.json(await taskService.bulkChangePriority(uid(req), req.body.ids, req.body.priority)),
  ),
};

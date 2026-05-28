import { pomodoroService } from '../services/pomodoro.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const pomodoroController = {
  create: asyncHandler(async (req, res) =>
    res.status(201).json(await pomodoroService.create(req.user.id, req.body))),
  recent: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json(await pomodoroService.recent(req.user.id, limit));
  }),
};

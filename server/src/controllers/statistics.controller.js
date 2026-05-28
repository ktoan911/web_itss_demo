import { statisticsService } from '../services/statistics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const statisticsController = {
  tasks: asyncHandler(async (req, res) =>
    res.json(await statisticsService.tasks(req.user.id, req.query.range))),
  pomodoros: asyncHandler(async (req, res) =>
    res.json(await statisticsService.pomodoros(req.user.id, req.query.range))),
};

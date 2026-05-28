import { dashboardService } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = {
  summary: asyncHandler(async (req, res) =>
    res.json(await dashboardService.summary(req.user.id))),
};

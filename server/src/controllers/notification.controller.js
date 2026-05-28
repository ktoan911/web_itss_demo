import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json(await notificationService.list(req.user.id, limit));
  }),
  markRead: asyncHandler(async (req, res) =>
    res.json(await notificationService.markRead(req.user.id, req.params.id))),
  markAllRead: asyncHandler(async (req, res) =>
    res.json(await notificationService.markAllRead(req.user.id))),
};

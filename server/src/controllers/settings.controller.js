import { settingsService } from '../services/settings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsController = {
  get:    asyncHandler(async (req, res) => res.json(await settingsService.get(req.user.id))),
  update: asyncHandler(async (req, res) => res.json(await settingsService.update(req.user.id, req.body))),
  updateProfile: asyncHandler(async (req, res) =>
    res.json(await settingsService.updateProfile(req.user.id, req.body))),
  changePassword: asyncHandler(async (req, res) =>
    res.json(await settingsService.changePassword(req.user.id, req.body))),
};

import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
  me: asyncHandler(async (req, res) => {
    const result = await authService.me(req.user.id);
    res.json(result);
  }),
};

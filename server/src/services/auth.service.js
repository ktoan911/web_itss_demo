import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/passwordHasher.js';
import { signToken } from './jwt.service.js';
import { AppError } from '../utils/AppError.js';

const toClientUser = (u) => ({ id: u._id.toString(), fullName: u.fullName, email: u.email });

export const authService = {
  async register({ fullName, email, password }) {
    const exists = await User.findOne({ email });
    if (exists) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
    const passwordHash = await hashPassword(password);
    const user = await User.create({ fullName, email, passwordHash });
    // UserSetting auto-create wired in Task 6 by importing settingsService
    const token = signToken({ id: user._id.toString(), email: user.email });
    return { token, user: toClientUser(user) };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new AppError('Invalid credentials', 401);
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new AppError('Invalid credentials', 401);
    const token = signToken({ id: user._id.toString(), email: user.email });
    return { token, user: toClientUser(user) };
  },

  async me(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return { user: toClientUser(user) };
  },
};

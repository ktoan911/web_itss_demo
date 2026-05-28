import { UserSetting } from '../models/UserSetting.js';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/passwordHasher.js';
import { AppError } from '../utils/AppError.js';

export const settingsService = {
  async ensureForUser(userId) {
    const existing = await UserSetting.findOne({ userId });
    if (existing) return existing;
    return UserSetting.create({ userId });
  },

  async get(userId) {
    return this.ensureForUser(userId);
  },

  async update(userId, patch) {
    return UserSetting.findOneAndUpdate({ userId }, { $set: patch }, { new: true, upsert: true });
  },

  async updateProfile(userId, { fullName }) {
    const user = await User.findByIdAndUpdate(userId, { $set: { fullName } }, { new: true });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new AppError('User not found', 404);
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new AppError('Current password is incorrect', 401);
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    return { ok: true };
  },
};

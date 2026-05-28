import { Notification } from '../models/Notification.js';
import { UserSetting } from '../models/UserSetting.js';
import { AppError } from '../utils/AppError.js';

async function userAllowsNotifications(userId) {
  const s = await UserSetting.findOne({ userId });
  return !s || s.notificationEnabled !== false;
}

export const notificationService = {
  async create(userId, { title, message, type, taskId = null }) {
    if (!(await userAllowsNotifications(userId))) return null;
    return Notification.create({ userId, title, message, type, taskId });
  },

  async createDeduped(userId, { title, message, type, taskId = null, withinMs }) {
    if (!(await userAllowsNotifications(userId))) return null;
    const since = new Date(Date.now() - withinMs);
    const exists = await Notification.findOne({ userId, type, taskId, createdAt: { $gt: since } });
    if (exists) return null;
    return Notification.create({ userId, title, message, type, taskId });
  },

  async list(userId, limit = 20) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  },

  async markRead(userId, id) {
    const n = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true } },
      { new: true },
    );
    if (!n) throw new AppError('Notification not found', 404);
    return n;
  },

  async markAllRead(userId) {
    const r = await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    return { count: r.modifiedCount };
  },
};

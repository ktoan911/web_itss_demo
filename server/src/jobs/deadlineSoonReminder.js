import { Task } from '../models/Task.js';
import { UserSetting } from '../models/UserSetting.js';
import { notificationService } from '../services/notification.service.js';

const DEFAULT_HOURS = 24;

export async function runDeadlineSoonReminder(now = new Date()) {
  // Pull all not-yet-due, incomplete tasks once, then filter per user threshold.
  const tasks = await Task.find({
    status: { $ne: 'Completed' },
    deadline: { $gt: now },
  }).select('_id userId title deadline');

  const hoursByUser = new Map();
  const thresholdHours = async (userId) => {
    const key = userId.toString();
    if (!hoursByUser.has(key)) {
      const s = await UserSetting.findOne({ userId }).select('deadlineReminderHours');
      hoursByUser.set(key, s?.deadlineReminderHours ?? DEFAULT_HOURS);
    }
    return hoursByUser.get(key);
  };

  let matched = 0;
  for (const task of tasks) {
    const hours = await thresholdHours(task.userId);
    const limit = new Date(now.getTime() + hours * 3_600_000);
    if (task.deadline > limit) continue;
    matched += 1;
    await notificationService.createDeduped(task.userId, {
      title: 'Deadline approaching',
      message: `"${task.title}" is due within ${hours}h.`,
      type: 'deadline_soon',
      taskId: task._id,
      withinMs: hours * 3_600_000,
    });
  }
  return matched;
}

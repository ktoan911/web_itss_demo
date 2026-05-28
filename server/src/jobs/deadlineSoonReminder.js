import { Task } from '../models/Task.js';
import { notificationService } from '../services/notification.service.js';

export async function runDeadlineSoonReminder(now = new Date()) {
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const tasks = await Task.find({
    status: { $ne: 'Completed' },
    deadline: { $gt: now, $lte: oneHourLater },
  }).select('_id userId title deadline');

  for (const task of tasks) {
    await notificationService.createDeduped(task.userId, {
      title: 'Deadline approaching',
      message: `"${task.title}" is due within the hour.`,
      type: 'deadline_soon',
      taskId: task._id,
      withinMs: 2 * 60 * 60 * 1000,
    });
  }
  return tasks.length;
}

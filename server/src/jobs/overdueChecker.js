import { Task } from '../models/Task.js';
import { notificationService } from '../services/notification.service.js';

export async function runOverdueChecker(now = new Date()) {
  const tasks = await Task.find({
    status: { $ne: 'Completed' },
    deadline: { $lt: now },
  }).select('_id userId title');

  for (const task of tasks) {
    await notificationService.createDeduped(task.userId, {
      title: 'Task overdue',
      message: `"${task.title}" passed its deadline.`,
      type: 'task_overdue',
      taskId: task._id,
      withinMs: 24 * 60 * 60 * 1000,
    });
  }
  return tasks.length;
}

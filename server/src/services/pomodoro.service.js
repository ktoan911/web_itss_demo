import { PomodoroSession } from '../models/PomodoroSession.js';
import { Task } from '../models/Task.js';
import { taskService } from './task.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';

export const pomodoroService = {
  async create(userId, body) {
    if (body.taskId) {
      const owned = await Task.exists({ _id: body.taskId, userId });
      if (!owned) throw new AppError('Task not found', 403);
    }
    const session = await PomodoroSession.create({ ...body, userId });
    if (session.mode === 'Focus' && session.isCompleted) {
      await notificationService.create(userId, {
        title: 'Focus session complete',
        message: `Great job! ${session.durationMinutes} min focus done.`,
        type: 'pomodoro_done',
        taskId: session.taskId,
      });
      if (session.taskId) {
        await taskService.incrementPomodoro(userId, session.taskId.toString());
      }
    }
    return session;
  },

  async recent(userId, limit = 10) {
    return PomodoroSession.find({ userId }).sort({ startedAt: -1 }).limit(limit);
  },
};

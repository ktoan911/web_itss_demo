import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { deadlineFilterToQuery } from '../utils/dateRange.js';
import { notificationService } from './notification.service.js';

const sortMap = {
  deadline: { deadline: 1 },
  priority: { priorityRank: -1, deadline: 1 },
  newest:   { createdAt: -1 },
};

const notFound = () => new AppError('Task not found', 404);

export const taskService = {
  async list(userId, query) {
    const filter = { userId, ...deadlineFilterToQuery(query.deadlineFilter) };
    if (query.status)   filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search)   filter.$text = { $search: query.search };
    return Task.find(filter).sort(sortMap[query.sortBy ?? 'deadline']);
  },

  async get(userId, id) {
    const task = await Task.findOne({ _id: id, userId });
    if (!task) throw notFound();
    return task;
  },

  async create(userId, body) {
    return Task.create({ ...body, userId });
  },

  async update(userId, id, body) {
    const task = await Task.findOneAndUpdate({ _id: id, userId }, { $set: body }, { new: true, runValidators: true });
    if (!task) throw notFound();
    return task;
  },

  async remove(userId, id) {
    const r = await Task.findOneAndDelete({ _id: id, userId });
    if (!r) throw notFound();
    return { ok: true };
  },

  async changeStatus(userId, id, status) {
    const update = { status };
    if (status === 'Completed') update.completedAt = new Date();
    const task = await Task.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
    if (!task) throw notFound();
    if (status === 'Completed') {
      await notificationService.create(userId, {
        title: 'Task completed',
        message: `"${task.title}" marked as completed.`,
        type: 'task_completed',
        taskId: task._id,
      });
    }
    return task;
  },

  async markCompleted(userId, id) {
    const task = await Task.findOne({ _id: id, userId });
    if (!task) throw notFound();
    if (task.status === 'Completed') return task;
    task.status = 'Completed';
    task.completedAt = new Date();
    await task.save();
    await notificationService.create(userId, {
      title: 'Task completed',
      message: `"${task.title}" marked as completed.`,
      type: 'task_completed',
      taskId: task._id,
    });
    return task;
  },

  async incrementPomodoro(userId, id) {
    const task = await Task.findOne({ _id: id, userId });
    if (!task) throw notFound();
    task.completedPomodoros += 1;
    if (task.status === 'Todo') task.status = 'InProgress';
    await task.save();
    if (
      task.completedPomodoros >= task.estimatedPomodoros &&
      task.status !== 'Completed'
    ) {
      await notificationService.createDeduped(userId, {
        title: 'Estimated pomodoros reached',
        message: `You've reached the estimated pomodoros for "${task.title}".`,
        type: 'estimated_reached',
        taskId: task._id,
        withinMs: 365 * 86_400_000, // effectively once per task
      });
    }
    return task;
  },
};

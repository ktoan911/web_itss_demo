import { Task } from '../models/Task.js';
import { PomodoroSession } from '../models/PomodoroSession.js';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import mongoose from 'mongoose';

const oid = (id) =>
  typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;

export const dashboardService = {
  async summary(userId, now = new Date()) {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    const [
      totalTasks, completedTasks, inProgressTasks, overdueTasks,
      todayPomodoros, todayFocusAgg,
      todayTasks, upcomingTasks, recentSessions,
      completionDocs,
    ] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'Completed' }),
      Task.countDocuments({ userId, status: 'InProgress' }),
      Task.countDocuments({ userId, status: { $ne: 'Completed' }, deadline: { $lt: now } }),
      PomodoroSession.countDocuments({
        userId, mode: 'Focus', isCompleted: true,
        startedAt: { $gte: todayStart, $lte: todayEnd },
      }),
      PomodoroSession.aggregate([
        { $match: {
            userId: oid(userId),
            mode: 'Focus', isCompleted: true,
            startedAt: { $gte: todayStart, $lte: todayEnd },
        } },
        { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
      ]),
      Task.find({ userId, status: { $ne: 'Completed' },
        deadline: { $gte: todayStart, $lte: todayEnd } }).limit(10),
      Task.find({ userId, status: { $ne: 'Completed' }, deadline: { $gt: todayEnd } })
        .sort({ deadline: 1 }).limit(5),
      PomodoroSession.find({ userId }).sort({ startedAt: -1 }).limit(5),
      Task.aggregate([
        { $match: {
            userId: oid(userId),
            status: 'Completed', completedAt: { $gte: sevenDaysAgo },
        } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
        } },
      ]),
    ]);

    const completionMap = Object.fromEntries(completionDocs.map((d) => [d._id, d.count]));
    const completionChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(now, i), 'yyyy-MM-dd');
      completionChart.push({ date: d, count: completionMap[d] || 0 });
    }

    return {
      totalTasks, completedTasks, inProgressTasks, overdueTasks,
      todayPomodoros,
      todayFocusMinutes: todayFocusAgg[0]?.total || 0,
      todayTasks, upcomingTasks, recentSessions,
      completionChart,
    };
  },
};

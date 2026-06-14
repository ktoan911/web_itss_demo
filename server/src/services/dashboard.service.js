import { Task } from '../models/Task.js';
import { PomodoroSession } from '../models/PomodoroSession.js';
import { UserSetting } from '../models/UserSetting.js';
import { User } from '../models/User.js';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import mongoose from 'mongoose';

const oid = (id) =>
  typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;

export const dashboardService = {
  async summary(userId, now = new Date()) {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    const setting = await UserSetting.findOne({ userId }).select('deadlineReminderHours');
    const dueSoonHours = setting?.deadlineReminderHours ?? 24;
    const dueSoonLimit = new Date(now.getTime() + dueSoonHours * 3_600_000);

    const userDoc = await User.findById(userId).select('pomodoroStreak');
    const streak = userDoc?.pomodoroStreak?.count ?? 0;


    const [
      totalTasks, completedTasks, inProgressTasks, overdueTasks,
      todayPomodoros, todayFocusAgg,
      todayTasks, upcomingTasks, recentSessions,
      completionDocs, dueSoonTasks,
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
      Task.find({
        userId, status: { $ne: 'Completed' },
        deadline: { $gt: now, $lte: dueSoonLimit },
      }).sort({ deadline: 1 }).limit(10),
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
      dueSoonTasks, dueSoonHours,
      streak,
    };
  },
};

import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { PomodoroSession } from '../models/PomodoroSession.js';
import { format, addDays, startOfDay } from 'date-fns';
import { parseStatRange } from '../utils/dateRange.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

function fillSeries(start, end, map, factory) {
  const out = [];
  let cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    const key = format(cur, 'yyyy-MM-dd');
    out.push({ date: key, ...factory(map[key]) });
    cur = addDays(cur, 1);
  }
  return out;
}

export const statisticsService = {
  async tasks(userId, range) {
    const { start, end } = parseStatRange(range);
    const docs = await Task.aggregate([
      { $match: { userId: oid(userId), status: 'Completed', completedAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(docs.map((d) => [d._id, d.count]));
    return fillSeries(start, end, map, (v) => ({ count: v || 0 }));
  },

  async pomodoros(userId, range) {
    const { start, end } = parseStatRange(range);
    const dailyDocs = await PomodoroSession.aggregate([
      { $match: { userId: oid(userId), mode: 'Focus', isCompleted: true, startedAt: { $gte: start, $lte: end } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
          sessions: { $sum: 1 },
          focusMinutes: { $sum: '$durationMinutes' },
      } },
    ]);
    const map = Object.fromEntries(dailyDocs.map((d) => [d._id, d]));
    const daily = fillSeries(start, end, map, (v) => ({
      sessions: v?.sessions || 0,
      focusMinutes: v?.focusMinutes || 0,
    }));

    const byPriority = await Task.aggregate([
      { $match: { userId: oid(userId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { _id: 0, priority: '$_id', count: 1 } },
    ]);
    const byStatus = await Task.aggregate([
      { $match: { userId: oid(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);
    return { daily, byPriority, byStatus };
  },
};

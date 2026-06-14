import { User } from '../models/User.js';

const dayKey = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

const diffInDays = (a, b) => {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
};

export function computeNextStreak(prev, now) {
  const today = dayKey(now);
  if (!prev || !prev.lastFocusDate) return { count: 1, lastDay: today };
  const last = dayKey(new Date(prev.lastFocusDate));
  const gap = diffInDays(today, last);
  if (gap === 0) return { count: prev.count, lastDay: today };
  if (gap === 1) return { count: prev.count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}

export const streakService = {
  async bump(userId, now = new Date()) {
    const user = await User.findById(userId).select('pomodoroStreak');
    if (!user) return 0;
    const next = computeNextStreak(user.pomodoroStreak, now);
    user.pomodoroStreak = { count: next.count, lastFocusDate: now };
    await user.save();
    return next.count;
  },
};

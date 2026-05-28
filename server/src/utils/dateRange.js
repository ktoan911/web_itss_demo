import { startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';

export function deadlineFilterToQuery(filter, now = new Date()) {
  switch (filter) {
    case 'today':
      return { deadline: { $gte: startOfDay(now), $lte: endOfDay(now) } };
    case 'upcoming':
      return { deadline: { $gt: now }, status: { $ne: 'Completed' } };
    case 'overdue':
      return { deadline: { $lt: now }, status: { $ne: 'Completed' } };
    case 'completed':
      return { status: 'Completed' };
    default:
      return {};
  }
}

export function parseStatRange(range, now = new Date()) {
  switch (range) {
    case '30days': return { start: startOfDay(subDays(now, 29)), end: now };
    case 'month':  return { start: startOfMonth(now), end: now };
    case '7days':
    default:       return { start: startOfDay(subDays(now, 6)), end: now };
  }
}

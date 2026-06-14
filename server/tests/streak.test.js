import { buildApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/createAuthedAgent.js';
import { User } from '../src/models/User.js';
import { streakService, computeNextStreak } from '../src/services/streak.service.js';

const app = buildApp();

const day = (iso) => new Date(iso);

describe('computeNextStreak (pure)', () => {
  it('starts at 1 when there is no prior focus date', () => {
    expect(computeNextStreak({ count: 0, lastFocusDate: null }, day('2026-06-14T10:00:00Z')))
      .toEqual({ count: 1, lastDay: '2026-06-14' });
  });

  it('increments when last focus was the previous day', () => {
    expect(computeNextStreak({ count: 3, lastFocusDate: day('2026-06-13T22:00:00Z') }, day('2026-06-14T01:00:00Z')))
      .toEqual({ count: 4, lastDay: '2026-06-14' });
  });

  it('stays the same when already counted today', () => {
    expect(computeNextStreak({ count: 5, lastFocusDate: day('2026-06-14T08:00:00Z') }, day('2026-06-14T20:00:00Z')))
      .toEqual({ count: 5, lastDay: '2026-06-14' });
  });

  it('resets to 1 after a gap', () => {
    expect(computeNextStreak({ count: 9, lastFocusDate: day('2026-06-10T08:00:00Z') }, day('2026-06-14T08:00:00Z')))
      .toEqual({ count: 1, lastDay: '2026-06-14' });
  });
});

describe('streakService.bump (persistence)', () => {
  it('writes the new streak to the user', async () => {
    const a = await createAuthedAgent(app);
    const r = await streakService.bump(a.userId, day('2026-06-14T10:00:00Z'));
    expect(r).toBe(1);
    const u = await User.findById(a.userId).select('pomodoroStreak');
    expect(u.pomodoroStreak.count).toBe(1);
  });

  it('is idempotent within the same day', async () => {
    const a = await createAuthedAgent(app);
    await streakService.bump(a.userId, day('2026-06-14T09:00:00Z'));
    const second = await streakService.bump(a.userId, day('2026-06-14T21:00:00Z'));
    expect(second).toBe(1);
  });
});

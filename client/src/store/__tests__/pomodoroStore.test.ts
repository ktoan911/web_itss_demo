import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoroStore } from '@/store/pomodoroStore';

vi.mock('@/api/pomodoroApi', () => ({
  pomodoroApi: { create: vi.fn().mockResolvedValue({}), recent: vi.fn() },
}));
vi.mock('@/lib/audio', () => ({
  playNotify: vi.fn(),
  preloadAudio: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock('@/lib/queryClient', () => ({ queryClient: { invalidateQueries: vi.fn() } }));

const reset = () =>
  usePomodoroStore.setState({
    mode: 'Focus',
    status: 'idle',
    durations: { focus: 25, shortBreak: 5, longBreak: 15 },
    endsAt: null,
    remainingMs: 25 * 60_000,
    startedAt: null,
    selectedTaskId: null,
    intervalId: null,
    focusCount: 0,
    estimateReachedTaskId: null,
  });

beforeEach(() => {
  vi.useFakeTimers();
  reset();
});

describe('pomodoroStore', () => {
  it('start sets endsAt and running', () => {
    const before = Date.now();
    usePomodoroStore.getState().start();
    const s = usePomodoroStore.getState();
    expect(s.status).toBe('running');
    expect(s.endsAt).toBeGreaterThanOrEqual(before + 25 * 60_000 - 5);
  });

  it('pause preserves remainingMs and resume continues', () => {
    usePomodoroStore.getState().start();
    vi.advanceTimersByTime(60_000);
    usePomodoroStore.getState().pause();
    const remaining = usePomodoroStore.getState().remainingMs;
    expect(remaining).toBeLessThanOrEqual(24 * 60_000 + 100);
    expect(remaining).toBeGreaterThan(23 * 60_000);
    usePomodoroStore.getState().start();
    expect(usePomodoroStore.getState().status).toBe('running');
  });

  it('hydrateFromSettings updates durations and remainingMs when idle', () => {
    usePomodoroStore.getState().hydrateFromSettings({
      focusDuration: 50,
      shortBreakDuration: 10,
      longBreakDuration: 20,
      notifySoundEnabled: false,
    });
    expect(usePomodoroStore.getState().durations.focus).toBe(50);
    expect(usePomodoroStore.getState().remainingMs).toBe(50 * 60_000);
    expect(usePomodoroStore.getState().soundEnabled).toBe(false);
  });

  it('reset returns to idle with full remaining', () => {
    usePomodoroStore.getState().start();
    vi.advanceTimersByTime(120_000);
    usePomodoroStore.getState().reset();
    const s = usePomodoroStore.getState();
    expect(s.status).toBe('idle');
    expect(s.remainingMs).toBe(25 * 60_000);
  });

  it('skip on Focus increments focusCount and switches mode', () => {
    usePomodoroStore.getState().skip();
    const s = usePomodoroStore.getState();
    expect(s.focusCount).toBe(1);
    expect(s.mode).toBe('ShortBreak');
  });

  it('auto-starts the next session when a session completes', async () => {
    usePomodoroStore.getState().start();
    // run out the 25-min Focus session → complete() switches mode and auto-starts the break
    await vi.advanceTimersByTimeAsync(25 * 60_000 + 300);
    const s = usePomodoroStore.getState();
    expect(s.mode).toBe('ShortBreak');
    expect(s.status).toBe('running');
    expect(s.endsAt).not.toBeNull();
  });
});

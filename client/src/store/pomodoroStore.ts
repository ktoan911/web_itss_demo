import { create } from 'zustand';
import type { PomodoroMode } from '@/types/pomodoro';
import { pomodoroApi } from '@/api/pomodoroApi';
import { queryClient } from '@/lib/queryClient';
import { playNotify } from '@/lib/audio';

type Status = 'idle' | 'running' | 'paused';

type Durations = { focus: number; shortBreak: number; longBreak: number };

type State = {
  mode: PomodoroMode;
  status: Status;
  durations: Durations;
  endsAt: number | null;
  remainingMs: number;
  startedAt: Date | null;
  selectedTaskId: string | null;
  intervalId: number | null;
  focusCount: number;
  // pending suggestion: when set, UI may show "task estimate reached" prompt
  estimateReachedTaskId: string | null;

  hydrateFromSettings: (s: { focusDuration: number; shortBreakDuration: number; longBreakDuration: number }) => void;
  setMode: (m: PomodoroMode) => void;
  selectTask: (id: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  acknowledgeEstimate: () => void;
};

const minutesMs = (m: number) => m * 60_000;

const durationFor = (state: Pick<State, 'mode' | 'durations'>) => {
  switch (state.mode) {
    case 'Focus': return state.durations.focus;
    case 'ShortBreak': return state.durations.shortBreak;
    case 'LongBreak': return state.durations.longBreak;
  }
};

export const usePomodoroStore = create<State>((set, get) => {
  function clearTick() {
    const { intervalId } = get();
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      set({ intervalId: null });
    }
  }

  function tick() {
    const { endsAt } = get();
    if (endsAt === null) return;
    if (Date.now() >= endsAt) complete();
  }

  async function complete() {
    clearTick();
    const { mode, durations, startedAt, selectedTaskId, focusCount } = get();
    if (mode === 'Focus' && startedAt) {
      const newCount = focusCount + 1;
      try {
        await pomodoroApi.create({
          taskId: selectedTaskId,
          mode: 'Focus',
          durationMinutes: durations.focus,
          startedAt: startedAt.toISOString(),
          endedAt: new Date().toISOString(),
          isCompleted: true,
        });
        queryClient.invalidateQueries({ queryKey: ['pomodoros'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['statistics'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (e) {
        // intentionally swallow — UI shows toast in caller
      }
      const nextMode: PomodoroMode = newCount % 4 === 0 ? 'LongBreak' : 'ShortBreak';
      set({
        focusCount: newCount,
        status: 'idle',
        endsAt: null,
        startedAt: null,
        mode: nextMode,
        remainingMs: minutesMs(nextMode === 'ShortBreak' ? durations.shortBreak : durations.longBreak),
        estimateReachedTaskId: selectedTaskId,
      });
    } else {
      set({
        status: 'idle',
        endsAt: null,
        mode: 'Focus',
        remainingMs: minutesMs(durations.focus),
      });
    }
    playNotify();
  }

  return {
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

    hydrateFromSettings: ({ focusDuration, shortBreakDuration, longBreakDuration }) => {
      const durations = { focus: focusDuration, shortBreak: shortBreakDuration, longBreak: longBreakDuration };
      set({ durations });
      if (get().status === 'idle') set({ remainingMs: minutesMs(durationFor({ mode: get().mode, durations })) });
    },

    setMode: (m) => {
      const { status } = get();
      if (status !== 'idle') return; // caller should have confirmed first
      const dur = durationFor({ mode: m, durations: get().durations });
      set({ mode: m, remainingMs: minutesMs(dur) });
    },

    selectTask: (id) => set({ selectedTaskId: id }),

    start: () => {
      const { status, mode, durations, remainingMs } = get();
      if (status === 'running') return;
      const ms = status === 'paused' ? remainingMs : minutesMs(durationFor({ mode, durations }));
      const endsAt = Date.now() + ms;
      const startedAt = mode === 'Focus' && status === 'idle' ? new Date() : get().startedAt;
      set({ status: 'running', endsAt, startedAt });
      const id = window.setInterval(tick, 250);
      set({ intervalId: id });
    },

    pause: () => {
      const { endsAt, status } = get();
      if (status !== 'running' || endsAt === null) return;
      const remainingMs = Math.max(0, endsAt - Date.now());
      clearTick();
      set({ status: 'paused', endsAt: null, remainingMs });
    },

    reset: () => {
      clearTick();
      const { mode, durations } = get();
      set({
        status: 'idle',
        endsAt: null,
        startedAt: null,
        remainingMs: minutesMs(durationFor({ mode, durations })),
      });
    },

    skip: () => {
      clearTick();
      const { mode, durations, focusCount } = get();
      const nextMode: PomodoroMode = mode === 'Focus'
        ? ((focusCount + 1) % 4 === 0 ? 'LongBreak' : 'ShortBreak')
        : 'Focus';
      const nextFocusCount = mode === 'Focus' ? focusCount + 1 : focusCount;
      set({
        status: 'idle',
        endsAt: null,
        startedAt: null,
        mode: nextMode,
        focusCount: nextFocusCount,
        remainingMs: minutesMs(durationFor({ mode: nextMode, durations })),
      });
    },

    acknowledgeEstimate: () => set({ estimateReachedTaskId: null }),
  };
});

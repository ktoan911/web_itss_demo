import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { Button } from '@/components/common/Button';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useRemainingMs } from '@/hooks/usePomodoroEngine';
import { unlockAudio } from '@/lib/audio';

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const colorByMode: Record<string, string> = {
  Focus: 'rgb(99 102 241)',
  ShortBreak: 'rgb(22 163 74)',
  LongBreak: 'rgb(37 99 235)',
};

export function PomodoroTimer({ taskTitle }: { taskTitle?: string | null }) {
  const status = usePomodoroStore((s) => s.status);
  const mode = usePomodoroStore((s) => s.mode);
  const durations = usePomodoroStore((s) => s.durations);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skip = usePomodoroStore((s) => s.skip);
  const remaining = useRemainingMs();

  const totalMs = (mode === 'Focus' ? durations.focus
                  : mode === 'ShortBreak' ? durations.shortBreak
                  : durations.longBreak) * 60_000;
  const progress = 1 - remaining / totalMs;

  const onStart = () => { unlockAudio(); start(); };

  return (
    <div className="flex flex-col items-center gap-6">
      <ProgressRing progress={progress} color={colorByMode[mode]}>
        <div className="text-center">
          <div className="text-5xl font-semibold tabular-nums">{fmt(remaining)}</div>
          <div className="mt-2 text-xs text-text-muted">
            {taskTitle ? `Focusing on: ${taskTitle}` : 'No task selected'}
          </div>
        </div>
      </ProgressRing>
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>Reset</Button>
        {status === 'running' ? (
          <Button size="lg" icon={<Pause className="h-5 w-5" />} onClick={pause}>Pause</Button>
        ) : (
          <Button size="lg" icon={<Play className="h-5 w-5" />} onClick={onStart}>Start</Button>
        )}
        <Button variant="secondary" icon={<SkipForward className="h-4 w-4" />} onClick={skip}>Skip</Button>
      </div>
    </div>
  );
}

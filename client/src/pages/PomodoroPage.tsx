import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  StickyNote,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';
import { useRecentSessionsQuery } from '@/hooks/queries/usePomodoroQueries';
import { useTasksQuery, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { useSettingsQuery } from '@/hooks/queries/useSettingsQueries';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useRemainingMs } from '@/hooks/usePomodoroEngine';
import { unlockAudio } from '@/lib/audio';
import type { PomodoroMode } from '@/types/pomodoro';
import { EstimateReachedDialog } from '@/components/pomodoro/EstimateReachedDialog';

const BACKGROUNDS = [
  '/backgrounds/forest1.jpg',
  '/backgrounds/forest2.jpg',
  '/backgrounds/forest3.jpg',
  '/backgrounds/forest4.jpg',
  '/backgrounds/forest5.jpg',
  '/backgrounds/forest6.jpg',
];

const QUOTES = [
  { text: 'Starve your distractions, feed your focus.', author: 'Unknown' },
  {
    text: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
  },
  { text: 'Concentrate all your thoughts upon the work at hand.', author: 'Alexander Graham Bell' },
  {
    text: 'The successful warrior is the average man, with laser-like focus.',
    author: 'Bruce Lee',
  },
  { text: 'Where focus goes, energy flows.', author: 'Tony Robbins' },
  {
    text: 'Do the hard jobs first. The easy jobs will take care of themselves.',
    author: 'Dale Carnegie',
  },
];

const MODE_LABELS: Record<PomodoroMode, string> = {
  Focus: 'Phiên tập trung',
  ShortBreak: 'Nghỉ ngắn',
  LongBreak: 'Nghỉ dài',
};

const fmtTime = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function PomodoroPage() {
  const navigate = useNavigate();
  const tasks = useTasksQuery({ status: undefined, sortBy: 'deadline' });
  useRecentSessionsQuery();
  useSettingsQuery();
  const complete = useMarkComplete();

  const mode = usePomodoroStore((s) => s.mode);
  const status = usePomodoroStore((s) => s.status);
  const setMode = usePomodoroStore((s) => s.setMode);
  const reset = usePomodoroStore((s) => s.reset);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const skip = usePomodoroStore((s) => s.skip);
  const selectTask = usePomodoroStore((s) => s.selectTask);
  const selectedTaskId = usePomodoroStore((s) => s.selectedTaskId);
  const estimateTaskId = usePomodoroStore((s) => s.estimateReachedTaskId);
  const ack = usePomodoroStore((s) => s.acknowledgeEstimate);

  const remaining = useRemainingMs();

  const [bgIndex] = useState(() => Math.floor(Math.random() * BACKGROUNDS.length));
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [muted, setMuted] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const focusables = useMemo(
    () => (tasks.data ?? []).filter((t) => t.status !== 'Completed'),
    [tasks.data],
  );
  const selectedTask = focusables.find((t) => t._id === selectedTaskId) || null;
  const estimateTask = (tasks.data ?? []).find((t) => t._id === estimateTaskId) || null;
  const showEstimate =
    !!estimateTaskId &&
    !!estimateTask &&
    estimateTask.status !== 'Completed' &&
    estimateTask.completedPomodoros >= estimateTask.estimatedPomodoros;

  useEffect(() => {
    if (selectedTask) setTaskInput(selectedTask.title);
  }, [selectedTask]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const onModeChange = (m: PomodoroMode) => {
    if (status !== 'idle') {
      const ok = window.confirm('Switch will reset the timer. Continue?');
      if (!ok) return;
      reset();
    }
    setMode(m);
  };

  const onStart = () => {
    unlockAudio();
    start();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* ignore */
    }
  };

  const playLabel =
    status === 'running' ? 'Tạm dừng' : status === 'paused' ? 'Tiếp tục' : 'Bắt đầu';

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      style={{
        backgroundImage: `url(${BACKGROUNDS[bgIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

      <button
        onClick={() => navigate('/dashboard')}
        aria-label="Quay lại"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full bg-black/30 px-3 py-2 text-sm backdrop-blur transition hover:bg-black/50"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="absolute left-20 top-7 z-10 flex items-center gap-3">
        <span className="text-2xl font-semibold tracking-tight">TaskFlow</span>
        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-white/70 sm:inline">
          Focus Workspace
        </span>
      </div>

      <div className="absolute right-6 top-6 z-10 max-w-sm text-right">
        <p className="text-sm italic text-white/85">{quote.text}</p>
        <p className="mt-1 text-xs text-white/60">— {quote.author}</p>
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          {showTaskPicker ? (
            <div className="mx-auto w-full max-w-md rounded-2xl bg-black/40 p-3 backdrop-blur">
              <select
                value={selectedTaskId ?? ''}
                onChange={(e) => {
                  selectTask(e.target.value || null);
                  setShowTaskPicker(false);
                }}
                onBlur={() => setShowTaskPicker(false)}
                autoFocus
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none [&>option]:bg-neutral-900"
              >
                <option value="">Không chọn nhiệm vụ</option>
                {focusables.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} — {t.completedPomodoros}/{t.estimatedPomodoros}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={() => setShowTaskPicker(true)}
              className="mx-auto block text-base font-light text-white/80 transition hover:text-white"
            >
              {taskInput || 'What are you working on?'}
            </button>
          )}
        </div>

        <div className="mt-6 select-none text-center font-light tabular-nums tracking-tight">
          <div className="text-[clamp(7rem,18vw,16rem)] leading-none">{fmtTime(remaining)}</div>
        </div>

        <p className="mt-6 text-sm text-white/80">{MODE_LABELS[mode]}</p>

        <div className="mt-8 flex items-center gap-6">
          <button
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? 'Bật âm' : 'Tắt âm'}
            className="rounded-full bg-black/25 p-3 text-white/85 backdrop-blur transition hover:bg-black/40"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            onClick={reset}
            aria-label="Đặt lại"
            className="rounded-full bg-black/25 p-3 text-white/85 backdrop-blur transition hover:bg-black/40"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={status === 'running' ? pause : onStart}
            className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 text-base font-medium text-white shadow-lg transition hover:bg-red-700"
          >
            {status === 'running' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            <span>{playLabel}</span>
          </button>

          <button
            onClick={skip}
            aria-label="Bỏ qua"
            className="rounded-full bg-black/25 p-3 text-white/85 backdrop-blur transition hover:bg-black/40"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            className="rounded-full bg-black/25 p-3 text-white/85 backdrop-blur transition hover:bg-black/40"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {(['Focus', 'ShortBreak', 'LongBreak'] as PomodoroMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`rounded-full px-3 py-1 text-xs backdrop-blur transition ${
                mode === m
                  ? 'bg-white/25 text-white'
                  : 'bg-black/20 text-white/70 hover:bg-black/35'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <button
        aria-label="Ghi chú"
        className="absolute bottom-6 left-6 z-10 rounded-full bg-black/30 p-3 text-white/85 backdrop-blur transition hover:bg-black/50"
        onClick={() => toast.info('Ghi chú phiên (chưa khả dụng)')}
      >
        <StickyNote className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3">
        <button
          aria-label="Âm thanh nền"
          className="rounded-full bg-black/30 p-3 text-white/85 backdrop-blur transition hover:bg-black/50"
          onClick={() => toast.info('Âm thanh nền (chưa khả dụng)')}
        >
          <Waves className="h-5 w-5" />
        </button>
        <button
          aria-label="Nhạc"
          className="rounded-full bg-black/30 p-3 text-white/85 backdrop-blur transition hover:bg-black/50"
          onClick={() => toast.info('Nhạc tập trung (chưa khả dụng)')}
        >
          <ListMusic className="h-5 w-5" />
        </button>
      </div>

      <EstimateReachedDialog
        open={showEstimate}
        taskTitle={estimateTask?.title}
        onKeepGoing={ack}
        onMarkComplete={() => {
          if (!estimateTask) return ack();
          complete.mutate(estimateTask._id, {
            onSuccess: () => {
              toast.success('Task completed');
              ack();
            },
            onError: () => {
              toast.error('Failed to complete');
              ack();
            },
          });
        }}
      />
    </div>
  );
}

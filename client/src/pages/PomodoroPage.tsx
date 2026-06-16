import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Flame,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  StickyNote,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRecentSessionsQuery } from '@/hooks/queries/usePomodoroQueries';
import { useTasksQuery, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { useUpdateSettings } from '@/hooks/queries/useSettingsQueries';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useSoundStore } from '@/store/soundStore';
import { useRemainingMs } from '@/hooks/usePomodoroEngine';
import { useResolvedBackground } from '@/hooks/useBackgrounds';
import { unlockAudio } from '@/lib/audio';
import type { PomodoroMode } from '@/types/pomodoro';
import { EstimateReachedDialog } from '@/components/pomodoro/EstimateReachedDialog';
import { SoundControls } from '@/components/pomodoro/SoundControls';
import { BackgroundGallery } from '@/components/pomodoro/BackgroundGallery';

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

const MODE_KEY: Record<PomodoroMode, string> = {
  Focus: 'focus',
  ShortBreak: 'shortBreak',
  LongBreak: 'longBreak',
};

const fmtTime = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const TEXT_SHADOW = '0 2px 12px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.6)';

export default function PomodoroPage() {
  const { t } = useTranslation('pomodoro');
  const navigate = useNavigate();
  const tasks = useTasksQuery({ status: undefined, sortBy: 'deadline' });
  useRecentSessionsQuery();
  const complete = useMarkComplete();
  const updateSettings = useUpdateSettings();
  const dash = useDashboardQuery();
  const streak = dash.data?.streak ?? 0;

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

  const masterMuted = useSoundStore((s) => s.masterMuted);
  const toggleMaster = useSoundStore((s) => s.toggleMaster);
  const soundEnabled = usePomodoroStore((s) => s.soundEnabled);
  const setSoundEnabled = usePomodoroStore((s) => s.setSoundEnabled);

  const remaining = useRemainingMs();
  const background = useResolvedBackground();

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
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
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const onModeChange = (m: PomodoroMode) => {
    if (status !== 'idle') {
      const ok = window.confirm(t('confirm.switchReset'));
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
    status === 'running'
      ? t('controls.pause')
      : status === 'paused'
        ? t('controls.resume')
        : t('controls.start');

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      style={{
        backgroundImage: background ? `url(${background})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65" />

      <button
        onClick={() => navigate('/dashboard')}
        aria-label={t('controls.back')}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-sm backdrop-blur transition hover:bg-black/60"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div
        className="absolute left-20 top-7 z-10 flex items-center gap-3"
        style={{ textShadow: TEXT_SHADOW }}
      >
        <span className="text-2xl font-semibold tracking-tight">Task88</span>
        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-white/80 sm:inline">
          {t('workspace.subtitle')}
        </span>
      </div>

      {streak > 0 && (
        <div
          className="absolute left-6 top-16 z-10 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-sm backdrop-blur"
          style={{ textShadow: TEXT_SHADOW }}
          title={t('streak.title', { count: streak })}
        >
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="font-medium">{streak}</span>
        </div>
      )}

      <div
        className="absolute right-6 top-6 z-10 max-w-sm text-right"
        style={{ textShadow: TEXT_SHADOW }}
      >
        <p className="text-sm italic text-white">{quote.text}</p>
        <p className="mt-1 text-xs text-white/80">— {quote.author}</p>
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          {showTaskPicker ? (
            <div className="mx-auto w-full max-w-md rounded-2xl bg-black/55 p-3 shadow-xl backdrop-blur">
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
                <option value="">{t('taskPicker.noTask')}</option>
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
              className="mx-auto block rounded-full bg-black/30 px-5 py-2 text-lg font-medium text-white backdrop-blur-sm transition hover:bg-black/45"
              style={{ textShadow: TEXT_SHADOW }}
            >
              {selectedTask ? selectedTask.title : t('taskPicker.prompt')}
            </button>
          )}
        </div>

        <div
          className="mt-6 select-none text-center font-light tabular-nums tracking-tight"
          style={{ textShadow: '0 4px 24px rgba(0,0,0,0.55)' }}
        >
          <div className="text-[clamp(7rem,18vw,16rem)] leading-none">{fmtTime(remaining)}</div>
        </div>

        <p className="mt-6 text-sm text-white" style={{ textShadow: TEXT_SHADOW }}>
          {t(`modeStatus.${MODE_KEY[mode]}`)}
        </p>

        <div className="mt-8 flex items-center gap-6">
          <button
            onClick={toggleMaster}
            aria-label={masterMuted ? t('controls.unmuteMusic') : t('controls.muteMusic')}
            title={masterMuted ? t('controls.unmuteMusic') : t('controls.muteMusic')}
            className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
          >
            {masterMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next); // optimistic
              updateSettings.mutate(
                { notifySoundEnabled: next },
                { onError: () => setSoundEnabled(!next) },
              );
              toast.info(next ? t('toast.timerSoundOn') : t('toast.timerSoundOff'));
            }}
            aria-label={soundEnabled ? t('controls.timerSoundOff') : t('controls.timerSoundOn')}
            title={soundEnabled ? t('controls.timerSoundOff') : t('controls.timerSoundOn')}
            className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
          >
            {soundEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </button>

          <button
            onClick={reset}
            aria-label={t('controls.reset')}
            className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            data-tour="pomodoro-start"
            onClick={status === 'running' ? pause : onStart}
            className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 text-base font-medium text-white shadow-lg transition hover:bg-red-700"
          >
            {status === 'running' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            <span>{playLabel}</span>
          </button>

          <button
            onClick={skip}
            aria-label={t('controls.skip')}
            className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? t('controls.exitFullscreen') : t('controls.fullscreen')}
            className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
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
                  : 'bg-black/30 text-white/85 hover:bg-black/45'
              }`}
            >
              {t(`modeStatus.${MODE_KEY[m]}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
        <BackgroundGallery />
        <button
          aria-label={t('controls.notes')}
          className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
          onClick={() => toast.info(t('toast.notesComingSoon'))}
        >
          <StickyNote className="h-5 w-5" />
        </button>
      </div>

      <SoundControls />

      <EstimateReachedDialog
        open={showEstimate}
        taskTitle={estimateTask?.title}
        onKeepGoing={ack}
        onMarkComplete={() => {
          if (!estimateTask) return ack();
          complete.mutate(estimateTask._id, {
            onSuccess: () => {
              toast.success(t('toast.taskCompleted'));
              ack();
            },
            onError: () => {
              toast.error(t('toast.failedComplete'));
              ack();
            },
          });
        }}
      />
    </div>
  );
}

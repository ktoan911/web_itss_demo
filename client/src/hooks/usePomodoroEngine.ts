import { useEffect, useState } from 'react';
import { usePomodoroStore } from '@/store/pomodoroStore';

export function useRemainingMs() {
  const status = usePomodoroStore((s) => s.status);
  const endsAt = usePomodoroStore((s) => s.endsAt);
  const remainingMs = usePomodoroStore((s) => s.remainingMs);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [status]);

  if (status === 'running' && endsAt !== null) {
    return Math.max(0, endsAt - Date.now());
  }
  return remainingMs;
}

import { useEffect, useMemo, useState } from 'react';
import { useSettingsQuery } from '@/hooks/queries/useSettingsQueries';
import { DEFAULT_BACKGROUNDS, SEQ_INDEX_KEY, BG_ROTATE_MS } from '@/lib/backgrounds';
import type { BackgroundMode } from '@/types/settings';

// Shared background source for PomodoroPage and BackgroundGallery: default images
// merged with the user's uploads, plus the current mode and selected image (defaults applied).
export function useBackgrounds() {
  const settings = useSettingsQuery();
  const uploaded = useMemo(
    () => settings.data?.backgroundUrls ?? [],
    [settings.data?.backgroundUrls],
  );
  const all = useMemo(() => [...DEFAULT_BACKGROUNDS, ...uploaded], [uploaded]);
  const mode: BackgroundMode = settings.data?.backgroundMode ?? 'random';
  const selected = settings.data?.backgroundSelected ?? '';
  return { ready: !!settings.data, all, uploaded, mode, selected };
}

// Resolves the background image to display.
// - unchange: always the picked image (first image as fallback).
// - random / sequence: rotate within the session every BG_ROTATE_MS. Sequence
//   persists its index so the order continues across reloads.
export function useResolvedBackground(): string | undefined {
  const { ready, all, mode, selected } = useBackgrounds();
  const [background, setBackground] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ready || all.length === 0) return;

    if (mode === 'unchange') {
      setBackground(selected || all[0]);
      return;
    }

    const pickRandom = () => all[Math.floor(Math.random() * all.length)];
    const advanceSequence = () => {
      const prev = Number(localStorage.getItem(SEQ_INDEX_KEY) ?? '-1');
      const idx = (prev + 1) % all.length;
      localStorage.setItem(SEQ_INDEX_KEY, String(idx));
      return all[idx];
    };
    const next = () => (mode === 'sequence' ? advanceSequence() : pickRandom());

    setBackground(next());
    const id = window.setInterval(() => setBackground(next()), BG_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [ready, mode, selected, all]);

  return background;
}

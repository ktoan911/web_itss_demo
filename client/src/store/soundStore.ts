import { create } from 'zustand';

export type SoundTrack = { file: string; label: string };
export type SoundManifest = { ambient: SoundTrack[]; music: SoundTrack[] };

type Channel = 'ambient' | 'music';

type State = {
  manifest: SoundManifest;
  loaded: boolean;
  ambientTrack: string | null; // file
  musicTrack: string | null; // file
  ambientVolume: number; // 0..1
  musicVolume: number;
  masterMuted: boolean;
  loadManifest: () => Promise<void>;
  setTrack: (channel: Channel, file: string | null) => void;
  setVolume: (channel: Channel, v: number) => void;
  toggleMaster: () => void;
};

const audioMap: Record<Channel, HTMLAudioElement | null> = {
  ambient: null,
  music: null,
};

function ensureAudio(channel: Channel) {
  if (audioMap[channel]) return audioMap[channel]!;
  const a = new Audio();
  a.preload = 'auto';
  a.loop = channel === 'ambient';
  a.crossOrigin = 'anonymous';
  audioMap[channel] = a;
  if (channel === 'music') {
    a.addEventListener('ended', () => {
      // auto-pick next music track in the same list when finished
      const s = useSoundStore.getState();
      const list = s.manifest.music;
      if (!list.length || !s.musicTrack) return;
      const idx = list.findIndex((t) => t.file === s.musicTrack);
      const next = list[(idx + 1) % list.length];
      s.setTrack('music', next.file);
    });
  }
  return a;
}

export const useSoundStore = create<State>((set, get) => ({
  manifest: { ambient: [], music: [] },
  loaded: false,
  ambientTrack: null,
  musicTrack: null,
  ambientVolume: 0.6,
  musicVolume: 0.5,
  masterMuted: false,

  async loadManifest() {
    if (get().loaded) return;
    try {
      const res = await fetch('/sounds/manifest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest 404');
      const m = (await res.json()) as SoundManifest;
      set({ manifest: m, loaded: true });
    } catch {
      set({ manifest: { ambient: [], music: [] }, loaded: true });
    }
  },

  setTrack(channel, file) {
    const audio = ensureAudio(channel);
    if (!file) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      set(channel === 'ambient' ? { ambientTrack: null } : { musicTrack: null });
      return;
    }
    const src = `/sounds/${channel}/${file}`;
    if (audio.src.endsWith(src)) {
      // same track: just toggle play
      if (audio.paused) audio.play().catch(() => {});
      return;
    }
    audio.src = src;
    audio.volume = get().masterMuted
      ? 0
      : channel === 'ambient'
        ? get().ambientVolume
        : get().musicVolume;
    audio.play().catch(() => {
      // user-gesture required; UI button click satisfies this
    });
    set(channel === 'ambient' ? { ambientTrack: file } : { musicTrack: file });
  },

  setVolume(channel, v) {
    const clamped = Math.max(0, Math.min(1, v));
    const audio = ensureAudio(channel);
    if (!get().masterMuted) audio.volume = clamped;
    set(channel === 'ambient' ? { ambientVolume: clamped } : { musicVolume: clamped });
  },

  toggleMaster() {
    const next = !get().masterMuted;
    set({ masterMuted: next });
    const a = ensureAudio('ambient');
    const m = ensureAudio('music');
    a.volume = next ? 0 : get().ambientVolume;
    m.volume = next ? 0 : get().musicVolume;
  },
}));

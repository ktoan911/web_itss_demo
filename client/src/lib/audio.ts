let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

// Call inside a user gesture (e.g. clicking "Start") to unlock browser autoplay.
export async function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') {
    try {
      await c.resume();
    } catch {
      // browser hasn't allowed playback yet — retried on the next play
    }
  }
}

// A soft chime note: sine wave + amplitude envelope to avoid clicks at start/end.
function tone(c: AudioContext, freq: number, startAt: number, duration: number, peak = 0.25) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = c.currentTime + startAt;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export type NotifyKind = 'focus' | 'break';

// End-of-timer chime, synthesized with the Web Audio API (no mp3 file, works offline).
// - 'focus': a focus session just ended, break time → gentle rising melody.
// - 'break': a break just ended, back to work → two clearer "ping" tones.
export function playNotify(kind: NotifyKind = 'focus') {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});

  if (kind === 'focus') {
    tone(c, 523.25, 0, 0.45); // C5
    tone(c, 659.25, 0.18, 0.45); // E5
    tone(c, 783.99, 0.36, 0.6); // G5
  } else {
    tone(c, 880, 0, 0.4, 0.3); // A5
    tone(c, 880, 0.28, 0.5, 0.3); // A5
  }
}

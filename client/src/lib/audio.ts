let audio: HTMLAudioElement | null = null;
let unlocked = false;

export function preloadAudio() {
  if (audio) return audio;
  audio = new Audio('https://cdn.jsdelivr.net/gh/anars/blank-audio/250-milliseconds-of-silence.mp3');
  audio.preload = 'auto';
  return audio;
}

export async function unlockAudio() {
  if (unlocked) return;
  const a = preloadAudio();
  try {
    await a.play();
    a.pause();
    a.currentTime = 0;
    unlocked = true;
  } catch {
    // user has not interacted yet
  }
}

export function playNotify() {
  const a = preloadAudio();
  a.currentTime = 0;
  a.play().catch(() => {});
}

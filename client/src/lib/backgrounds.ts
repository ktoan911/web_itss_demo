// Default backgrounds shipped with the app (under client/public/backgrounds).
// Shared between PomodoroPage and BackgroundGallery.
export const DEFAULT_BACKGROUNDS = [
  '/backgrounds/forest1.jpg',
  '/backgrounds/forest2.jpg',
  '/backgrounds/forest3.jpg',
  '/backgrounds/forest4.jpg',
  '/backgrounds/forest5.jpg',
  '/backgrounds/forest6.jpg',
];

export const SEQ_INDEX_KEY = 'pomodoro:bgSeqIndex';

// Interval (ms) for auto-rotating the background in random/sequence mode within a session.
export const BG_ROTATE_MS = 60_000;

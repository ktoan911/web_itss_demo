import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

type TourStep = {
  route: string;
  element?: string;
  title: string;
  description: string;
};

// One linear tour across every page. Steps without an `element` show a centered
// popover; steps whose anchor is missing at highlight time also degrade to centered
// (driver.js handles a null querySelector by centering), so the tour never breaks.
const TOUR: TourStep[] = [
  {
    route: '/dashboard',
    title: 'Welcome to Task88',
    description: 'A quick tour of the main areas. Use Next / Back to move, or press Esc to exit anytime.',
  },
  {
    route: '/dashboard',
    element: '[data-tour="deadline-banner"]',
    title: 'Deadline reminders',
    description: 'Overdue and soon-due tasks surface here. Click one to open it.',
  },
  {
    route: '/dashboard',
    element: '[data-tour="streak"]',
    title: 'Focus streak',
    description: 'Complete one Pomodoro focus session a day to grow your streak.',
  },
  {
    route: '/tasks',
    element: '[data-tour="add-task"]',
    title: 'Add a task',
    description: 'Create tasks with a deadline, priority, and an estimated number of Pomodoros.',
  },
  {
    route: '/tasks',
    element: '[data-tour="task-filters"]',
    title: 'Find & organize',
    description: 'Search, filter by status or tag, and switch between grid, list, and kanban views.',
  },
  {
    route: '/pomodoro',
    element: '[data-tour="pomodoro-start"]',
    title: 'Focus with Pomodoro',
    description: 'Start a focus session here. Finishing one each day keeps your streak alive.',
  },
  {
    route: '/calendar',
    element: '[data-tour="calendar"]',
    title: 'Calendar view',
    description: 'See tasks laid out by deadline. Use the Back / Next buttons to move between months.',
  },
  {
    route: '/statistics',
    element: '[data-tour="stats-range"]',
    title: 'Track your progress',
    description: 'Review task completion and focus-time trends over different time ranges.',
  },
  {
    route: '/settings',
    element: '[data-tour="reminder-window"]',
    title: 'Reminder window',
    description: 'Choose how many hours before a deadline you want to be reminded.',
  },
  {
    route: '/settings',
    title: "You're all set",
    description: 'Reopen this tour anytime with the ? button in the header. Happy focusing!',
  },
];

const TOUR_DONE_KEY = 'task88-tour-done';

// driver.js overlays live on document.body, independent of the React tree, so a
// single active instance survives route changes during a cross-page tour.
let active: Driver | null = null;

// navigate is registered by an always-mounted bridge so it stays valid even when
// the page that triggered the tour (e.g. the Header on protected routes) unmounts
// — notably when the tour visits /pomodoro, which renders outside AppLayout.
let tourNavigate: ((path: string) => void) | null = null;

export function setTourNavigate(fn: (path: string) => void): void {
  tourNavigate = fn;
}

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_DONE_KEY, '1');
  } catch {
    /* ignore unavailable storage */
  }
}

function waitForElement(selector: string | undefined, timeoutMs = 4000): Promise<void> {
  if (!selector || document.querySelector(selector)) return Promise.resolve();
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (document.querySelector(selector) || Date.now() - start > timeoutMs) return resolve();
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function toDriveSteps(steps: TourStep[]): DriveStep[] {
  return steps.map((s) => ({
    element: s.element,
    popover: { title: s.title, description: s.description },
  }));
}

export function runFullTour(): void {
  if (!tourNavigate) return;
  const navigate = tourNavigate;
  if (active) {
    active.destroy();
    active = null;
  }

  const steps = TOUR;

  const goTo = async (index: number) => {
    const step = steps[index];
    if (window.location.pathname !== step.route) {
      navigate(step.route);
      await waitForElement(step.element);
    }
    active?.moveTo(index);
  };

  active = driver({
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: 'close',
    steps: toDriveSteps(steps),
    onNextClick: () => {
      const i = active?.getActiveIndex() ?? 0;
      if (i >= steps.length - 1) {
        active?.destroy();
        return;
      }
      void goTo(i + 1);
    },
    onPrevClick: () => {
      const i = active?.getActiveIndex() ?? 0;
      if (i <= 0) return;
      void goTo(i - 1);
    },
    onDestroyed: () => {
      markTourSeen();
      active = null;
    },
  });

  // Kick off: land on the first step's route, wait for its anchor, then start.
  void (async () => {
    const first = steps[0];
    if (window.location.pathname !== first.route) navigate(first.route);
    await waitForElement(first.element);
    active?.drive(0);
  })();
}

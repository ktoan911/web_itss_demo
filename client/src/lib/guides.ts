import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const guides: Record<string, DriveStep[]> = {
  '/dashboard': [
    {
      element: '[data-tour="deadline-banner"]',
      popover: {
        title: 'Deadline reminders',
        description: 'Overdue and soon-due tasks surface here. Click one to open it.',
      },
    },
    {
      element: '[data-tour="streak"]',
      popover: {
        title: 'Focus streak',
        description: 'Complete one Pomodoro focus session a day to grow your streak.',
      },
    },
  ],
  '/settings': [
    {
      element: '[data-tour="reminder-window"]',
      popover: {
        title: 'Reminder window',
        description: 'Choose how many hours before a deadline you want to be reminded.',
      },
    },
  ],
};

export function hasGuide(path: string): boolean {
  return (guides[path]?.length ?? 0) > 0;
}

export function runGuide(path: string): void {
  const steps = guides[path];
  if (!steps || steps.length === 0) return;
  // Only show steps whose anchor is actually on the page right now.
  const present = steps.filter(
    (s) => typeof s.element === 'string' && document.querySelector(s.element),
  );
  if (present.length === 0) return;
  driver({ showProgress: true, steps: present }).drive();
}

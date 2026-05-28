import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getInitials } from '@/utils/formatters';
import { useState } from 'react';

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'My Tasks',
  '/pomodoro': 'Pomodoro',
  '/calendar': 'Calendar',
  '/statistics': 'Statistics',
  '/settings': 'Settings',
};

export function Header({ onAddTask, onMenu }: { onAddTask?: () => void; onMenu?: () => void }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [, setOpen] = useState(false);
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button onClick={onMenu} className="rounded-2xl p-2 hover:bg-bg lg:hidden" aria-label="Open menu">
            ☰
          </button>
        )}
        <h1 className="text-lg font-semibold">{titleMap[pathname] ?? ''}</h1>
      </div>
      <div className="flex items-center gap-2">
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="hidden rounded-2xl bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:inline-flex"
          >
            + Add Task
          </button>
        )}
        <NotificationBell />
        <ThemeToggle />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700"
          aria-label="User menu"
        >
          {user ? getInitials(user.fullName) : '?'}
        </button>
      </div>
    </header>
  );
}

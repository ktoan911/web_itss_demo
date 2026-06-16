import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { HelpButton } from '@/components/common/HelpButton';
import { getInitials } from '@/utils/formatters';
import { useState } from 'react';

const titleKeyMap: Record<string, string> = {
  '/dashboard': 'titles.dashboard',
  '/tasks': 'titles.tasks',
  '/pomodoro': 'titles.pomodoro',
  '/calendar': 'titles.calendar',
  '/statistics': 'titles.statistics',
  '/settings': 'titles.settings',
};

export function Header({ onAddTask, onMenu }: { onAddTask?: () => void; onMenu?: () => void }) {
  const { pathname } = useLocation();
  const { t } = useTranslation('nav');
  const { user } = useAuth();
  const [, setOpen] = useState(false);
  const titleKey = titleKeyMap[pathname];
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button onClick={onMenu} className="rounded-2xl p-2 hover:bg-bg lg:hidden" aria-label={t('openMenu')}>
            ☰
          </button>
        )}
        <h1 className="text-lg font-semibold">{titleKey ? t(titleKey) : ''}</h1>
      </div>
      <div className="flex items-center gap-2">
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="hidden rounded-2xl bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:inline-flex"
          >
            {t('addTask')}
          </button>
        )}
        <LanguageSwitcher />
        <HelpButton />
        <NotificationBell />
        <ThemeToggle />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700"
          aria-label={t('userMenu')}
        >
          {user ? getInitials(user.fullName) : '?'}
        </button>
      </div>
    </header>
  );
}

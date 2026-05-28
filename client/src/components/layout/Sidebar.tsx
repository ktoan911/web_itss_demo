import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Timer className="h-6 w-6 text-primary-600" />
        <span className="text-lg font-semibold">Task88</span>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10'
                  : 'text-text hover:bg-bg',
              )
            }
          >
            <it.icon className="h-4 w-4" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-text-muted hover:bg-bg"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}

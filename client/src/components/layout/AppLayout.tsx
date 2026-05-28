import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMeQuery } from '@/hooks/queries/useAuthQueries';
import { useAuthStore } from '@/store/authStore';
import { useSettingsQuery } from '@/hooks/queries/useSettingsQueries';
import { useThemeStore } from '@/store/themeStore';
import { usePomodoroStore } from '@/store/pomodoroStore';

export default function AppLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const { data: me, isError } = useMeQuery();
  const { data: settings } = useSettingsQuery();
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = usePomodoroStore((s) => s.hydrateFromSettings);
  const navigate = useNavigate();
  const loc = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { if (me) setUser(me); }, [me, setUser]);
  useEffect(() => { if (isError) navigate('/login'); }, [isError, navigate]);
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      hydrate({
        focusDuration: settings.focusDuration,
        shortBreakDuration: settings.shortBreakDuration,
        longBreakDuration: settings.longBreakDuration,
      });
    }
  }, [settings, setTheme, hydrate]);
  useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);

  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <Header onMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

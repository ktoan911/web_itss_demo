import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-2xl p-2 text-text-muted hover:bg-bg"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

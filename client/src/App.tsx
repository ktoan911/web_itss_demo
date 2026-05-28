import { useTheme } from '@/hooks/useTheme';

export default function App() {
  useTheme();
  return (
    <div className="flex min-h-full items-center justify-center">
      <p className="text-text-muted">TaskFlow client booting…</p>
    </div>
  );
}

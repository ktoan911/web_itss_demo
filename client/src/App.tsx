import { useTheme } from '@/hooks/useTheme';
import AppRouter from '@/routes/AppRouter';

export default function App() {
  useTheme();
  return <AppRouter />;
}

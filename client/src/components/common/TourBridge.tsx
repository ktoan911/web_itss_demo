import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { setTourNavigate, hasSeenTour, runFullTour } from '@/lib/guides';

// Always mounted inside the Router so the tour's navigate() stays valid even when
// the page that started it unmounts (e.g. /pomodoro renders outside AppLayout).
// Also auto-launches the full tour once for a freshly authenticated user.
export function TourBridge() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    setTourNavigate((path) => navigate(path));
  }, [navigate]);

  useEffect(() => {
    if (!token || hasSeenTour()) return;
    // Defer so the first protected page has a chance to mount its anchors.
    const id = window.setTimeout(() => runFullTour(), 600);
    return () => window.clearTimeout(id);
  }, [token]);

  return null;
}

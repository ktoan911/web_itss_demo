import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Loading } from '@/components/common/Loading';

const LoginPage      = lazy(() => import('@/pages/LoginPage'));
const RegisterPage   = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage  = lazy(() => import('@/pages/DashboardPage'));
const TasksPage      = lazy(() => import('@/pages/TasksPage'));
const PomodoroPage   = lazy(() => import('@/pages/PomodoroPage'));
const CalendarPage   = lazy(() => import('@/pages/CalendarPage'));
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'));
const SettingsPage   = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage   = lazy(() => import('@/pages/NotFoundPage'));

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

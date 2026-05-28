import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-text-muted">Page not found.</p>
      <Link to="/dashboard" className="text-primary-600 hover:underline">Go to dashboard</Link>
    </div>
  );
}

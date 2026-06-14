import { HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { hasGuide, runGuide } from '@/lib/guides';

export function HelpButton() {
  const { pathname } = useLocation();
  if (!hasGuide(pathname)) return null;
  return (
    <button
      onClick={() => runGuide(pathname)}
      aria-label="Show page guide"
      title="Show page guide"
      className="rounded-2xl p-2 text-text-muted hover:bg-bg"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}

import { HelpCircle } from 'lucide-react';
import { runFullTour } from '@/lib/guides';

export function HelpButton() {
  return (
    <button
      onClick={() => runFullTour()}
      aria-label="Show app guide"
      title="Show app guide"
      className="rounded-2xl p-2 text-text-muted hover:bg-bg"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}

import { Button } from './Button';

type Props = { title?: string; description?: string; onRetry?: () => void };

export function ErrorState({ title = 'Something went wrong', description, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <h3 className="text-sm font-semibold text-priority-high">{title}</h3>
      {description && <p className="max-w-sm text-sm text-text-muted">{description}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

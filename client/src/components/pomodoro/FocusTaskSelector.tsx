import type { Task } from '@/types/task';

type Props = { tasks: Task[]; value: string | null; onChange: (id: string | null) => void };

export function FocusTaskSelector({ tasks, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Focus on</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="block w-72 rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
      >
        <option value="">No task</option>
        {tasks.map((t) => (
          <option key={t._id} value={t._id}>
            {t.title} — {t.completedPomodoros}/{t.estimatedPomodoros}
          </option>
        ))}
      </select>
    </div>
  );
}

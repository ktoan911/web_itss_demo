import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/common/Input';
import type { TaskListQuery } from '@/types/task';

export type View = 'grid' | 'list' | 'kanban';

type Props = {
  filters: TaskListQuery;
  onChange: (next: TaskListQuery) => void;
  view: View;
  onViewChange: (v: View) => void;
};

const VIEW_IDS: View[] = ['grid', 'list', 'kanban'];

export function TaskFilters({ filters, onChange, view, onViewChange }: Props) {
  const { t } = useTranslation('tasks');
  const set = (patch: Partial<TaskListQuery>) => onChange({ ...filters, ...patch });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-full sm:w-64">
        <Input
          label={t('filters.search.label')}
          placeholder={t('filters.search.placeholder')}
          value={filters.search ?? ''}
          onChange={(e) => set({ search: e.target.value || undefined })}
        />
        <Search className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-text-muted" />
      </div>
      <Select
        label={t('filters.status.label')}
        value={filters.status ?? ''}
        onChange={(v) => set({ status: (v || undefined) as any })}
        options={[
          ['', t('filters.all')],
          ['Todo', t('status.Todo')],
          ['InProgress', t('status.InProgress')],
          ['Completed', t('status.Completed')],
        ]}
      />
      <Select
        label={t('filters.priority.label')}
        value={filters.priority ?? ''}
        onChange={(v) => set({ priority: (v || undefined) as any })}
        options={[
          ['', t('filters.all')],
          ['Low', t('priority.Low')],
          ['Medium', t('priority.Medium')],
          ['High', t('priority.High')],
        ]}
      />
      <Select
        label={t('filters.deadline.label')}
        value={filters.deadlineFilter ?? ''}
        onChange={(v) => set({ deadlineFilter: (v || undefined) as any })}
        options={[
          ['', t('filters.all')],
          ['today', t('filters.deadline.today')],
          ['upcoming', t('filters.deadline.upcoming')],
          ['overdue', t('filters.deadline.overdue')],
          ['completed', t('filters.deadline.completed')],
        ]}
      />
      <Select
        label={t('filters.sort.label')}
        value={filters.sortBy ?? 'deadline'}
        onChange={(v) => set({ sortBy: v as any })}
        options={[
          ['deadline', t('filters.sort.deadline')],
          ['priority', t('filters.sort.priority')],
          ['newest', t('filters.sort.newest')],
        ]}
      />
      <div className="ml-auto inline-flex rounded-2xl border border-border bg-surface p-0.5">
        {VIEW_IDS.map((id) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`rounded-xl px-3 py-1.5 text-xs ${view === id ? 'bg-primary-50 text-primary-700' : 'text-text-muted'}`}
          >
            {t(`filters.views.${id}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

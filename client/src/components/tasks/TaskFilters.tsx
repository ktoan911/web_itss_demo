import { Search } from 'lucide-react';
import { Input } from '@/components/common/Input';
import type { TaskListQuery } from '@/types/task';

type Props = {
  filters: TaskListQuery;
  onChange: (next: TaskListQuery) => void;
  view: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
};

export function TaskFilters({ filters, onChange, view, onViewChange }: Props) {
  const set = (patch: Partial<TaskListQuery>) => onChange({ ...filters, ...patch });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-full sm:w-64">
        <Input
          label="Search"
          placeholder="Search by title…"
          value={filters.search ?? ''}
          onChange={(e) => set({ search: e.target.value || undefined })}
        />
        <Search className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-text-muted" />
      </div>
      <Select label="Status" value={filters.status ?? ''} onChange={(v) => set({ status: (v || undefined) as any })}
        options={[ ['', 'All'], ['Todo', 'Todo'], ['InProgress', 'In progress'], ['Completed', 'Completed'] ]} />
      <Select label="Priority" value={filters.priority ?? ''} onChange={(v) => set({ priority: (v || undefined) as any })}
        options={[ ['', 'All'], ['Low', 'Low'], ['Medium', 'Medium'], ['High', 'High'] ]} />
      <Select label="Deadline" value={filters.deadlineFilter ?? ''} onChange={(v) => set({ deadlineFilter: (v || undefined) as any })}
        options={[ ['', 'All'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed'] ]} />
      <Select label="Sort" value={filters.sortBy ?? 'deadline'} onChange={(v) => set({ sortBy: v as any })}
        options={[ ['deadline', 'Deadline'], ['priority', 'Priority'], ['newest', 'Newest'] ]} />
      <div className="ml-auto inline-flex rounded-2xl border border-border bg-surface p-0.5">
        <button onClick={() => onViewChange('grid')} className={`rounded-xl px-3 py-1.5 text-xs ${view === 'grid' ? 'bg-primary-50 text-primary-700' : 'text-text-muted'}`}>Grid</button>
        <button onClick={() => onViewChange('list')} className={`rounded-xl px-3 py-1.5 text-xs ${view === 'list' ? 'bg-primary-50 text-primary-700' : 'text-text-muted'}`}>List</button>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }:
  { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="block rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { CardSkeleton } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useTasksQuery, useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { useDebounce } from '@/hooks/useDebounce';
import type { Task, TaskListQuery } from '@/types/task';

export default function TasksPage() {
  const [rawFilters, setRawFilters] = useState<TaskListQuery>({ sortBy: 'deadline' });
  const debouncedSearch = useDebounce(rawFilters.search, 300);
  const filters = useMemo(() => ({ ...rawFilters, search: debouncedSearch }), [rawFilters, debouncedSearch]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const tasks = useTasksQuery(filters);
  const remove = useDeleteTask();
  const complete = useMarkComplete();

  const onComplete = (t: Task) =>
    complete.mutate(t._id, {
      onSuccess: () => toast.success('Task completed'),
      onError: () => toast.error('Failed to complete task'),
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>Add Task</Button>
      </div>

      <TaskFilters filters={rawFilters} onChange={setRawFilters} view={view} onViewChange={setView} />

      {tasks.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : tasks.isError ? (
        <ErrorState description="Couldn't load tasks." onRetry={() => tasks.refetch()} />
      ) : tasks.data && tasks.data.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Click + Add Task to get started."
          action={<Button onClick={() => setCreating(true)}>Add Task</Button>}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.data!.map((t) => (
            <TaskCard
              key={t._id} task={t}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onComplete={onComplete}
              onClick={setEditing}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.data!.map((t) => (
            <TaskRow key={t._id} task={t} onEdit={setEditing} onDelete={setConfirmDelete} onComplete={onComplete} />
          ))}
        </div>
      )}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} />
      <TaskFormModal open={!!editing} onClose={() => setEditing(null)} task={editing} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          remove.mutate(confirmDelete._id, {
            onSuccess: () => toast.success('Task deleted'),
            onError: () => toast.error('Failed to delete'),
          });
        }}
        title="Delete this task?"
        description={confirmDelete?.title}
        confirmText="Delete"
        danger
      />
    </div>
  );
}

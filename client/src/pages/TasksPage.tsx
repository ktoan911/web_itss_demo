import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTag = searchParams.get('tag') ?? undefined;
  const [rawFilters, setRawFilters] = useState<TaskListQuery>({ sortBy: 'deadline', tag: urlTag });

  useEffect(() => {
    setRawFilters((prev) => (prev.tag === urlTag ? prev : { ...prev, tag: urlTag }));
  }, [urlTag]);

  const debouncedSearch = useDebounce(rawFilters.search, 300);
  const filters = useMemo(
    () => ({ ...rawFilters, search: debouncedSearch }),
    [rawFilters, debouncedSearch],
  );
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

  const setTag = (tag: string | undefined) => {
    setRawFilters((prev) => ({ ...prev, tag }));
    setSearchParams(
      (sp) => {
        const next = new URLSearchParams(sp);
        if (tag) next.set('tag', tag);
        else next.delete('tag');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
          Add Task
        </Button>
      </div>

      <TaskFilters
        filters={rawFilters}
        onChange={setRawFilters}
        view={view}
        onViewChange={setView}
      />

      {filters.tag && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700 dark:bg-primary-500/10">
            Filtered by tag: <strong>#{filters.tag}</strong>
            <button
              type="button"
              onClick={() => setTag(undefined)}
              aria-label="Clear tag filter"
              className="rounded-full p-0.5 hover:bg-primary-100 dark:hover:bg-primary-500/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {tasks.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
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
              key={t._id}
              task={t}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onComplete={onComplete}
              onClick={setEditing}
              onTagClick={setTag}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.data!.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onComplete={onComplete}
              onTagClick={setTag}
            />
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

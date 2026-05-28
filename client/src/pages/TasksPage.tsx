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
import {
  useTasksQuery,
  useDeleteTask,
  useMarkComplete,
  useBulkDeleteTasks,
  useBulkCompleteTasks,
  useBulkChangePriority,
} from '@/hooks/queries/useTaskQueries';
import { useDebounce } from '@/hooks/useDebounce';
import type { Task, TaskListQuery } from '@/types/task';

type Priority = 'Low' | 'Medium' | 'High';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  const tasks = useTasksQuery(filters);
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  const bulkDelete = useBulkDeleteTasks();
  const bulkComplete = useBulkCompleteTasks();
  const bulkPriority = useBulkChangePriority();

  // Drop ids that disappear from the visible list (e.g. after a filter change).
  useEffect(() => {
    if (!tasks.data || selectedIds.size === 0) return;
    const visible = new Set(tasks.data.map((t) => t._id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [tasks.data, selectedIds.size]);

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

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllVisible = () => setSelectedIds(new Set((tasks.data ?? []).map((t) => t._id)));

  const selectionIds = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const allVisibleSelected =
    (tasks.data?.length ?? 0) > 0 && selectedIds.size === (tasks.data?.length ?? 0);

  const runBulkComplete = () =>
    bulkComplete.mutate(selectionIds, {
      onSuccess: (r) => {
        toast.success(`Completed ${r.count} task${r.count === 1 ? '' : 's'}`);
        clearSelection();
      },
      onError: () => toast.error('Failed to complete tasks'),
    });

  const runBulkPriority = (priority: Priority) => {
    setPriorityMenuOpen(false);
    bulkPriority.mutate(
      { ids: selectionIds, priority },
      {
        onSuccess: (r) => {
          toast.success(`Updated ${r.count} task${r.count === 1 ? '' : 's'}`);
          clearSelection();
        },
        onError: () => toast.error('Failed to change priority'),
      },
    );
  };

  const runBulkDelete = () =>
    bulkDelete.mutate(selectionIds, {
      onSuccess: (r) => {
        toast.success(`Deleted ${r.count} task${r.count === 1 ? '' : 's'}`);
        clearSelection();
      },
      onError: () => toast.error('Failed to delete tasks'),
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
          Add Task
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="border-primary-300 sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-2xl border bg-primary-50 px-4 py-2 shadow-sm dark:border-primary-500/40 dark:bg-primary-500/10">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-200">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={allVisibleSelected ? clearSelection : selectAllVisible}
            className="text-xs text-primary-700 underline-offset-2 hover:underline dark:text-primary-200"
          >
            {allVisibleSelected ? 'Clear' : 'Select all visible'}
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={runBulkComplete}
              loading={bulkComplete.isPending}
            >
              Mark complete
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPriorityMenuOpen((v) => !v)}
                loading={bulkPriority.isPending}
              >
                Set priority
              </Button>
              {priorityMenuOpen && (
                <div className="absolute right-0 z-30 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                  {(['Low', 'Medium', 'High'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => runBulkPriority(p)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-bg"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirmBulkDelete(true)}
              loading={bulkDelete.isPending}
            >
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Cancel
            </Button>
          </div>
        </div>
      )}

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
              selected={selectedIds.has(t._id)}
              onToggleSelect={toggleSelect}
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
              selected={selectedIds.has(t._id)}
              onToggleSelect={toggleSelect}
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
      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={runBulkDelete}
        title={`Delete ${selectedIds.size} task${selectedIds.size === 1 ? '' : 's'}?`}
        description="This action cannot be undone."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

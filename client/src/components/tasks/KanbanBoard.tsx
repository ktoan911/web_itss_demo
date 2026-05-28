import { useMemo } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, Edit2, GripVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskStatus } from '@/types/task';
import { OverdueBadge, PriorityBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';
import { useChangeStatus } from '@/hooks/queries/useTaskQueries';

type Props = {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
  onTagClick?: (tag: string) => void;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
};

const COLUMNS: { status: TaskStatus; title: string; accent: string }[] = [
  { status: 'Todo', title: 'Todo', accent: 'text-status-todo border-status-todo/40' },
  {
    status: 'InProgress',
    title: 'In Progress',
    accent: 'text-status-progress border-status-progress/40',
  },
  {
    status: 'Completed',
    title: 'Completed',
    accent: 'text-status-done border-status-done/40',
  },
];

export function KanbanBoard({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onTagClick,
  selected,
  onToggleSelect,
}: Props) {
  const changeStatus = useChangeStatus();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { Todo: [], InProgress: [], Completed: [] };
    tasks.forEach((t) => {
      map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    if (!task) return;
    // `over.id` may be a column status (when dropped on empty space)
    // or another task id (when dropped on a sortable card).
    const overId = String(over.id);
    let nextStatus: TaskStatus | undefined;
    if (overId === 'Todo' || overId === 'InProgress' || overId === 'Completed') {
      nextStatus = overId;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      nextStatus = overTask?.status;
    }
    if (!nextStatus || nextStatus === task.status) return;
    changeStatus.mutate(
      { id: task._id, status: nextStatus },
      {
        onError: () => toast.error('Failed to change status'),
      },
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = grouped[col.status];
          return (
            <KanbanColumn
              key={col.status}
              id={col.status}
              title={col.title}
              count={items.length}
              accent={col.accent}
            >
              <SortableContext
                items={items.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                {items.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border text-xs text-text-muted">
                    No tasks
                  </div>
                ) : (
                  items.map((t) => (
                    <KanbanCard
                      key={t._id}
                      task={t}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onComplete={onComplete}
                      onTagClick={onTagClick}
                      selected={selected?.has(t._id)}
                      onToggleSelect={onToggleSelect}
                    />
                  ))
                )}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
    </DndContext>
  );
}

type KanbanColumnProps = {
  id: TaskStatus;
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
};

function KanbanColumn({ id, title, count, accent, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-3 rounded-3xl border border-border bg-bg/40 p-3 transition',
        isOver && 'ring-primary-400 ring-2',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b px-1 pb-2 text-sm font-semibold',
          accent,
        )}
      >
        <span>{title}</span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">{count}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

type KanbanCardProps = {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
  onTagClick?: (tag: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
};

function KanbanCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onTagClick,
  selected,
  onToggleSelect,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  // Stop pointer events on action buttons / checkboxes / tag links so dragging
  // doesn't initiate when the user clicks them.
  const stopDrag = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        padded={false}
        className={cn(
          'cursor-grab p-3 active:cursor-grabbing',
          selected && 'ring-2 ring-primary-500',
        )}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            aria-label="Drag handle"
            className="-ml-1 mt-0.5 rounded p-0.5 text-text-muted hover:bg-bg"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect(task._id)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={stopDrag}
              aria-label={`Select task ${task.title}`}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-border text-primary-600 focus:ring-primary-500"
            />
          )}
          <button
            type="button"
            onClick={() => onEdit(task)}
            onPointerDown={stopDrag}
            className="flex-1 text-left"
          >
            <h3 className="line-clamp-2 text-sm font-semibold">{task.title}</h3>
          </button>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onPointerDown={stopDrag}
                onClick={() => onTagClick?.(tag)}
                className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] text-primary-700 transition hover:bg-primary-100 dark:bg-primary-500/10 dark:hover:bg-primary-500/20"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
          <Clock className="h-3 w-3" />
          <span>{formatDateTime(task.deadline)}</span>
          <span>·</span>
          <span>
            ⏱ {task.completedPomodoros}/{task.estimatedPomodoros}
          </span>
          {task.isOverdue && <OverdueBadge />}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5" onPointerDown={stopDrag}>
          {task.status !== 'Completed' && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Check className="h-3.5 w-3.5" />}
              onClick={() => onComplete(task)}
            >
              Done
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={<Edit2 className="h-3.5 w-3.5" />}
            onClick={() => onEdit(task)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => onDelete(task)}
          >
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

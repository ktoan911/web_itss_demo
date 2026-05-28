import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { taskFormSchema, type TaskFormValues } from '@/validators/task.schema';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useCreateTask, useUpdateTask } from '@/hooks/queries/useTaskQueries';
import type { Task } from '@/types/task';

type Props = {
  open: boolean; onClose: () => void; task?: Task | null;
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
};

export function TaskFormModal({ open, onClose, task }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const isEdit = !!task;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: '', description: '', deadline: '', priority: 'Medium', estimatedPomodoros: 1 },
  });

  useEffect(() => {
    if (open) {
      reset(task ? {
        title: task.title,
        description: task.description ?? '',
        deadline: toLocalInput(task.deadline),
        priority: task.priority,
        estimatedPomodoros: task.estimatedPomodoros,
      } : {
        title: '', description: '',
        deadline: toLocalInput(new Date(new Date().setHours(23, 59, 0, 0)).toISOString()),
        priority: 'Medium', estimatedPomodoros: 1,
      });
    }
  }, [open, task, reset]);

  const onSubmit = (v: TaskFormValues) => {
    const body = {
      ...v,
      description: v.description ?? '',
      deadline: new Date(v.deadline).toISOString(),
    };
    const success = (msg: string) => () => { toast.success(msg); onClose(); };
    const fail = (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Save failed');
    if (isEdit && task) update.mutate({ id: task._id, body }, { onSuccess: success('Task updated'), onError: fail });
    else create.mutate(body, { onSuccess: success('Task created'), onError: fail });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'New task'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Title" {...register('title')} error={errors.title?.message} />
        <Textarea label="Description" {...register('description')} error={errors.description?.message} />
        <Input label="Deadline" type="datetime-local" {...register('deadline')} error={errors.deadline?.message} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select className="mt-1 block w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm" {...register('priority')}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <Input label="Est. Pomodoros" type="number" min={1} {...register('estimatedPomodoros', { valueAsNumber: true })} error={errors.estimatedPomodoros?.message} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending || update.isPending}>{isEdit ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

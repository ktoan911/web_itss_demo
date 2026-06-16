import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { taskFormSchema, type TaskFormValues } from '@/validators/task.schema';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useCreateTask, useUpdateTask } from '@/hooks/queries/useTaskQueries';
import { getApiErrorMessage } from '@/utils/apiError';
import type { Task } from '@/types/task';

type Props = {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
};

export function TaskFormModal({ open, onClose, task }: Props) {
  const { t } = useTranslation('tasks');
  const create = useCreateTask();
  const update = useUpdateTask();
  const isEdit = !!task;
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      priority: 'Medium',
      estimatedPomodoros: 1,
    },
  });

  useEffect(() => {
    if (open) {
      setTags(task?.tags ?? []);
      setTagInput('');
      reset(
        task
          ? {
              title: task.title,
              description: task.description ?? '',
              deadline: toLocalInput(task.deadline),
              priority: task.priority,
              estimatedPomodoros: task.estimatedPomodoros,
            }
          : {
              title: '',
              description: '',
              deadline: toLocalInput(new Date(new Date().setHours(23, 59, 0, 0)).toISOString()),
              priority: 'Medium',
              estimatedPomodoros: 1,
            },
      );
    }
  }, [open, task, reset]);

  const onSubmit = (v: TaskFormValues) => {
    const body = {
      ...v,
      tags,
      description: v.description ?? '',
      deadline: new Date(v.deadline).toISOString(),
    };
    const success = (msg: string) => () => {
      toast.success(msg);
      onClose();
    };
    const fail = (err: any) => toast.error(getApiErrorMessage(err, t('toast.saveFailed')));
    if (isEdit && task)
      update.mutate({ id: task._id, body }, { onSuccess: success(t('toast.updated')), onError: fail });
    else create.mutate(body, { onSuccess: success(t('toast.created')), onError: fail });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('form.titleEdit') : t('form.titleNew')} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('form.fieldTitle')} {...register('title')} error={errors.title?.message} />
        <Textarea
          label={t('form.fieldDescription')}
          {...register('description')}
          error={errors.description?.message}
        />
        <Input
          label={t('form.fieldDeadline')}
          type="datetime-local"
          {...register('deadline')}
          error={errors.deadline?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">{t('form.fieldPriority')}</label>
            <select
              className="mt-1 block w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
              {...register('priority')}
            >
              <option value="Low">{t('priority.Low')}</option>
              <option value="Medium">{t('priority.Medium')}</option>
              <option value="High">{t('priority.High')}</option>
            </select>
          </div>
          <Input
            label={t('form.fieldEstimatedPomodoros')}
            type="number"
            min={1}
            {...register('estimatedPomodoros', { valueAsNumber: true })}
            error={errors.estimatedPomodoros?.message}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('form.fieldTags')}</label>
          <div className="mt-1 rounded-2xl border border-border bg-surface p-2">
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-500/10"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== tag))}
                    aria-label={t('form.removeTag')}
                    className="text-primary-700/70 hover:text-primary-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault();
                    const v = tagInput.trim().slice(0, 40);
                    if (!tags.includes(v) && tags.length < 20) setTags((prev) => [...prev, v]);
                    setTagInput('');
                  }
                }}
                placeholder={t('form.tagsPlaceholder')}
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-text-muted">{t('form.tagsHint')}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isEdit ? t('form.save') : t('form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

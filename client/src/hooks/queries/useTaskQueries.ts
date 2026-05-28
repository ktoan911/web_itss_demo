import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/api/taskApi';
import type {
  TaskCreateInput,
  TaskListQuery,
  TaskUpdateInput,
  TaskStatus,
  Task,
} from '@/types/task';

export function useTasksQuery(filters: TaskListQuery = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.list(filters),
  });
}

export function useTaskQuery(id: string | null) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskApi.get(id!),
    enabled: !!id,
  });
}

export function invalidateTaskGroups(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['statistics'] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: TaskCreateInput) => taskApi.create(b),
    onSuccess: () => invalidateTaskGroups(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TaskUpdateInput }) => taskApi.update(id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.id] });
      invalidateTaskGroups(qc);
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snaps = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      snaps.forEach(([key, data]) => {
        if (Array.isArray(data))
          qc.setQueryData(
            key,
            data.filter((t) => t._id !== id),
          );
      });
      return { snaps };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snaps.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateTaskGroups(qc),
  });
}

export function useMarkComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskApi.markCompleted(id),
    onSuccess: () => {
      invalidateTaskGroups(qc);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useChangeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskApi.changeStatus(id, status),
    onSuccess: () => {
      invalidateTaskGroups(qc);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

function invalidateAllTaskRelated(qc: ReturnType<typeof useQueryClient>) {
  invalidateTaskGroups(qc);
  qc.invalidateQueries({ queryKey: ['notifications'] });
}

export function useBulkDeleteTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => taskApi.bulkDelete(ids),
    onSuccess: () => invalidateAllTaskRelated(qc),
  });
}

export function useBulkCompleteTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => taskApi.bulkComplete(ids),
    onSuccess: () => invalidateAllTaskRelated(qc),
  });
}

export function useBulkChangePriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, priority }: { ids: string[]; priority: 'Low' | 'Medium' | 'High' }) =>
      taskApi.bulkPriority(ids, priority),
    onSuccess: () => invalidateAllTaskRelated(qc),
  });
}

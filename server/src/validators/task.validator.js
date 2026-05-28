import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  deadline: z.coerce.date(),
  priority: z.enum(['Low', 'Medium', 'High']),
  estimatedPomodoros: z.coerce.number().int().min(1).default(1),
  tags: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskListQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(['Todo', 'InProgress', 'Completed']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    deadlineFilter: z.enum(['today', 'upcoming', 'overdue', 'completed']).optional(),
    sortBy: z.enum(['deadline', 'priority', 'newest']).default('deadline'),
    tag: z.string().optional(),
  })
  .strict();

export const taskIdParam = z.object({ id: objectId });

export const taskStatusSchema = z.object({
  status: z.enum(['Todo', 'InProgress', 'Completed']),
});

export const bulkIdsSchema = z.object({
  ids: z.array(objectId).min(1).max(100),
});

export const bulkPrioritySchema = bulkIdsSchema.extend({
  priority: z.enum(['Low', 'Medium', 'High']),
});

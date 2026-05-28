import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

export const sessionCreateSchema = z.object({
  taskId: objectId.nullable().optional(),
  mode: z.enum(['Focus', 'ShortBreak', 'LongBreak']),
  durationMinutes: z.number().int().min(1).max(180),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable().optional(),
  isCompleted: z.boolean().default(false),
});

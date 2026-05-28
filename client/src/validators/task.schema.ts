import { z } from 'zod';

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  deadline: z.string().min(1, 'Deadline required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  estimatedPomodoros: z.number().int().min(1, 'At least 1'),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

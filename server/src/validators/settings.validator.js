import { z } from 'zod';

export const settingsUpdateSchema = z.object({
  focusDuration: z.number().int().min(1).max(120).optional(),
  shortBreakDuration: z.number().int().min(1).max(60).optional(),
  longBreakDuration: z.number().int().min(1).max(60).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  notificationEnabled: z.boolean().optional(),
  notifySoundEnabled: z.boolean().optional(),
  backgroundUrls: z.array(z.string().url()).max(50).optional(),
  backgroundMode: z.enum(['unchange', 'random', 'sequence']).optional(),
  backgroundSelected: z
    .union([z.string().url(), z.string().startsWith('/'), z.literal('')])
    .optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Required').max(100),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type PasswordValues = z.infer<typeof passwordSchema>;

export const durationsSchema = z.object({
  focusDuration: z.number().int().min(1).max(120),
  shortBreakDuration: z.number().int().min(1).max(60),
  longBreakDuration: z.number().int().min(1).max(60),
});
export type DurationValues = z.infer<typeof durationsSchema>;

export const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notificationEnabled: z.boolean(),
});
export type PreferencesValues = z.infer<typeof preferencesSchema>;

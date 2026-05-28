import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

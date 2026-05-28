import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { registerSchema, type RegisterValues } from '@/validators/auth.schema';
import { useRegister } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });
  const reg = useRegister();
  const navigate = useNavigate();

  const onSubmit = (v: RegisterValues) =>
    reg.mutate(v, {
      onSuccess: () => { toast.success('Account created'); navigate('/dashboard'); },
      onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Registration failed'),
    });

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name"        {...register('fullName')}        error={errors.fullName?.message} />
          <Input label="Email"      type="email"    {...register('email')}    error={errors.email?.message} />
          <Input label="Password"   type="password" {...register('password')} error={errors.password?.message} />
          <Input label="Confirm password" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
          <Button type="submit" fullWidth loading={reg.isPending}>Sign up</Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Have an account? <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

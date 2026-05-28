import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, type LoginValues } from '@/validators/auth.schema';
import { useLogin } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useLogin();
  const navigate = useNavigate();

  const onSubmit = (v: LoginValues) =>
    login.mutate(v, {
      onSuccess: (data) => { toast.success(`Welcome back, ${data.user.fullName.split(' ')[0]}`); navigate('/dashboard'); },
      onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Login failed'),
    });

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">TaskFlow</h1>
          <p className="text-sm text-text-muted">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" fullWidth loading={login.isPending}>Log in</Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          New here? <Link to="/register" className="text-primary-600 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}

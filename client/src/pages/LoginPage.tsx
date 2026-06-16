import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { loginSchema, type LoginValues } from '@/validators/auth.schema';
import { useLogin } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { getApiErrorMessage } from '@/utils/apiError';

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useLogin();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const onSubmit = (v: LoginValues) =>
    login.mutate(v, {
      onSuccess: (data) => {
        toast.success(t('toast.welcome', { name: data.user.fullName.split(' ')[0] }));
        navigate('/dashboard');
      },
      onError: (err: any) => toast.error(getApiErrorMessage(err, t('toast.loginFailed'))),
    });

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Task88</h1>
          <p className="text-sm text-text-muted">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('fields.email')}
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label={t('fields.password')}
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" fullWidth loading={login.isPending}>
            {t('actions.login')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            {t('actions.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
}

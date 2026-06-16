import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { registerSchema, type RegisterValues } from '@/validators/auth.schema';
import { useRegister } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { getApiErrorMessage } from '@/utils/apiError';

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });
  const reg = useRegister();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const onSubmit = (v: RegisterValues) =>
    reg.mutate(v, {
      onSuccess: () => {
        toast.success(t('toast.accountCreated'));
        navigate('/dashboard');
      },
      onError: (err: any) => toast.error(getApiErrorMessage(err, t('toast.registerFailed'))),
    });

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-primary-50 to-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">{t('register.title')}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('fields.fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('fields.email')} type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label={t('fields.password')}
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label={t('fields.confirmPassword')}
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" fullWidth loading={reg.isPending}>
            {t('actions.register')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            {t('actions.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

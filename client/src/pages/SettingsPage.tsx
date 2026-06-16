import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useAuth } from '@/hooks/useAuth';
import {
  useChangePassword,
  useSettingsQuery,
  useUpdateProfile,
  useUpdateSettings,
} from '@/hooks/queries/useSettingsQueries';
import { useThemeStore } from '@/store/themeStore';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  profileSchema,
  passwordSchema,
  durationsSchema,
  preferencesSchema,
  remindersSchema,
  type ProfileValues,
  type PasswordValues,
  type DurationValues,
  type PreferencesValues,
  type RemindersValues,
} from '@/validators/settings.schema';

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const settings = useSettingsQuery();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateSettings = useUpdateSettings();
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = usePomodoroStore((s) => s.hydrateFromSettings);

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });
  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const durations = useForm<DurationValues>({
    resolver: zodResolver(durationsSchema),
    defaultValues: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 },
  });
  const preferences = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { theme: 'light', notificationEnabled: true },
  });
  const reminders = useForm<RemindersValues>({
    resolver: zodResolver(remindersSchema),
    defaultValues: { deadlineReminderHours: 24 },
  });

  useEffect(() => {
    if (user) profile.reset({ fullName: user.fullName });
    if (settings.data) {
      durations.reset({
        focusDuration: settings.data.focusDuration,
        shortBreakDuration: settings.data.shortBreakDuration,
        longBreakDuration: settings.data.longBreakDuration,
      });
      preferences.reset({
        theme: settings.data.theme,
        notificationEnabled: settings.data.notificationEnabled,
      });
      reminders.reset({ deadlineReminderHours: settings.data.deadlineReminderHours });
    }
  }, [user, settings.data, profile, durations, preferences, reminders]);

  if (settings.isLoading) return <Loading />;

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">{t('profile.heading')}</h3>
        <form
          onSubmit={profile.handleSubmit((v) =>
            updateProfile.mutate(v, {
              onSuccess: () => toast.success(t('toast.profileUpdated')),
              onError: () => toast.error(t('toast.profileFailed')),
            }),
          )}
          className="space-y-3"
        >
          <Input
            label={t('profile.fullName')}
            {...profile.register('fullName')}
            error={profile.formState.errors.fullName?.message}
          />
          <div>
            <label className="text-sm font-medium">{t('profile.email')}</label>
            <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={updateProfile.isPending}>
              {t('profile.save')}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">{t('password.heading')}</h3>
        <form
          onSubmit={password.handleSubmit((v) =>
            changePassword.mutate(v, {
              onSuccess: () => {
                toast.success(t('toast.passwordUpdated'));
                password.reset();
              },
              onError: (e: any) => toast.error(getApiErrorMessage(e, t('toast.passwordFailed'))),
            }),
          )}
          className="space-y-3"
        >
          <Input
            label={t('password.current')}
            type="password"
            {...password.register('currentPassword')}
            error={password.formState.errors.currentPassword?.message}
          />
          <Input
            label={t('password.new')}
            type="password"
            {...password.register('newPassword')}
            error={password.formState.errors.newPassword?.message}
          />
          <Input
            label={t('password.confirm')}
            type="password"
            {...password.register('confirmPassword')}
            error={password.formState.errors.confirmPassword?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={changePassword.isPending}>
              {t('password.update')}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">{t('durations.heading')}</h3>
        <form
          onSubmit={durations.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => {
                toast.success(t('toast.durationsUpdated'));
                hydrate({ ...v, notifySoundEnabled: settings.data?.notifySoundEnabled ?? true });
              },
              onError: () => toast.error(t('toast.durationsFailed')),
            }),
          )}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <Input
            label={t('durations.focus')}
            type="number"
            min={1}
            max={120}
            {...durations.register('focusDuration', { valueAsNumber: true })}
            error={durations.formState.errors.focusDuration?.message}
          />
          <Input
            label={t('durations.shortBreak')}
            type="number"
            min={1}
            max={60}
            {...durations.register('shortBreakDuration', { valueAsNumber: true })}
            error={durations.formState.errors.shortBreakDuration?.message}
          />
          <Input
            label={t('durations.longBreak')}
            type="number"
            min={1}
            max={60}
            {...durations.register('longBreakDuration', { valueAsNumber: true })}
            error={durations.formState.errors.longBreakDuration?.message}
          />
          <div className="flex justify-end sm:col-span-3">
            <Button type="submit" loading={updateSettings.isPending}>
              {t('durations.save')}
            </Button>
          </div>
        </form>
      </Card>

      <Card data-tour="reminder-window">
        <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
          {t('reminders.heading')}
          <InfoTooltip text={t('reminders.tooltip')} />
        </h3>
        <form
          onSubmit={reminders.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => toast.success(t('toast.reminderUpdated')),
              onError: () => toast.error(t('toast.reminderFailed')),
            }),
          )}
          className="space-y-3"
        >
          <Input
            label={t('reminders.label')}
            type="number"
            min={1}
            max={168}
            {...reminders.register('deadlineReminderHours', { valueAsNumber: true })}
            error={reminders.formState.errors.deadlineReminderHours?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>
              {t('reminders.save')}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">{t('preferences.heading')}</h3>
        <form
          onSubmit={preferences.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => {
                toast.success(t('toast.preferencesSaved'));
                setTheme(v.theme);
              },
              onError: () => toast.error(t('toast.preferencesFailed')),
            }),
          )}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">{t('preferences.theme')}</label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="light" {...preferences.register('theme')} />{' '}
                {t('preferences.light')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="dark" {...preferences.register('theme')} />{' '}
                {t('preferences.dark')}
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...preferences.register('notificationEnabled')} />{' '}
            {t('preferences.notifications')}
          </label>
          <div className="flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>
              {t('preferences.save')}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">{t('language.heading')}</h3>
        <LanguageSwitcher variant="inline" />
      </Card>
    </div>
  );
}

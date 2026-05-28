import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { useAuth } from '@/hooks/useAuth';
import {
  useChangePassword, useSettingsQuery, useUpdateProfile, useUpdateSettings,
} from '@/hooks/queries/useSettingsQueries';
import { useThemeStore } from '@/store/themeStore';
import { usePomodoroStore } from '@/store/pomodoroStore';
import {
  profileSchema, passwordSchema, durationsSchema, preferencesSchema,
  type ProfileValues, type PasswordValues, type DurationValues, type PreferencesValues,
} from '@/validators/settings.schema';

export default function SettingsPage() {
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
    }
  }, [user, settings.data, profile, durations, preferences]);

  if (settings.isLoading) return <Loading />;

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Profile</h3>
        <form
          onSubmit={profile.handleSubmit((v) =>
            updateProfile.mutate(v, {
              onSuccess: () => toast.success('Profile updated'),
              onError: () => toast.error('Failed'),
            }))}
          className="space-y-3"
        >
          <Input label="Full name" {...profile.register('fullName')} error={profile.formState.errors.fullName?.message} />
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={updateProfile.isPending}>Save</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Change password</h3>
        <form
          onSubmit={password.handleSubmit((v) =>
            changePassword.mutate(v, {
              onSuccess: () => { toast.success('Password updated'); password.reset(); },
              onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Failed'),
            }))}
          className="space-y-3"
        >
          <Input label="Current password" type="password" {...password.register('currentPassword')} error={password.formState.errors.currentPassword?.message} />
          <Input label="New password" type="password" {...password.register('newPassword')} error={password.formState.errors.newPassword?.message} />
          <Input label="Confirm new password" type="password" {...password.register('confirmPassword')} error={password.formState.errors.confirmPassword?.message} />
          <div className="flex justify-end">
            <Button type="submit" loading={changePassword.isPending}>Update password</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Pomodoro durations (minutes)</h3>
        <form
          onSubmit={durations.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => {
                toast.success('Durations updated');
                hydrate(v);
              },
              onError: () => toast.error('Failed'),
            }))}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <Input label="Focus" type="number" min={1} max={120} {...durations.register('focusDuration', { valueAsNumber: true })} error={durations.formState.errors.focusDuration?.message} />
          <Input label="Short break" type="number" min={1} max={60} {...durations.register('shortBreakDuration', { valueAsNumber: true })} error={durations.formState.errors.shortBreakDuration?.message} />
          <Input label="Long break" type="number" min={1} max={60} {...durations.register('longBreakDuration', { valueAsNumber: true })} error={durations.formState.errors.longBreakDuration?.message} />
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>Save</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold">Preferences</h3>
        <form
          onSubmit={preferences.handleSubmit((v) =>
            updateSettings.mutate(v, {
              onSuccess: () => { toast.success('Preferences saved'); setTheme(v.theme); },
              onError: () => toast.error('Failed'),
            }))}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Theme</label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="light" {...preferences.register('theme')} /> Light
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="dark" {...preferences.register('theme')} /> Dark
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...preferences.register('notificationEnabled')} /> Enable notifications
          </label>
          <div className="flex justify-end">
            <Button type="submit" loading={updateSettings.isPending}>Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

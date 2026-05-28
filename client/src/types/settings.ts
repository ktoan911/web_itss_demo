export type Settings = {
  _id: string;
  userId: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  theme: 'light' | 'dark';
  notificationEnabled: boolean;
};

export type SettingsUpdateInput = Partial<Pick<Settings,
  'focusDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'theme' | 'notificationEnabled'>>;

export type BackgroundMode = 'unchange' | 'random' | 'sequence';

export type Settings = {
  _id: string;
  userId: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  theme: 'light' | 'dark';
  notificationEnabled: boolean;
  notifySoundEnabled: boolean;
  backgroundUrls: string[];
  backgroundMode: BackgroundMode;
  backgroundSelected: string;
};

export type SettingsUpdateInput = Partial<
  Pick<
    Settings,
    | 'focusDuration'
    | 'shortBreakDuration'
    | 'longBreakDuration'
    | 'theme'
    | 'notificationEnabled'
    | 'notifySoundEnabled'
    | 'backgroundUrls'
    | 'backgroundMode'
    | 'backgroundSelected'
  >
>;

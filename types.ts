
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'every-other-day';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string; // New field
  target: number; // Times per day
  frequency: HabitFrequency;
  completions: string[]; // ISO Date strings
  createdAt: string;
  colorTheme: string;
  archived: boolean;
  notes?: Record<string, string>; // dateKey -> note content
  icon?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO Date "YYYY-MM-DD"
  content: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
  updatedAt: string;
}

export interface UserSettings {
  email: string;
  theme: 'light' | 'dark';
  enableNotifications: boolean;
  categories: string[]; // User defined categories
  emailConfig?: {
      serviceId: string;
      templateId: string;
      publicKey: string;
  }
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (habits: Habit[]) => boolean;
  achievedDate?: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  completionRate: number; // 0-100
}

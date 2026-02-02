import { Habit, UserSettings, JournalEntry } from '../types';

const HABITS_KEY = 'nexus_habits';
const SETTINGS_KEY = 'nexus_settings';
const JOURNAL_KEY = 'nexus_journal';
const TOKEN_KEY = 'nexus_auth_token';
const USER_INFO_KEY = 'nexus_user_info';

// Dynamic API Base URL
const getApiBase = () => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        // @ts-ignore
        return import.meta.env.VITE_API_URL;
    }
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return 'https://nexus-habit-tracker.vercel.app/api';
};

const API_BASE = getApiBase();

export const api = {
    // Check if server is reachable
    async checkHealth() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // --- AUTHENTICATION ---
    
    async register(name: string, email: string, pass: string) {
        try {
            // Send local data on register to pre-populate cloud
            const initialData = {
                habits: getStoredHabits(),
                settings: getStoredSettings(),
                journal: getStoredJournal()
            };
            
            const res = await fetch(`${API_BASE}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password: pass, initialData })
            });
            
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(USER_INFO_KEY, JSON.stringify({ name: data.name, email: data.email, bio: data.bio }));
                return { success: true, user: data };
            }
            return { success: false, message: data.message };
        } catch (e: any) {
            return { success: false, message: e.message || "Registration failed" };
        }
    },

    async login(email: string, pass: string) {
        try {
            const res = await fetch(`${API_BASE}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass })
            });
            
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(USER_INFO_KEY, JSON.stringify({ name: data.name, email: data.email, bio: data.bio }));
                return { success: true, data };
            }
            return { success: false, message: data.message };
        } catch (e: any) {
            return { success: false, message: e.message || "Login failed" };
        }
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_INFO_KEY);
    },

    isLoggedIn() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    getCurrentUser() {
        const u = localStorage.getItem(USER_INFO_KEY);
        return u ? JSON.parse(u) : null;
    },
    
    // --- PROFILE ---

    async updateProfile(name: string, bio: string) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return { success: false, message: "Not logged in" };

        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ name, bio })
            });
            const data = await res.json();
            if (res.ok) {
                 localStorage.setItem(USER_INFO_KEY, JSON.stringify({ name: data.name, email: data.email, bio: data.bio }));
                 return { success: true, data };
            }
            return { success: false, message: data.message };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    },

    // --- DATA SYNC ---

    async loadData() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;

        try {
            console.log(`Attempting to load data from server`);
            const res = await fetch(`${API_BASE}/user/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("Failed to load data from server (Offline or Server Down):", e);
        }
        return null;
    },

    async syncData(data: { habits?: Habit[], settings?: UserSettings, journal?: JournalEntry[] }) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;

        try {
            const payload = {
                habits: data.habits || getStoredHabits(),
                settings: data.settings || getStoredSettings(),
                journal: data.journal || getStoredJournal()
            };

            const res = await fetch(`${API_BASE}/user/sync`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            return res.ok;
        } catch (e) {
            console.warn("Failed to sync data to server:", e);
            return false;
        }
    }
};

export const getStoredHabits = (): Habit[] => {
  try {
    const data = localStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load habits", e);
    return [];
  }
};

export const saveHabits = (habits: Habit[]) => {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error("Failed to save habits", e);
  }
};

export const getStoredJournal = (): JournalEntry[] => {
    try {
        const data = localStorage.getItem(JOURNAL_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load journal", e);
        return [];
    }
};

export const saveJournal = (entries: JournalEntry[]) => {
    try {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error("Failed to save journal", e);
    }
};

export const getStoredSettings = (): UserSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    // Added categories to defaults to satisfy UserSettings interface
    const defaults: UserSettings = { 
      email: '', 
      theme: 'dark' as const, 
      enableNotifications: true, 
      categories: ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social'],
      emailConfig: { serviceId: '', templateId: '', publicKey: '' } 
    };
    if (!data) return defaults;
    
    const parsed = JSON.parse(data);
    return { ...defaults, ...parsed }; // Merge to ensure new keys exist
  } catch (e) {
    // Added categories to fallback to satisfy UserSettings interface
    return { 
      email: '', 
      theme: 'dark', 
      enableNotifications: true, 
      categories: ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social'] 
    };
  }
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const exportData = () => {
    const habits = getStoredHabits();
    const settings = getStoredSettings();
    const journal = getStoredJournal();
    const dataStr = JSON.stringify({ habits, settings, journal }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
};
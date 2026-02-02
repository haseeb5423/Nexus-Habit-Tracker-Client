// Fix React import: React should be imported as a default export, not a named export.
import React, { useState, useEffect, useCallback } from 'react';
import { Habit, UserSettings } from './types';
import { getStoredHabits, saveHabits, getStoredSettings, saveSettings, api, saveJournal } from './services/storage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HabitList from './components/HabitList';
import Analytics from './components/Analytics';
import Gamification from './components/Gamification';
import SettingsPage from './components/Settings';
import Journal from './components/Journal';
import Profile from './components/Profile';
import { v4 as uuidv4 } from 'uuid';
import { Cloud, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => {
    const s = getStoredSettings();
    if (s.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return s;
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(api.isLoggedIn());
  const [currentRoute, setCurrentRoute] = useState('/');

  const navigate = useCallback((path: string) => {
      setCurrentRoute(path);
      window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const initializeData = async () => {
        const loadedHabits = getStoredHabits();
        const migratedHabits = loadedHabits.map(h => {
            return {
                ...h,
                target: h.target || 1,
                frequency: h.frequency || 'daily',
                icon: h.icon || 'CheckSquare'
            };
        });
        setHabits(migratedHabits);
        setIsLoaded(true);
        if (api.isLoggedIn()) {
            setSyncStatus('syncing');
            const remoteData = await api.loadData();
            if (remoteData) {
                if (remoteData.habits && remoteData.habits.length > 0) {
                    setHabits(remoteData.habits);
                    saveHabits(remoteData.habits);
                }
                if (remoteData.settings) {
                    setSettings(prev => ({ ...prev, ...remoteData.settings }));
                    saveSettings({ ...settings, ...remoteData.settings });
                }
                if (remoteData.journal) {
                    saveJournal(remoteData.journal);
                }
                setSyncStatus('success');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } else {
                setSyncStatus('error');
            }
        }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveHabits(habits);
      if (api.isLoggedIn()) {
          const timeout = setTimeout(async () => {
              setSyncStatus('syncing');
              const success = await api.syncData({ habits });
              setSyncStatus(success ? 'success' : 'error');
              if(success) setTimeout(() => setSyncStatus('idle'), 2000);
          }, 2000); 
          return () => clearTimeout(timeout);
      }
    }
  }, [habits, isLoaded]);

  useEffect(() => {
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    if (isLoaded) saveSettings(settings);
  }, [settings.theme, settings, isLoaded]);

  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'completions' | 'createdAt' | 'archived'>) => {
    const newHabit: Habit = {
      id: uuidv4(),
      ...habitData,
      target: habitData.target || 1,
      frequency: habitData.frequency || 'daily',
      icon: habitData.icon || 'CheckSquare',
      completions: [],
      createdAt: new Date().toISOString(),
      archived: false,
      colorTheme: habitData.colorTheme || 'pink',
      notes: {}
    };
    setHabits(prev => [...prev, newHabit]);
  }, []);

  const updateHabitDetails = useCallback((id: string, updates: Partial<Omit<Habit, 'id' | 'completions' | 'createdAt' | 'archived' | 'notes'>>) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

  const toggleCompletion = useCallback((id: string, dateStr: string, direction?: 'add' | 'remove') => {
    setHabits(prevHabits => prevHabits.map(h => {
      if (h.id !== id) return h;
      let newCompletions = [...h.completions];
      const count = newCompletions.filter(c => c === dateStr).length;
      let isRemovalAction = false;
      if (direction === 'add') { if (count >= h.target) return h; newCompletions.push(dateStr); }
      else if (direction === 'remove') { const idx = newCompletions.indexOf(dateStr); if (idx > -1) { newCompletions.splice(idx, 1); isRemovalAction = true; } }
      else { if (count < h.target) newCompletions.push(dateStr); else { const idx = newCompletions.indexOf(dateStr); if (idx > -1) { newCompletions.splice(idx, 1); isRemovalAction = true; } } }
      let newNotes = h.notes;
      if (isRemovalAction) { const newDateCount = newCompletions.filter(c => c === dateStr).length; if (newDateCount === 0 && h.notes && h.notes[dateStr]) { newNotes = { ...h.notes }; delete newNotes[dateStr]; } }
      return { ...h, completions: newCompletions, notes: newNotes };
    }));
  }, []);

  const updateHabitNote = useCallback((id: string, dateStr: string, noteContent: string) => {
    setHabits(prevHabits => prevHabits.map(h => {
        if (h.id !== id) return h;
        const newNotes = { ...(h.notes || {}) };
        if (noteContent.trim() === '') delete newNotes[dateStr]; else newNotes[dateStr] = noteContent;
        return { ...h, notes: newNotes };
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => setHabits(prev => prev.filter(h => h.id !== id)), []);
  const reorderHabits = useCallback((fromIndex: number, toIndex: number) => { setHabits(prev => { const updated = [...prev]; const [moved] = updated.splice(fromIndex, 1); updated.splice(toIndex, 0, moved); return updated; }); }, []);
  
  // Added categories to setSettings to satisfy UserSettings interface
  const resetData = useCallback(() => { 
    localStorage.clear(); 
    setHabits([]); 
    setSettings({ 
      email: '', 
      theme: 'dark', 
      enableNotifications: true, 
      categories: ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social'] 
    }); 
    document.documentElement.classList.add('dark'); 
    setIsLoggedIn(false); 
  }, []);

  const handleSyncFromLogin = (data: any) => { if (data.habits) { setHabits(data.habits); saveHabits(data.habits); } if (data.settings) { setSettings(prev => ({...prev, ...data.settings})); saveSettings({...settings, ...data.settings}); } if (data.journal) saveJournal(data.journal); setIsLoggedIn(true); };
  const handleLogout = () => { api.logout(); setIsLoggedIn(false); navigate('/'); };

  const renderContent = () => {
    switch (currentRoute) {
        case '/': return <Dashboard habits={habits} onNavigate={navigate} />;
        case '/habits': return <HabitList habits={habits} onAddHabit={addHabit} onEditHabit={updateHabitDetails} onToggleCompletion={toggleCompletion} onDeleteHabit={deleteHabit} onEditNote={updateHabitNote} onReorderHabits={reorderHabits} />;
        case '/journal': return <Journal habits={habits} />;
        case '/analytics': return <Analytics habits={habits} />;
        case '/achievements': return <Gamification habits={habits} />;
        case '/settings': return <SettingsPage settings={settings} habits={habits} onUpdateSettings={setSettings} onResetData={resetData} onNavigate={navigate} />;
        case '/profile': return <Profile habits={habits} onLogout={handleLogout} onSync={handleSyncFromLogin} />;
        default: return <Dashboard habits={habits} onNavigate={navigate} />;
    }
  };

  if (!isLoaded) return <div className="flex items-center justify-center h-screen text-white bg-black">Loading Nexus...</div>;

  return (
    <Layout isDark={settings.theme === 'dark'} toggleTheme={() => setSettings({...settings, theme: settings.theme === 'dark' ? 'light' : 'dark'})} habits={habits} currentRoute={currentRoute} onNavigate={navigate}>
      {isLoggedIn && (
          <div className="fixed top-4 right-4 z-[60] md:z-auto md:top-6 md:right-8 flex items-center gap-2 pointer-events-none">
              {syncStatus === 'syncing' && <span className="text-xs text-forest-500 animate-pulse bg-white/80 dark:bg-black/80 px-2 py-1 rounded-full backdrop-blur">Syncing...</span>}
              {syncStatus === 'error' && <span className="text-xs text-red-500 bg-white/80 dark:bg-black/80 px-2 py-1 rounded-full backdrop-blur"><CloudOff size={14} className="inline mr-1" /> Offline</span>}
              {syncStatus === 'success' && <span className="text-xs text-forest-500 bg-white/80 dark:bg-black/80 px-2 py-1 rounded-full backdrop-blur"><Cloud size={14} className="inline mr-1" /> Saved</span>}
          </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
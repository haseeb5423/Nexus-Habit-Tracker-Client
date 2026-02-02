
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Flame, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, 
  RotateCcw, Clock, AlertCircle, X, NotebookPen, Search, Check, 
  MoreHorizontal, Minus, GripVertical, Edit, History, Timer, Play, Pause, Filter, Repeat, ChevronDown, Save, Tag
} from 'lucide-react';
import { 
  Droplets, BookOpen, Dumbbell, Moon, Sun, Briefcase, Music, Heart, Coffee, 
  Utensils, Zap, PenTool, Smile, Bike, Footprints, CheckSquare 
} from 'lucide-react';
import { Habit, HabitFrequency } from '../types';
import { calculateStreak, getTimelineDateRange, getTodayISO, getDaysInMonth, getLastCompletedText, formatDate, getCompletionCount, isHabitDue } from '../utils/dateUtils';
import { getStoredSettings } from '../services/storage';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

interface HabitListProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'completions' | 'createdAt' | 'archived'>) => void;
  onEditHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'completions' | 'createdAt' | 'archived'>>) => void;
  onToggleCompletion: (id: string, date: string, direction?: 'add' | 'remove') => void;
  onDeleteHabit: (id: string) => void;
  onEditNote: (id: string, date: string, note: string) => void;
  onReorderHabits: (fromIndex: number, toIndex: number) => void;
}

const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Mon-Fri',
  weekends: 'Sat-Sun',
  'every-other-day': 'Every 2 Days'
};

const AVAILABLE_ICONS = [
  { name: 'CheckSquare', icon: CheckSquare, label: 'General' },
  { name: 'Droplets', icon: Droplets, label: 'Water' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'BookOpen', icon: BookOpen, label: 'Read' },
  { name: 'Moon', icon: Moon, label: 'Sleep' },
  { name: 'Sun', icon: Sun, label: 'Morning' },
  { name: 'Briefcase', icon: Briefcase, label: 'Work' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'Heart', icon: Heart, label: 'Health' },
  { name: 'Coffee', icon: Coffee, label: 'Break' },
  { name: 'Utensils', icon: Utensils, label: 'Diet' },
  { name: 'Zap', icon: Zap, label: 'Energy' },
  { name: 'PenTool', icon: PenTool, label: 'Create' },
  { name: 'Smile', icon: Smile, label: 'Mood' },
  { name: 'Bike', icon: Bike, label: 'Cycle' },
  { name: 'Footprints', icon: Footprints, label: 'Walk' },
];

const renderHabitIcon = (iconName?: string, className?: string) => {
  const iconDef = AVAILABLE_ICONS.find(i => i.name === iconName) || AVAILABLE_ICONS[0];
  const Icon = iconDef.icon;
  return <Icon className={className} />;
};

const THEME_STYLES: Record<string, any> = {
  pink: {
    id: 'pink', label: 'Pink', primary: 'text-pink-500', bg: 'bg-pink-500', border: 'border-pink-500', ring: 'ring-pink-500', softBg: 'bg-pink-100 dark:bg-pink-900/20', softText: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500 to-purple-600', shadow: 'shadow-pink-500/50', tileGradient: 'from-pink-500 to-purple-600', hoverBorder: 'hover:border-pink-500/30', bgLow: 'bg-pink-500/10', textDark: 'text-pink-400'
  },
  purple: {
    id: 'purple', label: 'Purple', primary: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500', softBg: 'bg-purple-100 dark:bg-purple-900/20', softText: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/50', tileGradient: 'from-purple-500 to-indigo-600', hoverBorder: 'hover:border-purple-500/30', bgLow: 'bg-purple-500/10', textDark: 'text-pink-400'
  },
  blue: {
    id: 'blue', label: 'Blue', primary: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500', softBg: 'bg-blue-100 dark:bg-blue-900/20', softText: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/50', tileGradient: 'from-blue-500 to-cyan-500', hoverBorder: 'hover:border-blue-500/30', bgLow: 'bg-blue-500/10', textDark: 'text-blue-400'
  },
  green: {
    id: 'green', label: 'Green', primary: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', softBg: 'bg-emerald-100 dark:bg-emerald-900/20', softText: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/50', tileGradient: 'from-emerald-500 to-teal-500', hoverBorder: 'hover:border-emerald-500/30', bgLow: 'bg-emerald-500/10', textDark: 'text-emerald-400'
  },
  orange: {
    id: 'orange', label: 'Orange', primary: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-500', softBg: 'bg-orange-100 dark:bg-orange-900/20', softText: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/50', tileGradient: 'from-orange-500 to-amber-500', hoverBorder: 'hover:border-emerald-500/30', bgLow: 'bg-orange-500/10', textDark: 'text-orange-400'
  }
};

const getTheme = (color?: string) => THEME_STYLES[color || 'pink'] || THEME_STYLES['pink'];

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const triggerCelebration = (x: number, y: number, color: string) => {
    const colorMap: Record<string, string[]> = {
        pink: ['#EC4899', '#A855F7'],
        purple: ['#A855F7', '#6366F1'],
        blue: ['#3B82F6', '#06B6D4'],
        green: ['#10B981', '#14B8A6'],
        orange: ['#F97316', '#F59E0B']
    };
    confetti({ particleCount: 60, spread: 70, origin: { x, y }, colors: colorMap[color] || ['#10B981', '#14B8A6'], disableForReducedMotion: true, zIndex: 1000 });
};

const FrequencyDropdown: React.FC<{ value: HabitFrequency, onChange: (val: HabitFrequency) => void, theme: any }> = ({ value, onChange, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button 
                type="button" 
                onClick={() => { setIsOpen(!isOpen); vibrate(10); }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 text-slate-800 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]"
            >
                <div className="flex items-center gap-2">
                    <Repeat size={18} className={theme.primary} />
                    <span className="font-medium text-sm">{FREQUENCY_LABELS[value]}</span>
                </div>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <ChevronDown size={18} className={clsx("transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[70] bg-white dark:bg-forest-dark-surface rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-scale-in origin-top">
                    {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => { onChange(val as HabitFrequency); setIsOpen(false); vibrate(10); }}
                            className={clsx(
                                "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                value === val 
                                    ? clsx(theme.softBg, theme.softText, "font-bold") 
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            )}
                        >
                            {label}
                            {value === val && <Check size={16} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const HabitList: React.FC<HabitListProps> = ({ habits, onAddHabit, onEditHabit, onToggleCompletion, onDeleteHabit, onEditNote, onReorderHabits }) => {
  const settings = getStoredSettings();
  const categories = settings.categories || ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social'];

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [newTarget, setNewTarget] = useState(1);
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('daily');
  const [newColor, setNewColor] = useState('green');
  const [newIcon, setNewIcon] = useState('CheckSquare');
  
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeTouchIndex, setActiveTouchIndex] = useState<number | null>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const draggedItemIndexRef = useRef<number | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery.trim() || h.title.toLowerCase().includes(lowerQuery) || (h.description && h.description.toLowerCase().includes(lowerQuery));
        if (!matchesSearch) return false;
        
        const todayIso = getTodayISO();
        const completedCount = getCompletionCount(h, todayIso);
        const isCompleted = completedCount >= h.target;
        
        if (statusFilter === 'completed' && !isCompleted) return false;
        if (statusFilter === 'pending' && isCompleted) return false;
        if (colorFilter !== 'all' && h.colorTheme !== colorFilter) return false;
        if (categoryFilter !== 'all' && h.category !== categoryFilter) return false;
        
        return true;
    });
  }, [habits, searchQuery, statusFilter, colorFilter, categoryFilter]);

  const isSearching = searchQuery.trim().length > 0 || statusFilter !== 'all' || colorFilter !== 'all' || categoryFilter !== 'all';

  const handleToggleWrapper = (id: string, date: string, direction?: 'add' | 'remove', event?: React.MouseEvent) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const todayIso = getTodayISO();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayIso = yesterdayDate.toISOString().split('T')[0];
    
    if (date !== todayIso && date !== yesterdayIso) {
        vibrate(5);
        return;
    }

    let willTriggerCelebration = false;
    const isAdding = direction === 'add' || (!direction && getCompletionCount(habit, date) < habit.target);
    if (isAdding && date === todayIso) {
         const currentCount = getCompletionCount(habit, date);
         if (currentCount + 1 === habit.target) willTriggerCelebration = true;
    }
    onToggleCompletion(id, date, direction);
    if (willTriggerCelebration) vibrate([50, 50, 50]); else vibrate(15);
    if (willTriggerCelebration) {
         if (event) {
             const rect = (event.target as HTMLElement).getBoundingClientRect();
             const x = (rect.left + rect.width / 2) / window.innerWidth;
             const y = (rect.top + rect.height / 2) / window.innerHeight;
             triggerCelebration(x, y, habit.colorTheme);
         } else triggerCelebration(0.5, 0.5, habit.colorTheme);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit({
      title: newTitle, description: newDesc, category: newCategory, target: newTarget, frequency: newFrequency, colorTheme: newColor, icon: newIcon
    });
    setNewTitle(''); setNewDesc(''); setNewCategory(categories[0]); setNewTarget(1); setNewFrequency('daily'); setNewColor('green'); setNewIcon('CheckSquare'); setShowForm(false); vibrate(20);
  };

  const confirmDelete = () => {
    if (habitToDelete) { onDeleteHabit(habitToDelete); setHabitToDelete(null); vibrate(30); }
  };
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
      if (isSearching) { e.preventDefault(); return; }
      setDraggedIndex(index); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", index.toString()); vibrate(10);
  };
  
  const handleDragEnd = () => setDraggedIndex(null);
  const handleDragOver = (e: React.DragEvent, index: number) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== dropIndex && !isSearching) { onReorderHabits(draggedIndex, dropIndex); vibrate(15); }
      handleDragEnd();
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      if (!cloneRef.current) return;
      const w = cloneRef.current.offsetWidth; const h = cloneRef.current.offsetHeight;
      cloneRef.current.style.left = `${touch.clientX - w / 2}px`;
      cloneRef.current.style.top = `${touch.clientY - h / 2}px`;
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const itemBelow = elementBelow?.closest('[data-habit-index]');
      if (itemBelow) {
          const newIndex = parseInt(itemBelow.getAttribute('data-habit-index') || '-1');
          const currentIndex = draggedItemIndexRef.current;
          if (currentIndex !== null && newIndex !== -1 && newIndex !== currentIndex) {
              onReorderHabits(currentIndex, newIndex); draggedItemIndexRef.current = newIndex; setActiveTouchIndex(newIndex); vibrate(10);
          }
      }
  };

  const handleGlobalTouchEnd = () => {
      setActiveTouchIndex(null); draggedItemIndexRef.current = null;
      if (cloneRef.current) { cloneRef.current.remove(); cloneRef.current = null; }
      window.removeEventListener('touchmove', handleGlobalTouchMove); window.removeEventListener('touchend', handleGlobalTouchEnd);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (isSearching) return;
    e.stopPropagation();
    const touch = e.touches[0]; const handle = e.currentTarget as HTMLElement; const cardWrapper = handle.closest('[data-habit-index]') as HTMLElement;
    if (!cardWrapper) return;
    setActiveTouchIndex(index); draggedItemIndexRef.current = index; vibrate(30);
    const rect = cardWrapper.getBoundingClientRect(); const clone = cardWrapper.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed'; clone.style.left = `${rect.left}px`; clone.style.top = `${rect.top}px`; clone.style.width = `${rect.width}px`; clone.style.height = `${rect.height}px`; clone.style.zIndex = '9999'; clone.style.pointerEvents = 'none'; clone.style.opacity = '0.9'; clone.style.transform = 'scale(1.05)'; clone.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)'; clone.style.transition = 'none';
    document.body.appendChild(clone); cloneRef.current = clone;
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false }); window.addEventListener('touchend', handleGlobalTouchEnd);
  };

  useEffect(() => {
      return () => { if (cloneRef.current) cloneRef.current.remove(); window.removeEventListener('touchmove', handleGlobalTouchMove); window.removeEventListener('touchend', handleGlobalTouchEnd); };
  }, []);

  const theme = getTheme(newColor);
  const selectedHabit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
  const selectedHabitStreak = selectedHabit ? calculateStreak(selectedHabit) : null;
  const hasActiveFilters = statusFilter !== 'all' || colorFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-6 md:space-y-8 pb-32 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-forest-900 dark:text-white tracking-tight animate-slide-in-right">My Habits</h2>
          <p className="text-forest-light-muted dark:text-forest-dark-muted animate-slide-in-right delay-100">Track your daily growth</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-forest-500 to-forest-700 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-forest-500/20 active:scale-95 transform hover:-translate-y-1 duration-300 animate-scale-in">
          <Plus size={20} /> <span className="font-medium">New Habit</span>
        </button>
      </div>

      {habits.length > 0 && (
        <div className="space-y-3 animate-fade-in mb-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-forest-dark-muted" size={20} />
                    <input type="text" placeholder="Search habits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-dark-muted focus:outline-none focus:ring-2 focus:ring-forest-500/50 transition-all shadow-sm" />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"><X size={14} /></button>}
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={clsx("px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 shadow-sm active:scale-95", (showFilters || hasActiveFilters) ? "bg-forest-100 dark:bg-forest-900/40 border-forest-300 dark:border-forest-700 text-forest-700 dark:text-forest-300" : "bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-500 dark:text-forest-dark-muted hover:bg-white dark:hover:bg-white/5")}>
                    <Filter size={20} /> {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-forest-500"></span>}
                </button>
            </div>
            {showFilters && (
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 dark:text-forest-dark-muted uppercase tracking-wider">Status</label>
                            <div className="flex flex-wrap gap-2">{(['all', 'pending', 'completed'] as const).map(status => (
                                    <button key={status} onClick={() => setStatusFilter(status)} className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize border", statusFilter === status ? "bg-forest-600 text-white border-forest-600 shadow-sm" : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10")}>
                                        {status === 'all' ? 'All' : status === 'pending' ? 'To Do' : 'Done'}
                                    </button>
                            ))}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 dark:text-forest-dark-muted uppercase tracking-wider">Category</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setCategoryFilter('all')} className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-all border", categoryFilter === 'all' ? "bg-slate-800 text-white dark:bg-white dark:text-black border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10")}>All</button>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setCategoryFilter(cat)} className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-all border", categoryFilter === cat ? "bg-forest-600 text-white border-forest-600 shadow-sm" : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10")}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-forest-dark-muted uppercase tracking-wider">Theme</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={() => setColorFilter('all')} className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition-all border", colorFilter === 'all' ? "bg-slate-800 text-white dark:bg-white dark:text-black border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10")}>All</button>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                            {Object.values(THEME_STYLES).map((t: any) => (
                                <button key={t.id} onClick={() => setColorFilter(colorFilter === t.id ? 'all' : t.id)} className={clsx("w-8 h-8 rounded-full transition-all duration-200 border-2", t.bg, colorFilter === t.id ? "ring-2 ring-offset-2 ring-forest-500 scale-110 border-white dark:border-black" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105")} title={t.label} />
                            ))}
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end"><button onClick={() => {setStatusFilter('all'); setColorFilter('all'); setCategoryFilter('all');}} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white underline decoration-dashed">Clear Filters</button></div>
                </div>
            )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/70 dark:bg-forest-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 mb-6 shadow-2xl relative overflow-hidden transition-all animate-scale-in origin-top">
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${theme.gradient}`}></div>
          <h3 className="text-xl font-semibold mb-4 text-forest-900 dark:text-white">Plant a New Habit</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Habit Title</label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Drink Water" className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-dark-muted focus:outline-none focus:ring-2 focus:ring-forest-500/50 transition-all" autoFocus />
                </div>
                <div>
                    <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Category</label>
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                        {categories.map(cat => (
                            <button key={cat} type="button" onClick={() => { setNewCategory(cat); vibrate(5); }} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", newCategory === cat ? "bg-white dark:bg-forest-dark-surface shadow-sm text-forest-600" : "text-slate-400 dark:text-forest-dark-muted hover:text-slate-600")}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Target (Daily Reps)</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                        <button type="button" onClick={() => { setNewTarget(Math.max(1, newTarget - 1)); vibrate(5); }} className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm transition-all active:scale-90"><Minus size={16} className="text-slate-600 dark:text-white" /></button>
                        <span className="font-mono font-bold text-lg flex-1 text-center text-slate-800 dark:text-white">{newTarget}</span>
                        <button type="button" onClick={() => { setNewTarget(Math.min(100, newTarget + 1)); vibrate(5); }} className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm transition-all active:scale-90"><Plus size={16} className="text-slate-600 dark:text-white" /></button>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Frequency</label>
                    <FrequencyDropdown value={newFrequency} onChange={setNewFrequency} theme={theme} />
                 </div>
                 <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-2">Color Theme</label>
                    <div className="flex gap-3 pt-1">{Object.values(THEME_STYLES).map((t: any) => (
                          <button key={t.id} type="button" onClick={() => { setNewColor(t.id); vibrate(10); }} className={clsx("w-9 h-9 rounded-full transition-all duration-200 border-2", t.bg, newColor === t.id ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110 border-white dark:border-black shadow-lg" : "hover:scale-105 opacity-70 hover:opacity-100 border-transparent")} aria-label={t.label} />
                    ))}</div>
                 </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-2">Icon</label>
              <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 scrollbar-thin scrollbar-thumb-forest-500/20">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon, label }) => (
                      <button key={name} type="button" onClick={() => { setNewIcon(name); vibrate(10); }} title={label} className={clsx("flex flex-col items-center justify-center p-2 rounded-lg transition-all", newIcon === name ? clsx(theme.softBg, theme.primary, "ring-1", theme.border) : "text-slate-500 dark:text-forest-dark-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white")}>
                          <Icon size={20} />
                      </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-500 dark:text-forest-dark-muted hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors font-medium">Cancel</button>
              <button type="submit" className={`px-8 py-2.5 text-white font-bold rounded-xl hover:opacity-90 shadow-xl transition-transform active:scale-95 bg-gradient-to-r ${theme.gradient}`}>Plant Habit</button>
            </div>
          </div>
        </form>
      )}

      <div className={clsx(filteredHabits.length > 0 ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-6")}>
        {habits.length === 0 && !showForm && (
          <div className="col-span-full text-center py-16 text-slate-500 dark:text-forest-dark-muted bg-white/70 dark:bg-forest-dark-surface rounded-2xl border border-slate-200 dark:border-white/10 border-dashed animate-fade-in">
            <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium text-forest-800 dark:text-forest-100">No habits rooted yet.</p>
            <p className="text-sm mt-2">Start planting consistency today.</p>
          </div>
        )}
        {habits.length > 0 && filteredHabits.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 dark:text-forest-dark-muted bg-white/40 dark:bg-forest-dark-surface/50 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed animate-fade-in">
                <Search size={48} className="mx-auto mb-4 opacity-30" /> <p className="text-lg font-medium">No matching habits found</p>
                <div className="mt-2 flex justify-center gap-2"><button onClick={() => {setSearchQuery(''); setStatusFilter('all'); setColorFilter('all'); setCategoryFilter('all');}} className="text-sm text-forest-600 dark:text-forest-400 hover:underline">Clear all filters</button></div>
            </div>
        )}
        {filteredHabits.map((habit, index) => {
          const streak = calculateStreak(habit);
          return (
            <div key={habit.id} data-habit-index={index} draggable={!isSearching} onDragStart={(e) => handleDragStart(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} className={clsx("transition-all h-full animate-slide-up fill-mode-forwards select-none habit-card-wrapper", (draggedIndex === index || activeTouchIndex === index) ? "opacity-30 scale-95" : "opacity-100 hover:scale-[1.02]")} style={{ animationDelay: `${index * 50}ms` }}>
                <HabitTile habit={habit} streak={streak} onToggle={handleToggleWrapper} onOpen={() => { if (activeTouchIndex === null) setSelectedHabitId(habit.id); }} dragHandleProps={{ onTouchStart: (e: any) => handleTouchStart(e, index), onMouseDown: (e: any) => e.stopPropagation() }} />
            </div>
          );
        })}
      </div>
      
      {selectedHabit && selectedHabitStreak && (
         <div className="fixed inset-0 z-[60] flex items-end md:items-start justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-6 md:pt-20">
            <div className="bg-white dark:bg-forest-dark-surface w-full h-[88vh] md:h-auto md:max-h-[85vh] md:max-w-5xl rounded-t-[2rem] md:rounded-3xl relative flex flex-col shadow-2xl border-t md:border border-slate-200 dark:border-white/10 animate-slide-in-up-drawer md:animate-slide-down overflow-hidden" onClick={(e) => e.stopPropagation()}>
               <div className="p-4 flex justify-center cursor-grab active:cursor-grabbing md:hidden" onClick={() => setSelectedHabitId(null)}><div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full"></div></div>
               <div className="px-6 pb-4 pt-4 md:pt-6 flex justify-between items-center border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3 pr-4">
                      <div className={clsx("p-2 rounded-lg bg-slate-100 dark:bg-white/5", getTheme(selectedHabit.colorTheme).primary)}>{renderHabitIcon(selectedHabit.icon, "w-6 h-6")}</div>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate tracking-tight">{selectedHabit.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedHabit.category}</span>
                      </div>
                  </div>
                  <button onClick={() => setSelectedHabitId(null)} className="p-2 bg-slate-200 dark:bg-white/10 rounded-full text-slate-600 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-16 md:pb-24 custom-scrollbar">
                 <HabitCardFull habit={selectedHabit} streak={selectedHabitStreak} onToggle={handleToggleWrapper} onDelete={(id) => { setHabitToDelete(id); setSelectedHabitId(null); }} onEdit={(habit) => { setEditingHabit(habit); setSelectedHabitId(null); }} onEditNote={onEditNote} isMobileView={false} onClose={() => setSelectedHabitId(null)} categories={categories} />
               </div>
            </div>
         </div>
       )}

      {editingHabit && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 md:pt-24 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-forest-dark-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-white/10 animate-slide-down relative overflow-y-auto max-h-[85vh]">
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getTheme(editingHabit.colorTheme).gradient}`}></div>
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-forest-dark-surface z-10 pb-2">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Habit</h3>
                    <button onClick={() => setEditingHabit(null)}><X size={20} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"/></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if(!editingHabit.title.trim()) return; onEditHabit(editingHabit.id, { title: editingHabit.title, description: editingHabit.description, category: editingHabit.category, target: editingHabit.target, frequency: editingHabit.frequency, colorTheme: editingHabit.colorTheme, icon: editingHabit.icon }); setEditingHabit(null); vibrate(20); }}>
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Habit Title</label>
                                <input type="text" value={editingHabit.title} onChange={(e) => setEditingHabit({...editingHabit, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-dark-muted focus:outline-none focus:ring-2 focus:ring-forest-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Category</label>
                                <div className="flex flex-wrap gap-2 p-1 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                    {categories.map(cat => (
                                        <button key={cat} type="button" onClick={() => { setEditingHabit({...editingHabit, category: cat}); vibrate(5); }} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", editingHabit.category === cat ? "bg-white dark:bg-forest-dark-surface shadow-sm text-forest-600" : "text-slate-400 dark:text-forest-dark-muted hover:text-slate-600")}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Target (Daily Reps)</label>
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                                    <button type="button" onClick={() => { setEditingHabit({...editingHabit, target: Math.max(1, editingHabit.target - 1)}); vibrate(5); }} className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm transition-all active:scale-90"><Minus size={16} className="text-slate-600 dark:text-white" /></button>
                                    <span className="font-mono font-bold text-lg flex-1 text-center text-slate-800 dark:text-white">{editingHabit.target}</span>
                                    <button type="button" onClick={() => { setEditingHabit({...editingHabit, target: Math.min(100, editingHabit.target + 1)}); vibrate(5); }} className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm transition-all active:scale-90"><Plus size={16} className="text-slate-600 dark:text-white" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Frequency</label>
                                <FrequencyDropdown value={editingHabit.frequency} onChange={(val) => setEditingHabit({...editingHabit, frequency: val})} theme={getTheme(editingHabit.colorTheme)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-2">Color</label>
                                <div className="flex gap-3 pt-1">{Object.values(THEME_STYLES).map((t: any) => (
                                    <button key={t.id} type="button" onClick={() => { setEditingHabit({...editingHabit, colorTheme: t.id}); vibrate(10); }} className={clsx("w-9 h-9 rounded-full transition-all duration-200 border-2", t.bg, editingHabit.colorTheme === t.id ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110 border-white dark:border-black shadow-lg" : "hover:scale-105 opacity-70 hover:opacity-100 border-transparent")} aria-label={t.label} />
                                ))}</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-2">Icon</label>
                            <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 scrollbar-thin scrollbar-thumb-forest-500/20">
                                {AVAILABLE_ICONS.map(({ name, icon: Icon, label }) => (
                                    <button key={name} type="button" onClick={() => { setEditingHabit({...editingHabit, icon: name}); vibrate(10); }} title={label} className={clsx("flex flex-col items-center justify-center p-2 rounded-lg transition-all", editingHabit.icon === name ? clsx(getTheme(editingHabit.colorTheme).softBg, getTheme(editingHabit.colorTheme).primary, "ring-1", getTheme(editingHabit.colorTheme).border) : "text-slate-500 dark:text-forest-dark-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white")}>
                                        <Icon size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-forest-light-muted dark:text-forest-dark-muted mb-1">Description</label>
                            <textarea value={editingHabit.description} onChange={(e) => setEditingHabit({...editingHabit, description: e.target.value})} rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-dark-muted focus:outline-none focus:ring-2 focus:ring-forest-500/50 transition-all" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setEditingHabit(null)} className="px-5 py-2.5 text-slate-500 dark:text-forest-dark-muted hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors font-medium">Cancel</button><button type="submit" className={`px-8 py-2.5 text-white font-bold rounded-xl hover:opacity-90 shadow-xl transition-transform active:scale-95 bg-gradient-to-r ${getTheme(editingHabit.colorTheme).gradient}`}>Save Changes</button></div>
                     </div>
                </form>
              </div>
          </div>
      )}

      {habitToDelete && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-32 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-forest-dark-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-white/10 transform animate-slide-down">
            <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3 text-red-500"><div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full"><AlertCircle size={24} /></div><h3 className="text-xl font-bold text-slate-800 dark:text-white">Delete Habit?</h3></div><button onClick={() => setHabitToDelete(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button></div>
            <p className="text-slate-600 dark:text-forest-dark-muted mb-6">Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">"{habits.find(h => h.id === habitToDelete)?.title}"</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3"><button onClick={() => setHabitToDelete(null)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors">Cancel</button><button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 font-medium transition-all active:scale-95">Yes, Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const HabitTile: React.FC<{ habit: Habit; streak: ReturnType<typeof calculateStreak>; onToggle: (id: string, date: string, direction?: 'add' | 'remove', event?: React.MouseEvent) => void; onOpen: () => void; dragHandleProps?: any; }> = ({ habit, streak, onToggle, onOpen, dragHandleProps }) => {
  const todayIso = getTodayISO();
  const completionCount = getCompletionCount(habit, todayIso);
  const theme = getTheme(habit.colorTheme);
  const isCompletedToday = completionCount >= habit.target;
  const isDueToday = isHabitDue(habit, todayIso);
  const progressPercentage = Math.min(100, (completionCount / habit.target) * 100);

  return (
    <div className={clsx("relative flex flex-col p-4 rounded-2xl aspect-[4/5] transition-all duration-300 active:scale-95 group overflow-hidden cursor-pointer", isCompletedToday ? `bg-gradient-to-br ${theme.tileGradient} shadow-md` : "bg-white dark:bg-forest-dark-surface border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-1", !isDueToday && !isCompletedToday && "opacity-75 grayscale-[0.3]")} onClick={onOpen}>
        <div className="absolute top-2 right-2 p-2 z-20 text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full cursor-grab active:cursor-grabbing transition-colors touch-none" onClick={(e) => e.stopPropagation()} {...dragHandleProps}><GripVertical size={18} /></div>
        {!isCompletedToday && <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${theme.bgLow} blur-2xl opacity-50 pointer-events-none`}></div>}
        <div className="flex justify-between items-start relative z-10 pr-6">
            <div className={clsx("p-2 rounded-xl transition-colors", isCompletedToday ? "bg-white/20 text-white" : `${theme.softBg} ${theme.primary}`)}>{renderHabitIcon(habit.icon, "w-5 h-5")}</div>
            {habit.category && (
                <div className={clsx("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", isCompletedToday ? "bg-white/20 text-white" : `${theme.softBg} ${theme.softText}`)}>
                    {habit.category}
                </div>
            )}
        </div>
        <div className="flex flex-col gap-1 absolute top-16 left-4 z-10">
            {streak.current > 0 && (
                <div className={clsx("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full", isCompletedToday ? "bg-white/20 text-white" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400")}>
                    <Flame size={10} className="fill-current" /> <span>{streak.current}</span>
                </div>
            )}
            <div className={clsx("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full", isCompletedToday ? "bg-white/20 text-white" : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-forest-dark-muted border border-slate-100 dark:border-white/5")}>
                <Repeat size={10} /> <span>{FREQUENCY_LABELS[habit.frequency]}</span>
            </div>
        </div>
        <div className="mt-auto mb-14 relative z-10">
            <h3 className={clsx("font-bold text-base leading-tight line-clamp-2", isCompletedToday ? "text-white" : "text-slate-800 dark:text-white")}>{habit.title}</h3>
            <p className={clsx("text-[10px] font-medium mt-1", isCompletedToday ? "text-white/80" : "text-slate-400 dark:text-forest-dark-muted")}>{!isDueToday ? 'Rest Day' : (habit.target > 1 ? `${completionCount} / ${habit.target} done` : (isCompletedToday ? 'Done' : 'Tap to log'))}</p>
        </div>
        <div className="absolute bottom-4 right-4 z-10">
             <button onClick={(e) => { e.stopPropagation(); if (isCompletedToday) onToggle(habit.id, todayIso, 'remove', e); else onToggle(habit.id, todayIso, 'add', e); }} className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg relative overflow-hidden group/btn", isCompletedToday ? `bg-white ${theme.textDark || theme.primary} scale-110 ring-4 ring-white/20` : `${theme.softBg} ${theme.primary} hover:scale-105 active:scale-95`, !isDueToday && !isCompletedToday && "opacity-50 hover:opacity-100")}>
                {habit.target > 1 && !isCompletedToday && ( <div className="absolute inset-0 flex items-center justify-center"><svg className="absolute inset-0 w-full h-full -rotate-90 opacity-20" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" className="stroke-current opacity-30" strokeWidth="4"/><circle cx="18" cy="18" r="16" fill="none" className="stroke-current" strokeWidth="4" strokeDasharray={`${progressPercentage}, 100`}/></svg><span className="text-[10px] font-bold">{completionCount}</span></div> )}
                {(isCompletedToday || habit.target === 1) && <Check size={20} strokeWidth={4} className={isCompletedToday ? "text-current" : ""} />}
             </button>
        </div>
    </div>
  );
};

interface HabitCardProps {
  habit: Habit;
  streak: ReturnType<typeof calculateStreak>;
  onToggle: (id: string, date: string, direction?: 'add' | 'remove', event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onEditNote: (id: string, date: string, note: string) => void;
  isMobileView: boolean;
  onClose?: () => void;
  onDragHandleMouseDown?: React.MouseEventHandler;
  onDragHandleMouseUp?: React.MouseEventHandler;
  categories: string[];
}

const HabitCardFull: React.FC<HabitCardProps> = ({ habit, streak, onToggle, onDelete, onEdit, onEditNote, isMobileView, onDragHandleMouseDown, onDragHandleMouseUp, onClose, categories }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'timer'>('timeline');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [activeNote, setActiveNote] = useState<{date: string, content: string} | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [timerDuration, setTimerDuration] = useState(20 * 60);
  const [timerTimeLeft, setTimerTimeLeft] = useState(20 * 60);
  const [timerIsActive, setTimerIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateRange = useMemo(() => getTimelineDateRange(), []);
  const completionMap = useMemo(() => { const map = new Map<string, number>(); habit.completions.forEach(c => { map.set(c, (map.get(c) || 0) + 1); }); return map; }, [habit.completions]);
  const getCount = (iso: string) => completionMap.get(iso) || 0;
  const todayIso = getTodayISO();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const theme = getTheme(habit.colorTheme);
  const viewSuffix = isMobileView ? '-mobile' : '-desktop';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false); };
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (viewMode === 'timeline') {
        const timer = setTimeout(() => { const todayElement = document.getElementById(`day-${habit.id}-${todayIso}${viewSuffix}`); if (todayElement) todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, 100);
        return () => clearTimeout(timer);
    }
  }, [viewMode, habit.id, todayIso, isMobileView, viewSuffix]);

  useEffect(() => {
      if (timerIsActive && timerTimeLeft > 0) { timerRef.current = setInterval(() => setTimerTimeLeft((prev) => prev - 1), 1000); }
      else if (timerTimeLeft === 0) { if (timerRef.current) clearInterval(timerRef.current); setTimerIsActive(false); onToggle(habit.id, todayIso, 'add'); vibrate([100, 50, 100, 50, 100]); triggerCelebration(0.5, 0.5, habit.colorTheme); setTimerTimeLeft(timerDuration); }
      else { if (timerRef.current) clearInterval(timerRef.current); }
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerIsActive, timerTimeLeft, timerDuration, habit.id, todayIso, onToggle, habit.colorTheme]);

  const toggleTimer = () => { vibrate(20); setTimerIsActive(!timerIsActive); };
  const resetTimer = () => { vibrate(10); setTimerIsActive(false); setTimerTimeLeft(timerDuration); };
  const setDuration = (mins: number) => { vibrate(10); setTimerDuration(mins * 60); setTimerTimeLeft(mins * 60); setTimerIsActive(false); };
  const formatTime = (secs: number) => { const m = Math.floor(secs / 60); const s = secs % 60; return `${m}:${s.toString().padStart(2, '0')}`; };
  const { days: monthDays, firstDay: monthFirstDay } = getDaysInMonth(currentMonth);
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const handleJumpToToday = () => setCurrentMonth(new Date());
  const handleJumpToTodayTimeline = () => { const el = document.getElementById(`day-${habit.id}-${todayIso}${viewSuffix}`); if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); };
  
  const handleDayClick = (iso: string, isDisabled: boolean, event: React.MouseEvent) => {
      if (isNoteMode) { 
          if (iso <= todayIso) setActiveNote({ date: iso, content: habit.notes?.[iso] || '' }); 
          return; 
      }
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayIso = yesterdayDate.toISOString().split('T')[0];
      
      if (!isDisabled && (iso === todayIso || iso === yesterdayIso)) onToggle(habit.id, iso, undefined, event);
  };

  const getDayStatus = (dateObj: Date, dateIso: string) => { 
      const isToday = dateIso === todayIso; 
      const hasNote = !!habit.notes?.[dateIso]; 
      const due = isHabitDue(habit, dateIso); 
      const isFuture = dateIso > todayIso;
      const isPast = dateIso < todayIso;
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayIso = yesterdayDate.toISOString().split('T')[0];
      const isYesterday = dateIso === yesterdayIso;
      
      return { isDisabled: !isToday && !due, isToday, isYesterday, hasNote, due, isFuture, isPast }; 
  };

  return (
    <>
    <div className="relative transition-all duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 md:mb-6 gap-3 md:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {!isMobileView && onDragHandleMouseDown && ( <div className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 dark:text-white/20 hover:text-forest-500 dark:hover:text-forest-400 mt-1 hidden md:flex items-center justify-center p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" onMouseDown={onDragHandleMouseDown} onMouseUp={onDragHandleMouseUp}> <GripVertical size={20} /> </div> )}
          <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
            {!isMobileView && ( 
                <div className="flex items-center gap-2">
                    <div className={clsx("p-2 rounded-xl bg-slate-100 dark:bg-white/5", theme.primary)}>
                        {renderHabitIcon(habit.icon, "w-6 h-6")}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate tracking-tight leading-none">{habit.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{habit.category}</span>
                    </div>
                </div> 
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
                {streak.current > 0 && ( <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-red-500/20 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30"> <Flame size={10} className="text-orange-500 dark:text-orange-400 fill-current animate-pulse" /> {streak.current} Day Streak </div> )}
                <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-forest-dark-muted"><Repeat size={10}/> {FREQUENCY_LABELS[habit.frequency]}</div>
                {habit.target > 1 && ( <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-forest-dark-muted">Target: {habit.target}/day</span> )}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-forest-dark-muted ml-1"> <Clock size={10} /> Last: <span className="font-medium text-slate-600 dark:text-forest-100">{getLastCompletedText(habit)}</span> </div>
            </div>
            {habit.description && <div className="text-xs text-slate-500 dark:text-forest-dark-muted leading-relaxed max-w-full md:max-w-[90%] w-full break-words">{habit.description}</div>}
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-4 md:mt-0">
           {viewMode !== 'timer' && habit.target > 1 && (
               <div className="flex items-center bg-slate-100 dark:bg-black/40 rounded-lg p-1 mr-1 border border-slate-200 dark:border-white/5">
                   <button onClick={() => onToggle(habit.id, todayIso, 'remove')} disabled={getCount(todayIso) === 0} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md disabled:opacity-30 transition-all active:scale-90"><Minus size={14} className="text-slate-600 dark:text-white" /></button>
                   <div className="px-3 flex flex-col items-center w-12"><span className="text-xs font-bold text-slate-800 dark:text-white">{getCount(todayIso)}/{habit.target}</span><div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full mt-0.5 overflow-hidden"><div className={`h-full ${theme.bg} transition-all duration-500 ease-out`} style={{width: `${Math.min(100, (getCount(todayIso)/habit.target)*100)}%`}}></div></div></div>
                   <button onClick={(e) => onToggle(habit.id, todayIso, 'add', e)} disabled={getCount(todayIso) >= habit.target} className={`p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all active:scale-90 ${theme.text} disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed`}><Plus size={14} /></button>
               </div>
           )}
           <div className="flex items-center bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 p-1 gap-1">
               <button onClick={() => { setIsNoteMode(!isNoteMode); setViewMode('timeline'); }} className={clsx("p-1.5 rounded-md transition-all", isNoteMode ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10")} title="Journal Mode"><NotebookPen size={16} /></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
               <button onClick={() => { setViewMode('timeline'); setIsNoteMode(false); }} className={clsx("p-1.5 rounded-md transition-colors", viewMode === 'timeline' ? "bg-white dark:bg-forest-dark-surface text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-white")} title="Timeline View"><List size={16} /></button>
               <button onClick={() => { setViewMode('calendar'); setIsNoteMode(false); }} className={clsx("p-1.5 rounded-md transition-colors", viewMode === 'calendar' ? "bg-white dark:bg-forest-dark-surface text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-white")} title="Calendar View"><CalendarIcon size={16} /></button>
               <button onClick={() => { setViewMode('timer'); setIsNoteMode(false); }} className={clsx("p-1.5 rounded-md transition-colors", viewMode === 'timer' ? "bg-white dark:bg-forest-dark-surface text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-white")} title="Focus Timer"><Timer size={16} /></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
               <button onClick={() => viewMode === 'timeline' ? handleJumpToTodayTimeline() : handleJumpToToday()} className="p-1.5 rounded-md text-slate-400 hover:text-forest-600 dark:hover:text-forest-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors" title="Jump to Today"><RotateCcw size={16} /></button>
           </div>
           <div className="relative" ref={menuRef}>
              <button onClick={() => { setShowMenu(!showMenu); vibrate(10); }} className={clsx("p-2 rounded-lg transition-all", showMenu ? "bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white")}><MoreHorizontal size={20} /></button>
              {showMenu && ( <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-forest-dark-surface rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-scale-in origin-top-right"><button onClick={() => { setShowHistoryModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"><History size={16} className="text-slate-400" /> View History</button><button onClick={(e) => { e.stopPropagation(); onEdit(habit); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-white/5"><Edit size={16} className="text-slate-400" /> Edit Habit</button><div className="h-px bg-slate-100 dark:bg-white/5 my-0"></div><button onClick={(e) => { e.stopPropagation(); onDelete(habit.id); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"><Trash2 size={16} /> Delete Habit</button></div> )}
           </div>
        </div>
      </div>
      <div className={clsx("relative rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 p-3 md:p-4 min-h-[120px] md:min-h-[140px] transition-colors duration-300", isNoteMode && "ring-2 ring-amber-400/30 bg-amber-50/50 dark:bg-amber-900/5", viewMode === 'timer' && "flex items-center justify-center bg-slate-100/50 dark:bg-black/40")}>
        {isNoteMode && ( <div className="absolute top-0 left-0 right-0 flex justify-center -mt-3 z-20"><span className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 text-amber-700 dark:text-amber-200 text-[10px] font-bold px-4 py-1 rounded-full shadow-lg border border-amber-300 dark:border-amber-700 animate-slide-up flex items-center gap-1.5"> <NotebookPen size={12} /> Select a day to view or edit note</span></div> )}
        {viewMode === 'timeline' ? (
            <div className="relative"><div className="overflow-x-auto pb-4 pt-2 scrollbar-hide flex gap-2 md:gap-3 snap-x" style={{ scrollBehavior: 'smooth' }}>{dateRange.map(({ iso, dateObj }) => {
                    const count = getCount(iso); const isDailyDone = count >= habit.target; const isPartial = count > 0 && count < habit.target; const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; const { isDisabled, isToday, isYesterday, hasNote, due, isFuture, isPast } = getDayStatus(dateObj, iso);
                    const allowedForToggle = iso === todayIso || iso === (new Date(Date.now() - 86400000).toISOString().split('T')[0]);
                    const buttonDisabled = isNoteMode ? isFuture : !allowedForToggle;

                    return (
                      <div key={iso} id={`day-${habit.id}-${iso}${viewSuffix}`} className="flex flex-col items-center gap-1.5 md:gap-2 flex-shrink-0 snap-start group/day"><span className={clsx("text-[9px] md:text-[10px] font-bold uppercase tracking-wider", isToday ? theme.primary : "text-slate-400 dark:text-forest-dark-muted")}>{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span><button onClick={(e) => handleDayClick(iso, isDisabled, e)} disabled={buttonDisabled} className={clsx("w-9 h-11 md:w-10 md:h-12 rounded-lg transition-all duration-300 border flex flex-col items-center justify-center relative", isDailyDone ? `${theme.bg} ${theme.border} ${theme.shadow} scale-[1.05]` : isPartial ? `${theme.softBg} border-transparent` : !due ? "bg-slate-200 dark:bg-white/5 border-transparent opacity-40" : isWeekend ? "bg-slate-100 dark:bg-neutral-900/50 border-transparent" : "bg-white dark:bg-black/40 border-slate-200 dark:border-white/10", !buttonDisabled && "hover:bg-slate-50 dark:hover:bg-neutral-900 active:scale-95", buttonDisabled && "opacity-30 grayscale-[0.5] cursor-not-allowed", isNoteMode && !isFuture && "hover:ring-2 hover:ring-amber-400 cursor-pointer hover:scale-110")}>{isDailyDone && <div className="w-2 h-2 bg-white rounded-full animate-scale-in"></div>}{isPartial && <span className={`text-[9px] font-bold ${theme.primary}`}>{count}</span>}{hasNote && <div className={clsx("absolute top-1 right-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", isDailyDone ? "bg-yellow-300 shadow-sm" : "bg-amber-500")}></div>}</button><span className={clsx("text-[10px] md:text-xs font-medium", isToday ? "text-slate-900 dark:text-white" : "text-slate-500")}>{dateObj.getDate()}</span></div>
                    );
                  })}</div></div>
        ) : viewMode === 'calendar' ? (
            <div className="transition-all duration-300 max-w-[95%] md:max-w-[70%] mx-auto"><div className="flex justify-between items-center mb-2 px-2"><div className="flex items-center gap-2"><button onClick={handlePrevMonth}><ChevronLeft size={16}/></button><span className="text-slate-800 dark:text-white font-bold text-sm">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span><button onClick={handleNextMonth}><ChevronRight size={16}/></button></div></div><div className="grid grid-cols-7 gap-1 mb-1 text-center">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-[9px] text-slate-400 uppercase font-bold">{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{Array.from({ length: monthFirstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}{Array.from({ length: monthDays }).map((_, i) => {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1); const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; const count = getCount(iso); const isDone = count >= habit.target; const isPartial = count > 0 && count < habit.target; const { isToday, hasNote, due, isFuture } = getDayStatus(date, iso);
                        const yesterdayDate = new Date();
                        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                        const yesterdayIso = yesterdayDate.toISOString().split('T')[0];
                        const allowedForToggle = iso === todayIso || iso === yesterdayIso;
                        const buttonDisabled = isNoteMode ? isFuture : !allowedForToggle;

                        return ( <button key={i} onClick={(e) => handleDayClick(iso, false, e)} disabled={buttonDisabled} className={clsx("aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all relative", isDone ? `${theme.bg} text-white` : isPartial ? `${theme.softBg} ${theme.primary}` : !due ? "bg-slate-100 dark:bg-white/5 text-slate-400 opacity-40" : "bg-slate-200 dark:bg-neutral-900/50 text-slate-600", buttonDisabled && "opacity-30 grayscale-[0.5] cursor-not-allowed", !buttonDisabled && "hover:bg-slate-300 dark:hover:bg-neutral-800 active:scale-90", isToday && !isDone && `ring-2 ${theme.ring}`, hasNote && "after:content-[''] after:absolute after:bottom-0.5 after:w-1 after:h-1 after:bg-amber-400 after:rounded-full")}>{i + 1}</button> );
                    })}</div></div>
        ) : (
            <div className="w-full flex flex-col items-center justify-center animate-fade-in p-4"><div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-6"><svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="6" /><circle cx="50" cy="50" r="45" fill="none" className={clsx("stroke-current transition-all duration-1000 ease-linear", theme.textDark || theme.primary)} strokeWidth="6" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * timerTimeLeft / timerDuration)} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className={clsx("text-4xl md:text-5xl font-mono font-bold tracking-tighter", timerIsActive ? (theme.textDark || theme.primary) : "text-slate-800 dark:text-white")}>{formatTime(timerTimeLeft)}</span><span className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">{timerIsActive ? 'Focusing' : 'Ready'}</span></div></div><div className="flex flex-col items-center gap-6 w-full max-w-xs"><div className="flex items-center gap-4"><button onClick={resetTimer} className="p-3 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition-all active:scale-95"><RotateCcw size={20} /></button><button onClick={toggleTimer} className={clsx("p-5 rounded-full text-white shadow-xl transition-all active:scale-95 hover:scale-105 flex items-center justify-center", theme.bg, theme.shadow)}>{timerIsActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}</button></div><div className="flex gap-2">{[5, 10, 20, 30, 60].map(mins => ( <button key={mins} onClick={() => setDuration(mins)} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all border", timerDuration === mins * 60 ? `${theme.softBg} ${theme.primary} ${theme.border}` : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10")}>{mins}m</button> ))}</div></div></div>
        )}
      </div>
    </div>
    {activeNote && ( 
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
        <div className="bg-white dark:bg-forest-dark-surface rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-white/10 flex flex-col p-5 md:p-8 space-y-4 transform animate-scale-in relative overflow-hidden max-h-[85vh]">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400/50 via-amber-200/50 to-amber-400/50"></div>
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5 shrink-0">
            <div className="flex flex-col">
              <h3 className="font-bold text-forest-900 dark:text-white text-xl flex items-center gap-2">
                <NotebookPen size={20} className="text-amber-500" /> Habit Log
              </h3>
              <span className="text-[10px] font-bold text-forest-light-muted dark:text-forest-dark-muted uppercase tracking-widest mt-0.5">
                {formatDate(activeNote.date)}
              </span>
            </div>
            <button onClick={() => setActiveNote(null)} className="p-1.5 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 relative min-h-0 flex flex-col">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_0)] [background-size:20px_20px] rounded-xl"></div>
            
            <textarea 
              value={activeNote.content} 
              onChange={(e) => setActiveNote({...activeNote, content: e.target.value})} 
              className="w-full flex-1 p-5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[#4e342e] dark:text-[#d7ccc8] font-hand text-xl leading-[32px] focus:outline-none focus:ring-4 focus:ring-amber-400/10 transition-all resize-none shadow-inner overflow-y-auto custom-scrollbar"
              placeholder="How was your progress today? Write your reflections here..." 
              autoFocus 
              style={{
                backgroundImage: 'linear-gradient(transparent 31px, rgba(141, 110, 99, 0.08) 31px)',
                backgroundSize: '100% 32px'
              }}
            />
          </div>

          <div className="flex gap-3 pt-2 shrink-0 pb-4">
            <button 
              onClick={() => {onEditNote(habit.id, activeNote.date, ''); setActiveNote(null); vibrate(20);}} 
              className="px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-all flex items-center justify-center active:scale-95 shrink-0" 
              title="Delete Note"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={() => {onEditNote(habit.id, activeNote.date, activeNote.content); setActiveNote(null); vibrate(15);}} 
              className="flex-1 bg-gradient-to-r from-forest-600 to-forest-800 hover:opacity-90 text-white py-3 rounded-xl font-bold shadow-lg shadow-forest-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Note
            </button>
          </div>
        </div>
      </div>
    )}
    {showHistoryModal && ( <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-10 md:pt-20 bg-black/60 backdrop-blur-sm animate-fade-in"><div className="bg-white dark:bg-forest-dark-surface rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] border border-slate-200 dark:border-white/10 flex flex-col p-6 animate-slide-down"><div className="flex justify-between mb-4"><h3 className="font-bold dark:text-white">History</h3><button onClick={()=>setShowHistoryModal(false)}><X/></button></div><div className="flex-1 overflow-y-auto space-y-2">{Object.entries(habit.notes || {}).length === 0 ? ( <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-forest-dark-muted"><NotebookPen className="w-12 h-12 mb-2 opacity-20" /><p>No notes found</p></div> ) : ( Object.entries(habit.notes || {}).sort((a,b)=>b[0].localeCompare(a[0])).map(([d, c]: [string, string]) => ( <div key={d} onClick={()=>{setShowHistoryModal(false); setActiveNote({date:d, content:c})}} className="p-3 border rounded-lg dark:border-white/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"><div className="text-xs font-bold text-amber-500">{formatDate(d)}</div><div className="text-sm dark:text-white">{c}</div></div> )) )}</div></div></div> )}
    </>
  );
};

export default HabitList;

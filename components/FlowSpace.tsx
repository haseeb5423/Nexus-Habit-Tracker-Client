
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Habit } from '../types';
import { getTodayISO, isHabitDue } from '../utils/dateUtils';
import { 
  ChevronLeft, Bell, Play, Pause, RotateCcw, Volume2, VolumeX, 
  Brain, Timer as TimerIcon, Sparkles, Check, List, Clock, User, Plus
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

interface FlowSpaceProps {
  habits: Habit[];
  onCompleteHabit: (id: string, date: string, direction?: 'add' | 'remove') => void;
  onNavigate: (path: string) => void;
}

const BREATH_PATTERNS = [
    { id: 'box', label: 'Box', sub: '4-4-4-4', inhale: 4, hold: 4, exhale: 4, rest: 4 },
    { id: '478', label: 'Relax', sub: '4-7-8', inhale: 4, hold: 7, exhale: 8, rest: 0 },
    { id: 'calm', label: 'Calm', sub: '5-0-5-2', inhale: 5, hold: 0, exhale: 5, rest: 2 },
];

const FlowSpace: React.FC<FlowSpaceProps> = ({ habits, onCompleteHabit, onNavigate }) => {
    const today = getTodayISO();
    const activeHabits = habits.filter(h => isHabitDue(h, today));

    const [selectedHabitId, setSelectedHabitId] = useState<string>(activeHabits[0]?.id || '');
    const [duration, setDuration] = useState(25 * 60);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [breathPattern, setBreathPattern] = useState(BREATH_PATTERNS[0]);
    const [breathState, setBreathState] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
    
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const vibrate = (pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete();
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isActive, timeLeft]);

    useEffect(() => {
        if (!isActive) { setBreathState('rest'); if(breathTimerRef.current) clearInterval(breathTimerRef.current); return; }
        
        let step = 0;
        const totalSteps = breathPattern.inhale + breathPattern.hold + breathPattern.exhale + breathPattern.rest;
        
        const startBreathCycle = () => {
            step = 0;
            if(breathTimerRef.current) clearInterval(breathTimerRef.current);
            
            breathTimerRef.current = setInterval(() => {
                step++;
                if (step <= breathPattern.inhale) setBreathState('inhale');
                else if (step <= breathPattern.inhale + breathPattern.hold) setBreathState('hold');
                else if (step <= breathPattern.inhale + breathPattern.hold + breathPattern.exhale) setBreathState('exhale');
                else if (step <= totalSteps) setBreathState('rest');
                if (step >= totalSteps) step = 0;
            }, 1000);
        };

        startBreathCycle();
        return () => { if(breathTimerRef.current) clearInterval(breathTimerRef.current); };
    }, [isActive, breathPattern]);

    const handleComplete = () => {
        setIsActive(false);
        if (selectedHabitId) {
            onCompleteHabit(selectedHabitId, today, 'add');
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#8BC34A', '#66BB6A', '#FFFFFF'] });
        }
        vibrate([100, 50, 100, 50, 150]);
        setTimeLeft(duration);
    };

    const toggleActive = () => {
        vibrate(30);
        setIsActive(!isActive);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const selectedHabit = habits.find(h => h.id === selectedHabitId);

    // Segmented ring calculation
    const segments = 60;
    const progress = (duration - timeLeft) / duration;
    const activeSegments = Math.floor(progress * segments);

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-forest-dark-bg transition-colors duration-500 overflow-hidden relative">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between z-10">
                <button 
                    onClick={() => onNavigate('/')}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronLeft size={24} className="text-slate-600 dark:text-white" />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Focus Mode</h2>
                <button className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95">
                    <Bell size={24} className="text-slate-600 dark:text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
                <div className="max-w-md mx-auto flex flex-col items-center">
                    
                    {/* Segmented Timer Ring */}
                    <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center my-8">
                        {/* Outer Glow / Background Ring */}
                        <div className="absolute inset-0 rounded-full bg-forest-50 dark:bg-forest-900/10 blur-3xl opacity-50"></div>
                        
                        {/* Segmented Progress SVG */}
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90">
                            {Array.from({ length: segments }).map((_, i) => {
                                const angle = (i / segments) * 360;
                                const isActiveSegment = i < activeSegments;
                                const isCurrentSegment = i === activeSegments;
                                
                                return (
                                    <line
                                        key={i}
                                        x1="50" y1="8"
                                        x2="50" y2="18"
                                        transform={`rotate(${angle}, 50, 50)`}
                                        className={clsx(
                                            "transition-all duration-700",
                                            isActiveSegment 
                                                ? "stroke-forest-400 dark:stroke-forest-500" 
                                                : isCurrentSegment && isActive
                                                    ? "stroke-forest-300 animate-pulse" 
                                                    : "stroke-slate-100 dark:stroke-white/10"
                                        )}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </svg>

                        {/* Centered Text */}
                        <div className="text-center flex flex-col items-center z-10">
                            <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                {formatTime(timeLeft)}
                            </span>
                            <p className="text-slate-400 dark:text-forest-dark-muted font-medium text-sm mt-1 uppercase tracking-widest">
                                {isActive ? (
                                    breathState === 'inhale' ? 'Inhaling...' : 
                                    breathState === 'hold' ? 'Holding...' : 
                                    breathState === 'exhale' ? 'Exhaling...' : 'Resting...'
                                ) : (
                                    selectedHabit?.title || 'Deep work session'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Primary Controls */}
                    <div className="w-full flex gap-4 mt-4">
                        <button 
                            onClick={toggleActive}
                            className={clsx(
                                "flex-1 py-4 px-6 rounded-3xl font-black text-lg transition-all active:scale-95 shadow-xl shadow-forest-500/20",
                                isActive 
                                    ? "bg-white dark:bg-forest-dark-surface text-forest-600 border-2 border-forest-500/30" 
                                    : "bg-forest-400 text-white hover:bg-forest-500"
                            )}
                        >
                            {isActive ? 'Pause Flow' : 'Start Focus'}
                        </button>
                        <button 
                            className="flex-1 py-4 px-6 rounded-3xl font-black text-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/40 border border-transparent transition-all"
                        >
                            Stay Focused
                        </button>
                    </div>

                    {/* Current Focus Section */}
                    <div className="w-full mt-12 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Current Focus</h3>
                            <button className="text-sm font-bold text-slate-400 hover:text-forest-500">View All</button>
                        </div>

                        {/* Habit Cards List */}
                        <div className="space-y-4">
                            {activeHabits.length > 0 ? activeHabits.map(h => (
                                <button 
                                    key={h.id}
                                    onClick={() => { setSelectedHabitId(h.id); vibrate(10); }}
                                    className={clsx(
                                        "w-full p-5 rounded-3xl border text-left transition-all flex items-start gap-4 group",
                                        selectedHabitId === h.id 
                                            ? "bg-slate-50/50 dark:bg-forest-900/10 border-forest-200 dark:border-forest-500/30" 
                                            : "bg-white dark:bg-forest-dark-surface border-slate-100 dark:border-white/5 hover:border-slate-200"
                                    )}
                                >
                                    <div className={clsx(
                                        "p-3 rounded-2xl transition-colors shrink-0",
                                        selectedHabitId === h.id ? "bg-forest-100 dark:bg-forest-500/20" : "bg-slate-100 dark:bg-white/5"
                                    )}>
                                        <Brain size={24} className={clsx(selectedHabitId === h.id ? "text-forest-600 dark:text-forest-400" : "text-slate-400")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white truncate">{h.title}</h4>
                                            {selectedHabitId === h.id && <div className="w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center shadow-lg"><Check size={12} className="text-white" /></div>}
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-forest-dark-muted leading-relaxed line-clamp-2">
                                            {h.description || 'Targeted focus session to align with your personal growth goals.'}
                                        </p>
                                    </div>
                                </button>
                            )) : (
                                <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                    <Sparkles size={32} className="mx-auto text-forest-300 mb-3" />
                                    <p className="text-slate-500 dark:text-forest-dark-muted font-bold">No active habits today</p>
                                    <button onClick={() => onNavigate('/habits')} className="text-forest-500 text-xs mt-2 hover:underline">Go to My Habits</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Nav Mockup */}
            <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
                <div className="bg-slate-900 dark:bg-black p-2 rounded-[2.5rem] flex items-center gap-2 shadow-2xl pointer-events-auto">
                    <button onClick={() => onNavigate('/')} className="p-4 rounded-full text-slate-500 hover:text-white transition-colors"><List size={20} /></button>
                    <button className="p-4 rounded-full text-slate-500 hover:text-white transition-colors"><Clock size={20} /></button>
                    <button 
                        onClick={() => onNavigate('/habits')}
                        className="w-14 h-14 rounded-full bg-forest-400 text-white flex items-center justify-center shadow-lg shadow-forest-500/40 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                    <button className="p-4 rounded-full text-slate-500 hover:text-white transition-colors"><User size={20} /></button>
                    <button onClick={() => setIsMuted(!isMuted)} className="p-4 rounded-full text-slate-500 hover:text-white transition-colors">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlowSpace;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { JournalEntry, Habit } from '../types';
import { getStoredJournal, saveJournal, api } from '../services/storage';
import { getTodayISO, formatDate } from '../utils/dateUtils';
import { Book, ChevronLeft, ChevronRight, Save, Smile, Meh, Frown, Zap, Moon, Search, Sparkles, Calendar as CalendarIcon, X, StickyNote, CheckSquare, Droplets, Dumbbell, BookOpen, Sun, Briefcase, Music, Heart, Coffee, Utensils, Bike, Footprints, PenTool } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

interface JournalProps {
    habits?: Habit[];
}

const MOODS = [
    { id: 'happy', icon: Smile, color: 'text-emerald-600', label: 'Happy' },
    { id: 'excited', icon: Zap, color: 'text-amber-500', label: 'Excited' },
    { id: 'neutral', icon: Meh, color: 'text-blue-500', label: 'Neutral' },
    { id: 'tired', icon: Moon, color: 'text-indigo-400', label: 'Tired' },
    { id: 'sad', icon: Frown, color: 'text-slate-500', label: 'Sad' },
];

const PROMPTS = [
    "What was the best part of today?",
    "What is one thing I learned today?",
    "How did I move closer to my goals?",
    "What am I grateful for right now?",
    "What is challenging me currently?",
    "Describe today in three words.",
    "Who made me smile today?",
    "What habit do I want to improve tomorrow?"
];

// Re-map icons for syncing display
const ICONS: Record<string, any> = {
    CheckSquare, Droplets, Dumbbell, BookOpen, Moon, Sun, Briefcase, Music, Heart, Coffee, Utensils, Zap, Smile, Bike, Footprints, PenTool
};

const THEME_TEXT: Record<string, string> = {
    pink: 'text-pink-600',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    orange: 'text-orange-600',
};

const THEME_BG_LIGHT: Record<string, string> = {
    pink: 'bg-pink-50',
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    green: 'bg-emerald-50',
    orange: 'bg-orange-50',
};

// 3D Transform Helpers
const preserve3d: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d'
};

const backfaceHidden: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden'
};

const Journal: React.FC<JournalProps> = ({ habits = [] }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getTodayISO());
    const [currentContent, setCurrentContent] = useState('');
    const [currentMood, setCurrentMood] = useState<JournalEntry['mood'] | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Page Turn Animation State
    const [turnState, setTurnState] = useState<'forward' | 'backward' | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Optimized Data Loading
    useEffect(() => {
        const t = setTimeout(() => {
            const loaded = getStoredJournal();
            setEntries(loaded);
            setIsLoaded(true);
        }, 0);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isLoaded && turnState === null) {
            const entry = entries.find(e => e.date === selectedDate);
            if (entry) {
                setCurrentContent(entry.content);
                setCurrentMood(entry.mood);
            } else {
                setCurrentContent('');
                setCurrentMood(undefined);
            }
        }
    }, [selectedDate, entries, turnState, isLoaded]);

    const handleSave = () => {
        setIsSaving(true);
        const updatedEntries = [...entries];
        const existingIndex = updatedEntries.findIndex(e => e.date === selectedDate);
        
        const newEntry: JournalEntry = {
            id: existingIndex >= 0 ? updatedEntries[existingIndex].id : uuidv4(),
            date: selectedDate,
            content: currentContent,
            mood: currentMood,
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            updatedEntries[existingIndex] = newEntry;
        } else {
            updatedEntries.push(newEntry);
        }

        setEntries(updatedEntries);
        // Local Save
        saveJournal(updatedEntries);

        // Cloud Sync Logic
        if (api.isLoggedIn()) {
            api.syncData({ journal: updatedEntries });
        }
        
        setTimeout(() => setIsSaving(false), 800);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentContent || currentMood) {
                const saved = entries.find(e => e.date === selectedDate);
                if (saved?.content !== currentContent || saved?.mood !== currentMood) {
                    handleSave();
                }
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [currentContent, currentMood]);

    const filteredDates = useMemo(() => {
        let filtered = entries;
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = entries.filter(e => 
                e.content.toLowerCase().includes(lowerQ) || 
                formatDate(e.date).toLowerCase().includes(lowerQ)
            );
        }
        
        const dates = filtered.map(e => e.date).sort((a, b) => b.localeCompare(a));
        if (!searchQuery && !dates.includes(getTodayISO())) {
            dates.unshift(getTodayISO());
        }
        return dates;
    }, [entries, searchQuery]);

    const habitNotes = useMemo(() => {
        return habits.filter(h => h.notes && h.notes[selectedDate]).map(h => ({
            id: h.id,
            title: h.title,
            icon: h.icon || 'CheckSquare',
            color: h.colorTheme,
            content: h.notes![selectedDate]
        }));
    }, [habits, selectedDate]);

    const changeDate = (offset: number) => {
        if (turnState !== null) return; 

        const direction = offset > 0 ? 'forward' : 'backward';
        setTurnState(direction);

        setTimeout(() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + offset);
            const newDate = d.toISOString().split('T')[0];
            setSelectedDate(newDate);
            
            // Optimistic update for smoothness
            const entry = entries.find(e => e.date === newDate);
            setCurrentContent(entry ? entry.content : '');
            setCurrentMood(entry ? entry.mood : undefined);
        }, 300);

        setTimeout(() => {
            setTurnState(null);
        }, 600);
    };

    const insertPrompt = () => {
        const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        const newContent = currentContent ? `${currentContent}\n\nPrompt: ${randomPrompt}\n` : `Prompt: ${randomPrompt}\n`;
        setCurrentContent(newContent);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
            }
        }, 10);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full perspective-1500 relative overflow-hidden animate-fade-in">
            <style>{`
                @keyframes turnForward {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(-180deg); }
                }
                @keyframes turnBackward {
                    0% { transform: rotateY(-180deg); }
                    100% { transform: rotateY(0deg); }
                }
            `}</style>
            
            {/* Ambient Lighting Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-forest-500/10 dark:bg-forest-900/20 blur-[100px] rounded-full"></div>
            </div>

            {/* THE BOOK CONTAINER */}
            <div 
                className={clsx(
                    "relative transition-all ease-[cubic-bezier(0.645,0.045,0.355,1.000)] shadow-2xl",
                    "aspect-[3/4] md:aspect-[3/2]", 
                    "w-full max-w-[65vh] md:max-w-[120vh]", 
                    isOpen ? "translate-x-0 md:translate-x-[2%] duration-1000" : "cursor-pointer duration-500 hover:scale-[1.02]"
                )}
                style={preserve3d}
                onClick={() => !isOpen && setIsOpen(true)}
            >
                {/* Book Shadow */}
                <div className={clsx(
                    "absolute top-4 left-4 w-full h-full bg-black/40 blur-2xl rounded-r-xl transition-all duration-1000",
                    isOpen ? "opacity-30 translate-y-8 scale-x-110" : "opacity-50"
                )}></div>

                {/* --- MOVING PART: FRONT COVER & LEFT PAGE --- */}
                <div 
                    className="absolute inset-0 z-30 origin-left transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1.000)] rounded-r-xl rounded-l-md"
                    style={{ 
                        ...preserve3d, 
                        transform: isOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                        transitionDuration: isOpen ? '1200ms' : '800ms'
                    }}
                >
                    {/* FRONT COVER */}
                    <div 
                        className="absolute inset-0 rounded-r-xl rounded-l-md overflow-hidden bg-forest-800 transition-colors duration-500"
                        style={{ 
                            ...backfaceHidden, 
                            transform: 'translateZ(1px)',
                            boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.3), inset -2px 0 5px rgba(255,255,255,0.1)'
                        }}
                    >
                        {/* Improved Texture (CSS Gradient instead of SVG Filter) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4031] to-[#0d221a] dark:from-[#0c140c] dark:to-black"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_0)] [background-size:20px_20px] opacity-[0.03]"></div>
                        
                        {/* Gradient Shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none"></div>

                        {/* Decoration Lines */}
                        <div className="absolute top-3 bottom-3 left-5 right-3 border border-white/10 rounded-r-lg rounded-l-sm"></div>
                        <div className="absolute top-5 bottom-5 left-7 right-5 border-2 border-dashed border-[#c4a484]/30 rounded-r-md rounded-l-sm"></div>

                        {/* Spine Detail */}
                        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/60 via-[#0a1812] to-transparent border-r border-black/20"></div>

                        {/* Cover Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                            <div className="w-32 h-32 mb-8 rounded-full border-[3px] border-[#c5a059]/40 flex items-center justify-center bg-black/20 shadow-lg backdrop-blur-sm">
                                <Book size={56} className="text-[#e0c38c]" strokeWidth={1.2} />
                            </div>

                            <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#fdfbf7] via-[#e0c38c] to-[#b38b4d] tracking-widest drop-shadow-sm">
                                NEXUS
                            </h1>
                            
                            <h2 className="text-sm md:text-base font-serif text-[#c5a059] tracking-[0.6em] mt-3 font-medium uppercase opacity-90">
                                Journal
                            </h2>

                            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/70 to-transparent my-8"></div>
                            
                            <p className="text-[#e0c38c]/70 font-sans text-[9px] uppercase tracking-[0.3em] font-semibold">
                                Vol. I • Personal Growth
                            </p>
                        </div>
                    </div>

                    {/* INNER LEFT PAGE (History) */}
                    <div 
                        className="absolute inset-0 bg-[#f4f1ea] dark:bg-[#1a1c1a] rounded-l-xl rounded-r-md flex overflow-hidden shadow-inner border-r border-[#e0dcd5] dark:border-[#2a2a2a] transition-colors duration-500"
                        style={{ 
                            ...backfaceHidden,
                            transform: 'rotateY(180deg) translateZ(1px)' 
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                         {/* Simple Paper Texture (CSS) */}
                         <div className="absolute inset-0 bg-[#f4f1ea] dark:bg-[#1a1c1a]"></div>
                         <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_0)] [background-size:16px_16px]"></div>
                         <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent w-8 pointer-events-none"></div>

                         <div className="flex-1 p-6 md:p-8 flex flex-col relative z-10 w-full">
                             <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#d7ccc8] dark:border-white/10">
                                 <h3 className="font-serif text-2xl text-[#5d4037] dark:text-[#e0e0e0] font-bold flex items-center gap-2">
                                    <CalendarIcon size={20} /> History
                                 </h3>
                                 <button onClick={() => setIsOpen(false)} className="text-[#8d6e63] dark:text-forest-400 hover:text-[#5d4037] dark:hover:text-forest-300 text-xs uppercase tracking-wider font-bold hover:underline">Close</button>
                             </div>

                             <div className="relative mb-4">
                                <input 
                                    type="text" 
                                    placeholder="Search entries..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#ebe7df] dark:bg-white/5 border border-[#d7ccc8] dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm font-serif text-[#5d4037] dark:text-[#d7ccc8] placeholder-[#a1887f] dark:placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#8d6e63] dark:focus:ring-forest-500 transition-all"
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1887f] dark:text-white/30" />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1887f] dark:text-white/30 hover:text-[#5d4037] dark:hover:text-white">
                                        <X size={14} />
                                    </button>
                                )}
                             </div>

                             <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[#d7ccc8] dark:scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
                                {!isLoaded ? (
                                    <div className="text-center py-4 text-[#a1887f]">Loading...</div>
                                ) : (
                                    filteredDates.map(date => {
                                        const entry = entries.find(e => e.date === date);
                                        const MoodIcon = entry?.mood ? MOODS.find(m => m.id === entry.mood)?.icon : null;
                                        const isSelected = selectedDate === date;
                                        return (
                                            <button 
                                                key={date}
                                                onClick={() => setSelectedDate(date)}
                                                className={clsx(
                                                    "w-full text-left px-3 py-3 rounded border transition-all flex justify-between items-center group relative overflow-hidden",
                                                    isSelected 
                                                        ? "bg-white dark:bg-white/10 border-[#d7ccc8] dark:border-transparent shadow-sm" 
                                                        : "border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#8d6e63] dark:text-[#a1887f]"
                                                )}
                                            >
                                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8d6e63] dark:bg-forest-500"></div>}
                                                <div className="flex flex-col min-w-0">
                                                    <span className={clsx("font-serif text-lg leading-none truncate", isSelected ? "text-[#3e2723] dark:text-white font-bold" : "")}>
                                                        {formatDate(date)}
                                                    </span>
                                                    {entry && (
                                                        <span className="text-[10px] text-[#a1887f] dark:text-white/40 truncate max-w-[120px] mt-1 font-sans block">
                                                            {entry.content.substring(0, 30) || "Empty entry"}
                                                        </span>
                                                    )}
                                                </div>
                                                {MoodIcon ? <MoodIcon size={16} className="text-[#a1887f] dark:text-white/40 shrink-0 ml-2" /> : <span className="w-4 shrink-0"></span>}
                                            </button>
                                        );
                                    })
                                )}
                             </div>
                         </div>
                    </div>
                </div>

                {/* --- PHANTOM FLIPPING PAGE (For Animation) --- */}
                {turnState !== null && (
                    <div 
                        className="absolute inset-0 z-50 origin-left"
                        style={{
                            ...preserve3d,
                            animation: `${turnState === 'forward' ? 'turnForward' : 'turnBackward'} 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards`
                        }}
                    >
                         {/* Front Face */}
                         <div 
                             className="absolute inset-0 bg-[#f4f1ea] dark:bg-[#1a1c1a] rounded-r-xl rounded-l-md overflow-hidden shadow-md"
                             style={{ ...backfaceHidden, transform: 'rotateY(0deg)' }}
                         >
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_0)] [background-size:16px_16px]"></div>
                            <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/5"></div>
                         </div>

                         {/* Back Face */}
                         <div 
                             className="absolute inset-0 bg-[#f4f1ea] dark:bg-[#1a1c1a] rounded-l-xl rounded-r-md overflow-hidden shadow-md"
                             style={{ ...backfaceHidden, transform: 'rotateY(180deg)' }}
                         >
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_0)] [background-size:16px_16px]"></div>
                            <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent"></div>
                         </div>
                    </div>
                )}

                {/* --- STATIC PART: RIGHT PAGE (Editor) --- */}
                <div 
                    className="absolute inset-0 bg-[#f4f1ea] dark:bg-[#1a1c1a] rounded-r-xl rounded-l-md z-10 flex shadow-xl overflow-hidden transition-colors duration-500"
                    onClick={(e) => e.stopPropagation()}
                >
                     {/* Paper Texture */}
                     <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_0)] [background-size:16px_16px] pointer-events-none"></div>
                     <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none z-20 mix-blend-multiply"></div>

                     {/* Ribbon */}
                     <div className="absolute top-0 right-6 md:right-8 w-8 h-32 bg-red-700 shadow-md z-30 transition-transform duration-500 hover:translate-y-2 cursor-grab group">
                         <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-30"></div>
                        <div className="absolute bottom-0 left-0 border-l-[16px] border-r-[16px] border-b-[12px] border-l-red-700 border-r-red-700 border-b-transparent transform translate-y-full"></div>
                     </div>

                     <div className="flex-1 p-6 md:p-10 md:pl-16 flex flex-col relative z-10 h-full">
                         {/* Header */}
                         <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-4 border-b-2 border-double border-[#d7ccc8] dark:border-white/10 pb-3 md:pr-24">
                             <div className="flex items-center gap-3">
                                 <button onClick={() => changeDate(-1)} className="p-1 text-[#a1887f] dark:text-white/40 hover:text-[#5d4037] dark:hover:text-white transition-colors"><ChevronLeft size={20} /></button>
                                 <div className="text-center">
                                     <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#3e2723] dark:text-[#e0e0e0] leading-none min-w-[140px]">{formatDate(selectedDate)}</h2>
                                     <p className="text-[10px] text-[#a1887f] dark:text-white/40 uppercase tracking-[0.2em] mt-1">{selectedDate === getTodayISO() ? 'Today' : 'Past Entry'}</p>
                                 </div>
                                 <button onClick={() => changeDate(1)} disabled={selectedDate >= getTodayISO()} className="p-1 text-[#a1887f] dark:text-white/40 hover:text-[#5d4037] dark:hover:text-white disabled:opacity-20 transition-colors"><ChevronRight size={20} /></button>
                             </div>
                             
                             <div className="flex items-center gap-1 bg-[#ebe7df] dark:bg-white/5 p-1 rounded-full border border-[#d7ccc8] dark:border-white/5">
                                 {MOODS.map(m => (
                                     <button
                                         key={m.id}
                                         onClick={() => setCurrentMood(m.id as any)}
                                         className={clsx(
                                             "p-1.5 rounded-full transition-all duration-300",
                                             currentMood === m.id ? "bg-white dark:bg-white/20 shadow-sm scale-110" : "opacity-40 hover:opacity-100 hover:scale-105"
                                         )}
                                         title={m.label}
                                     >
                                         <m.icon className={clsx("w-5 h-5", m.color)} strokeWidth={2.5} />
                                     </button>
                                 ))}
                             </div>
                         </div>

                         <div className="flex justify-end gap-2 mb-2">
                            <button 
                                onClick={insertPrompt}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#8d6e63] dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-sm"
                            >
                                <Sparkles size={12} className="text-amber-500" />
                                <span>Spark Idea</span>
                            </button>
                         </div>

                         <div className="flex-1 relative w-full overflow-hidden group flex flex-col">
                             {/* Lined Paper Effect */}
                             <div 
                                className="absolute inset-0 pointer-events-none w-full h-full opacity-50 dark:opacity-10"
                                style={{
                                    backgroundImage: 'linear-gradient(transparent 31px, currentColor 31px)',
                                    backgroundSize: '100% 32px',
                                    marginTop: '8px',
                                    color: '#cfd8dc'
                                }}
                             ></div>
                             
                             <div className="absolute top-0 bottom-0 left-6 w-px bg-red-300 dark:bg-red-900/50 pointer-events-none opacity-50"></div>

                             <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#d7ccc8] dark:scrollbar-thumb-white/10 pr-2">
                                 <textarea
                                     ref={textareaRef}
                                     value={currentContent}
                                     onChange={(e) => setCurrentContent(e.target.value)}
                                     placeholder="Start writing..."
                                     className="w-full h-full bg-transparent resize-none focus:outline-none font-hand text-2xl text-[#4e342e] dark:text-[#d7ccc8] leading-[32px] pl-10 pt-[8px] placeholder:text-black/20 dark:placeholder:text-white/10"
                                     spellCheck={false}
                                 />

                                 {/* --- SYNCED HABIT NOTES SECTION --- */}
                                 {habitNotes.length > 0 && (
                                     <div className="mt-8 pt-4 border-t-2 border-dashed border-[#d7ccc8] dark:border-white/10 relative">
                                        <div className="absolute -top-3 left-10 bg-[#f4f1ea] dark:bg-[#1a1c1a] px-2 text-xs font-bold text-[#8d6e63] dark:text-forest-dark-muted uppercase tracking-wider flex items-center gap-1">
                                            <StickyNote size={12} /> Habit Logs
                                        </div>
                                        <div className="space-y-4 pl-8">
                                            {habitNotes.map(note => {
                                                const Icon = ICONS[note.icon] || CheckSquare;
                                                const textColor = THEME_TEXT[note.color] || 'text-[#4e342e]';
                                                const bgLight = THEME_BG_LIGHT[note.color] || 'bg-slate-100';
                                                
                                                return (
                                                    <div key={note.id} className="relative group/note">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={clsx("p-1 rounded-md", bgLight, "dark:bg-white/5")}>
                                                                <Icon size={14} className={textColor} />
                                                            </div>
                                                            <span className={clsx("font-serif font-bold text-sm", textColor, "dark:text-white")}>{note.title}</span>
                                                        </div>
                                                        <div className="font-hand text-xl text-[#5d4037] dark:text-[#bcaaa4] leading-relaxed relative pl-2 border-l-2 border-[#d7ccc8] dark:border-white/10">
                                                            {note.content}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                     </div>
                                 )}
                             </div>
                         </div>

                         <div className="mt-2 flex justify-between items-center text-[#a1887f] dark:text-white/30 text-xs font-sans h-8 border-t border-[#d7ccc8] dark:border-white/10 pt-2 shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="hidden md:inline">{currentContent.length} chars</span>
                                <span>{currentContent.split(/\s+/).filter(w => w.length > 0).length} words</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {isSaving ? (
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold animate-pulse"><Save size={12} /> Saving...</span>
                                    ) : (
                                        <span className="flex items-center gap-1 opacity-50"><Save size={12} /> Saved</span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#e6e0d4] dark:bg-white/10 text-[#5d4037] dark:text-white hover:bg-[#d7ccc8] dark:hover:bg-white/20 transition-colors font-bold shadow-sm"
                                >
                                    <span>Close</span>
                                    <X size={12} />
                                </button>
                            </div>
                         </div>

                     </div>
                </div>

                {/* 3D Page Thickness Effect */}
                <div className="absolute top-1 right-1 bottom-1 w-4 bg-[#e6e2d8] dark:bg-[#2a2a2a] rounded-r-md -z-10 shadow border-r border-[#d4cfc5] dark:border-black" style={{ transform: 'translateX(4px) translateZ(-2px)' }}></div>
                <div className="absolute top-2 right-2 bottom-2 w-4 bg-[#e6e2d8] dark:bg-[#2a2a2a] rounded-r-md -z-20 shadow border-r border-[#d4cfc5] dark:border-black" style={{ transform: 'translateX(8px) translateZ(-4px)' }}></div>
                <div className="absolute top-3 right-3 bottom-3 w-4 bg-forest-900 dark:bg-[#050a05] rounded-r-md -z-30 shadow-2xl" style={{ transform: 'translateX(12px) translateZ(-6px)' }}></div>

            </div>

            {/* Mobile Close Button Overlay */}
            {isOpen && (
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden fixed top-20 right-4 z-50 bg-black/60 backdrop-blur text-white p-3 rounded-full shadow-lg border border-white/20 animate-fade-in"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
};

export default Journal;
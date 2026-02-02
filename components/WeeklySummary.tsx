
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Habit } from '../types';
import { ChevronLeft, ChevronRight, Trophy, Calendar, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface WeeklySummaryProps {
  habits: Habit[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const THEME_BG: Record<string, string> = {
  pink: 'bg-pink-50',
  purple: 'bg-purple-50',
  blue: 'bg-blue-50',
  green: 'bg-emerald-50',
  orange: 'bg-orange-50',
};

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ habits }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Generate last 7 days data using useMemo for performance
  const days = useMemo(() => {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i)); // Chronological: 6 days ago -> Today
        
        // Note: We use the raw date object to generate the ISO string to match 
        // the app's global getTodayISO() behavior (which is UTC-based).
        const iso = d.toISOString().split('T')[0];
        
        // Display logic must match the ISO key (UTC) to avoid date mismatch
        // e.g. If it's 8PM EST (Monday), UTC is 1AM (Tuesday). 
        // iso will be Tuesday. getDay() would be Monday (Mismatch). 
        // getUTCDay() is Tuesday (Match).
        const dayName = DAYS[d.getUTCDay()];
        const monthName = MONTHS[d.getUTCMonth()];
        const dayNum = d.getUTCDate();
        
        // Filter active habits: Created on/before this UTC date OR has completion on this date
        const activeHabits = habits.filter(h => {
            const createdIso = h.createdAt.split('T')[0];
            return createdIso <= iso || h.completions.includes(iso);
        });
        
        const completedHabits = activeHabits.filter(h => h.completions.includes(iso));
        
        const completedCount = completedHabits.length;
        const totalCount = activeHabits.length;
        const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        return {
          iso,
          dayName,
          monthName,
          dayNum,
          completedHabits,
          totalCount,
          rate,
          isToday: i === 6
        };
      });
  }, [habits]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
      // Auto scroll to end (today) on mount/update if habits change length significantly (init)
      // We use a timeout to ensure DOM is ready
      const timer = setTimeout(() => {
          if (scrollRef.current) {
              scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
              checkScroll();
          }
      }, 100);
      
      window.addEventListener('resize', checkScroll);
      return () => {
          window.removeEventListener('resize', checkScroll);
          clearTimeout(timer);
      };
  }, [habits.length]); 

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280; 
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount 
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (habits.length === 0) return null;

  return (
    <div className="w-full animate-slide-up delay-400 opacity-0 fill-mode-forwards">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-forest-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-forest-500" /> Weekly Recap
        </h3>
        <div className="flex gap-2">
            <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 text-slate-600 dark:text-white shadow-sm"
            >
                <ChevronLeft size={18} />
            </button>
            <button 
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 text-slate-600 dark:text-white shadow-sm"
            >
                <ChevronRight size={18} />
            </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-8 pt-2 px-1 scrollbar-hide snap-x snap-mandatory scroll-smooth"
      >
        {days.map((day) => (
            <div 
                key={day.iso}
                className={clsx(
                    "min-w-[240px] md:min-w-[260px] h-[180px] p-5 rounded-2xl border snap-center transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl",
                    day.isToday 
                        ? "bg-gradient-to-br from-forest-800 to-forest-900 text-white border-forest-700 ring-1 ring-forest-500/30" 
                        : "bg-white dark:bg-forest-dark-surface border-slate-200 dark:border-white/5"
                )}
            >
                {/* Background Decoration */}
                {day.rate === 100 && day.totalCount > 0 && (
                     <div className="absolute -top-4 -right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12">
                         <Trophy size={100} />
                     </div>
                )}
                
                {/* Header: Date and Progress */}
                <div className="flex justify-between items-start mb-3 relative z-10">
                    <div>
                        <p className={clsx(
                            "text-[10px] font-bold uppercase tracking-wider mb-0.5",
                            day.isToday ? "text-forest-300" : "text-slate-400 dark:text-forest-dark-muted"
                        )}>
                            {day.dayName}
                        </p>
                        <h4 className={clsx(
                            "text-xl font-black",
                            day.isToday ? "text-white" : "text-slate-800 dark:text-white"
                        )}>
                            {day.monthName} {day.dayNum}
                        </h4>
                    </div>
                    
                    {/* Progress Circle */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path 
                                className={day.isToday ? "text-forest-700" : "text-slate-100 dark:text-white/10"}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path 
                                className={day.isToday ? "text-forest-400" : "text-forest-500"}
                                strokeDasharray={`${day.rate}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className={clsx("absolute text-[10px] font-bold", day.isToday ? "text-white" : "text-slate-700 dark:text-white")}>
                            {day.rate}%
                        </span>
                    </div>
                </div>

                {/* Swappable Content Area */}
                <div className="relative z-10 h-[84px]">
                    
                    {/* State 1: Default Summary View (Visible by default, hidden on hover) */}
                    <div className="absolute inset-0 flex flex-col justify-end transition-all duration-300 ease-out opacity-100 translate-y-0 group-hover:opacity-0 group-hover:translate-y-2 pointer-events-none">
                        <p className={clsx("text-xs font-medium mb-2", day.isToday ? "text-forest-200" : "text-slate-500 dark:text-forest-dark-muted")}>
                            {day.completedHabits.length} / {day.totalCount} Completed
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 content-start overflow-hidden max-h-10">
                            {day.completedHabits.length > 0 ? (
                                day.completedHabits.slice(0, 12).map(h => (
                                    <div 
                                        key={h.id} 
                                        className={clsx(
                                            "w-2 h-2 rounded-full shadow-sm",
                                            THEME_BG[h.colorTheme] || 'bg-slate-400'
                                        )}
                                    />
                                ))
                            ) : (
                                <span className={clsx("text-[10px] italic", day.isToday ? "text-white/40" : "text-slate-300 dark:text-white/20")}>
                                    No activity
                                </span>
                            )}
                            {day.completedHabits.length > 12 && (
                                <span className="text-[8px] opacity-50 self-center">+</span>
                            )}
                        </div>
                    </div>

                    {/* State 2: Detailed List View (Hidden by default, visible on hover) */}
                    <div className="absolute inset-0 flex flex-col transition-all duration-300 ease-out opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                         <p className={clsx("text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1", day.isToday ? "text-forest-300" : "text-slate-400")}>
                            <CheckCircle2 size={10} /> Completed
                         </p>
                         <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-current/20 pr-1 -mr-1 pb-1 flex-1">
                            {day.completedHabits.length > 0 ? (
                                <div className="space-y-1.5">
                                    {day.completedHabits.map(h => (
                                        <div key={h.id} className="flex items-center gap-2 text-xs">
                                            <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", THEME_BG[h.colorTheme])}></div>
                                            <span className={clsx("truncate font-medium", day.isToday ? "text-white" : "text-slate-700 dark:text-slate-200")}>{h.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className={clsx("text-xs italic text-center", day.isToday ? "text-white/40" : "text-slate-400/60")}>No habits completed</p>
                                </div>
                            )}
                         </div>
                    </div>

                </div>
            </div>
        ))}
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { calculateStreak, getTodayISO, isHabitDue } from '../utils/dateUtils';
import { Trophy, CheckCircle, Activity, TrendingUp } from 'lucide-react';
import { WeeklySummary } from './WeeklySummary';
import clsx from 'clsx';

interface DashboardProps {
  habits: Habit[];
  onNavigate: (path: string) => void;
}

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ children, className, delay, onClick }) => {
  return (
    <div 
      className={clsx(
          "group perspective-1000 h-full animate-slide-up opacity-0", 
          delay,
          onClick && "cursor-pointer touch-manipulation select-none"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      <div className={clsx(
        "relative h-full p-5 md:p-6 rounded-2xl transition-all duration-500 ease-out transform-style-3d shadow-xl border-b-4", 
        "md:group-hover:rotate-x-6 md:group-hover:rotate-y-2 md:group-hover:scale-[1.02]",
        "active:scale-95 transition-transform",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl pointer-events-none" />
        {children}
      </div>
    </div>
  );
};

const Counter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
      let start = 0;
      const duration = 1500;
      const increment = Math.max(1, Math.ceil(value / (duration / 16)));
      const timer = setInterval(() => {
          start += increment;
          if (start >= value) {
              setCount(value);
              clearInterval(timer);
          } else {
              setCount(start);
          }
      }, 16);
      return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
};

const Dashboard: React.FC<DashboardProps> = ({ habits, onNavigate }) => {
  const today = getTodayISO();
  
  const dueHabits = habits.filter(h => isHabitDue(h, today));
  const totalDue = dueHabits.length;
  
  const completedToday = dueHabits.filter(h => {
      const count = h.completions.filter(c => c === today).length;
      return count >= h.target;
  }).length;
  
  const completionRate = totalDue > 0 ? Math.round((completedToday / totalDue) * 100) : 0;

  const bestStreakData = habits.reduce((acc, h) => {
      const s = calculateStreak(h);
      if (s.longest > acc.longest) {
          return { longest: s.longest, unit: 'days' };
      }
      return acc;
  }, { longest: 0, unit: 'days' });

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <DashboardCard 
          className="bg-white/80 dark:bg-forest-dark-surface border-forest-200 dark:border-forest-800 border-b-forest-500 dark:border-b-forest-600" 
          delay="delay-100"
          onClick={() => onNavigate('/habits')}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-forest-light-muted dark:text-forest-dark-muted text-xs md:text-sm font-bold tracking-wide uppercase">Daily Progress</p>
                <h3 className="text-3xl md:text-4xl font-black text-forest-800 dark:text-white mt-1 drop-shadow-sm">
                    <Counter value={completionRate} />%
                </h3>
              </div>
              <div className="p-2 md:p-3 bg-forest-100 dark:bg-forest-500/20 rounded-xl text-forest-600 dark:text-forest-300 shadow-inner animate-pulse-slow"><CheckCircle className="w-5 h-5 md:w-7 md:h-7" /></div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-black h-2.5 md:h-3 rounded-full mt-2 md:mt-4 overflow-hidden border border-slate-100 dark:border-white/10 relative z-10">
              <div className="h-full bg-gradient-to-r from-forest-500 to-forest-300 shadow-[0_0_15px_rgba(76,175,80,0.5)] rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
            </div>
            <p className="text-xs md:text-sm text-forest-light-muted dark:text-forest-dark-muted mt-3 font-medium relative z-10">{completedToday} / {totalDue} due today</p>
        </DashboardCard>

        <DashboardCard 
          className="bg-white/80 dark:bg-forest-dark-surface border-orange-200 dark:border-orange-900/50 border-b-orange-500 dark:border-b-orange-600" 
          delay="delay-200"
          onClick={() => onNavigate('/analytics')}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-forest-light-muted dark:text-forest-dark-muted text-xs md:text-sm font-bold tracking-wide uppercase">Best Streak</p>
                <h3 className="text-3xl md:text-4xl font-black text-forest-800 dark:text-white mt-1 drop-shadow-sm">
                    <Counter value={bestStreakData.longest} /> <span className="text-lg md:text-xl font-medium text-forest-light-muted dark:text-forest-dark-muted">{bestStreakData.unit}</span>
                </h3>
              </div>
              <div className="p-2 md:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-300 shadow-inner animate-float"><Activity className="w-5 h-5 md:w-7 md:h-7" /></div>
            </div>
            <div className="mt-2 md:mt-4 text-xs md:text-sm text-forest-light-muted dark:text-forest-dark-muted font-medium flex items-center gap-2 relative z-10"><TrendingUp size={16} /> Keep growing!</div>
        </DashboardCard>

        <DashboardCard 
          className="bg-white/80 dark:bg-forest-dark-surface border-blue-200 dark:border-blue-900/50 border-b-blue-500 dark:border-b-blue-600" 
          delay="delay-300"
          onClick={() => onNavigate('/habits')}
        >
             <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                 <p className="text-forest-light-muted dark:text-forest-dark-muted text-xs md:text-sm font-bold tracking-wide uppercase">Active Habits</p>
                 <h3 className="text-3xl md:text-4xl font-black text-forest-800 dark:text-white mt-1 drop-shadow-sm"><Counter value={habits.length} /></h3>
               </div>
               <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-300 shadow-inner"><Trophy className="w-5 h-5 md:w-7 md:h-7" /></div>
             </div>
             <div className="mt-2 md:mt-4 text-xs md:text-sm text-forest-light-muted dark:text-forest-dark-muted font-medium relative z-10">Focus on quality over quantity.</div>
        </DashboardCard>
      </div>

      <WeeklySummary habits={habits} />
    </div>
  );
};

export default Dashboard;


import React from 'react';
import { Habit } from '../types';
import { calculateStreak } from '../utils/dateUtils';
import { Medal, Star, Zap, Shield, Crown, Lock } from 'lucide-react';
import clsx from 'clsx';

interface GamificationProps {
  habits: Habit[];
}

const Gamification: React.FC<GamificationProps> = ({ habits }) => {
  // Define badges logic dynamically
  const badges = [
    {
      id: 'first-step',
      name: 'First Step',
      desc: 'Complete your first habit.',
      icon: Star,
      color: 'text-yellow-500',
      glow: 'shadow-yellow-500/50',
      achieved: habits.some(h => h.completions.length > 0)
    },
    {
      id: 'streak-3',
      name: 'Sprout',
      desc: 'Reach a 3-day streak.',
      icon: Zap,
      color: 'text-teal-500',
      glow: 'shadow-teal-500/50',
      achieved: habits.some(h => calculateStreak(h).current >= 3)
    },
    {
      id: 'streak-7',
      name: 'Sapling',
      desc: 'Reach a 7-day streak.',
      icon: Shield,
      color: 'text-blue-500',
      glow: 'shadow-blue-500/50',
      achieved: habits.some(h => calculateStreak(h).current >= 7)
    },
    {
      id: 'streak-30',
      name: 'Mighty Oak',
      desc: 'Reach a 30-day streak.',
      icon: Crown,
      color: 'text-brand-600',
      glow: 'shadow-brand-600/50',
      achieved: habits.some(h => calculateStreak(h).current >= 30)
    },
    {
      id: 'master',
      name: 'Guardian',
      desc: '3 habits with 7+ day streaks.',
      icon: Medal,
      color: 'text-rose-600',
      glow: 'shadow-rose-600/50',
      achieved: habits.filter(h => calculateStreak(h).current >= 7).length >= 3
    }
  ];

  const achievedCount = badges.filter(b => b.achieved).length;
  const progress = (achievedCount / badges.length) * 100;

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center mb-8 animate-slide-up">
        <h2 className="text-3xl font-bold text-brand-900 dark:text-white mb-2 tracking-tight">Achievements</h2>
        <p className="text-brand-light-muted dark:text-brand-dark-muted">Unlock badges by growing your habits.</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/80 dark:bg-brand-dark-surface backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 mb-8 animate-slide-up delay-100 opacity-0 fill-mode-forwards">
        <div className="flex justify-between mb-4 items-end">
            <span className="font-bold text-brand-900 dark:text-white text-base md:text-lg">Level Progress</span>
            <span className="text-brand-600 dark:text-brand-300 font-bold font-mono text-sm md:text-base">{achievedCount} / {badges.length}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-black/40 h-4 md:h-6 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 p-1">
            <div 
                className="bg-brand-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                style={{ width: `${progress}%` }}
            />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div 
              key={badge.id} 
              className={clsx(
                "relative rounded-2xl border transition-all duration-500 group overflow-hidden perspective-1000",
                "p-4 md:p-6",
                "flex flex-row md:flex-col items-center gap-4 md:gap-4",
                "text-left md:text-center animate-scale-in opacity-0 fill-mode-forwards hover:scale-105 hover:shadow-xl",
                badge.achieved 
                  ? "bg-white/90 dark:bg-brand-dark-surface border-brand-200 dark:border-white/20" 
                  : "bg-slate-100 dark:bg-brand-dark-surface/50 border-slate-100 dark:border-white/5 opacity-60 grayscale-[0.5]"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Shiny reflection for achieved badges */}
              {badge.achieved && (
                   <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-white/20 opacity-20 group-hover:animate-shimmer" />
              )}

              {/* Glow effect for achieved */}
              {badge.achieved && (
                  <div className={clsx("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-500", badge.color.replace('text-', 'bg-'))}></div>
              )}

              <div className={clsx(
                  "rounded-full relative z-10 transition-transform duration-500 group-hover:rotate-6 shrink-0",
                  "p-3 md:p-5",
                  badge.achieved ? "bg-white shadow-sm dark:bg-black/40 border border-slate-100 dark:border-white/10" : "bg-slate-200 dark:bg-black/20"
              )}>
                {badge.achieved ? (
                     <Icon className={clsx(badge.color, "drop-shadow-sm w-6 h-6 md:w-12 md:h-12 animate-float")} />
                ) : (
                    <Lock className="text-slate-400 dark:text-brand-dark-muted w-6 h-6 md:w-12 md:h-12" />
                )}
              </div>
              
              <div className="relative z-10 flex-1">
                <h3 className={clsx("font-bold mb-1", "text-base md:text-xl", badge.achieved ? "text-brand-900 dark:text-white" : "text-slate-400 dark:text-brand-dark-muted")}>{badge.name}</h3>
                <p className="text-xs md:text-sm text-brand-light-muted dark:text-brand-dark-muted">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Gamification;

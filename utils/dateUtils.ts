
import { Habit, StreakInfo, HabitFrequency } from '../types';

export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export const isHabitDue = (habit: Habit, dateStr: string): boolean => {
  const date = new Date(dateStr);
  const day = date.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  switch (habit.frequency) {
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'weekends':
      return day === 0 || day === 6;
    case 'every-other-day':
      const start = new Date(habit.createdAt.split('T')[0]);
      const current = new Date(dateStr);
      const diffTime = Math.abs(current.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % 2 === 0;
    case 'daily':
    default:
      return true;
  }
};

export const getYearDateRange = (): { iso: string, dateObj: Date }[] => {
  const dates = [];
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 330); // ~11 months back
  
  const end = new Date();
  end.setDate(today.getDate() + 30); // ~1 month forward

  const current = new Date(start);
  while (current <= end) {
    dates.push({
      iso: current.toISOString().split('T')[0],
      dateObj: new Date(current)
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// Lighter date range for performance optimization (last 60 days + next 7 days)
export const getTimelineDateRange = (): { iso: string, dateObj: Date }[] => {
  const dates = [];
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 60); 

  const end = new Date();
  end.setDate(today.getDate() + 7);

  const current = new Date(start);
  while (current <= end) {
    dates.push({
      iso: current.toISOString().split('T')[0],
      dateObj: new Date(current)
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const getLast7Days = (): string[] => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  return { days, firstDay };
};

export const getCompletionCount = (habit: Habit, dateStr: string): number => {
    return habit.completions.filter(c => c === dateStr).length;
};

export const calculateStreak = (habit: Habit): StreakInfo => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = habit.target || 1;

  const counts = new Map<string, number>();
  habit.completions.forEach(d => {
      counts.set(d, (counts.get(d) || 0) + 1);
  });

  let current = 0;
  let checkDate = new Date(today);
  
  // Backwards calculation
  while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const createdAtStr = habit.createdAt.split('T')[0];
      if (dateStr < createdAtStr) break;

      const due = isHabitDue(habit, dateStr);
      if (due) {
          if ((counts.get(dateStr) || 0) >= target) {
              current++;
          } else {
              // If it's today and not yet met, don't break yet, check yesterday
              if (dateStr !== today.toISOString().split('T')[0]) {
                  break;
              }
          }
      }
      checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // Longest Streak
  const metDates = Array.from(counts.entries())
    .filter(([date, count]) => count >= target && isHabitDue(habit, date))
    .map(([date]) => date)
    .sort();

  let longest = 0;
  if (metDates.length > 0) {
     let temp = 0;
     let runningLongest = 0;
     
     const startDate = new Date(habit.createdAt.split('T')[0]);
     const endDate = new Date(today);
     const currentIter = new Date(startDate);

     while (currentIter <= endDate) {
         const iso = currentIter.toISOString().split('T')[0];
         if (isHabitDue(habit, iso)) {
             if ((counts.get(iso) || 0) >= target) {
                 temp++;
             } else {
                 if (iso !== today.toISOString().split('T')[0]) {
                    temp = 0;
                 }
             }
         }
         runningLongest = Math.max(runningLongest, temp);
         currentIter.setDate(currentIter.getDate() + 1);
     }
     longest = runningLongest;
  }
  longest = Math.max(longest, current);

  // Completion Rate (Only counting days where habit was due)
  const created = new Date(habit.createdAt.split('T')[0]);
  let totalDueDays = 0;
  let metDueDays = 0;
  
  const rateIter = new Date(created);
  const rateEnd = new Date(today);
  while (rateIter <= rateEnd) {
      const iso = rateIter.toISOString().split('T')[0];
      if (isHabitDue(habit, iso)) {
          totalDueDays++;
          if ((counts.get(iso) || 0) >= target) metDueDays++;
      }
      rateIter.setDate(rateIter.getDate() + 1);
  }

  const completionRate = totalDueDays > 0 ? Math.min(100, Math.round((metDueDays / totalDueDays) * 100)) : 0;

  return { current, longest, completionRate };
};

export const getLastCompletedText = (habit: Habit): string => {
  if (!habit.completions || habit.completions.length === 0) return 'Never';
  
  const sorted = [...habit.completions].sort();
  const last = sorted[sorted.length - 1];
  const date = new Date(last);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const dateObj = new Date(last);
  dateObj.setHours(0,0,0,0);

  const diffTime = today.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

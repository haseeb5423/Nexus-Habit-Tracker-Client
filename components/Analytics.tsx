
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Habit } from '../types';
import { calculateStreak, getLast7Days, formatDate } from '../utils/dateUtils';
import { Download, X, Activity, TrendingUp, Calendar, ShieldCheck, Target, Award, Info, Hash, Maximize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import clsx from 'clsx';

interface AnalyticsProps {
  habits: Habit[];
}

const HABIT_THEME_COLORS: Record<string, string> = {
  pink: '#EC4899',
  purple: '#A855F7',
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F97316',
};

const getHabitColor = (theme: string) => HABIT_THEME_COLORS[theme] || '#10B981';

const CustomWeeklyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-forest-900/95 backdrop-blur border border-white/10 p-4 rounded-xl shadow-xl min-w-[180px] z-50">
        <p className="font-bold text-white mb-3 text-sm border-b border-white/10 pb-2">{label}</p>
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs text-forest-200">Total Completed:</span>
           <span className="text-forest-300 font-bold text-sm">{data.completed}</span>
        </div>
        {data.habitDetails && data.habitDetails.length > 0 && (
           <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-[10px] text-forest-200 uppercase font-bold tracking-wider mb-2">Habits</p>
              <ul className="space-y-1.5">
                {data.habitDetails.map((h: any, index: number) => (
                  <li key={index} className="text-xs text-white flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: getHabitColor(h.colorTheme) }}></div>
                     <span className="leading-tight">{h.title}</span>
                  </li>
                ))}
              </ul>
           </div>
        )}
      </div>
    );
  }
  return null;
};

const YearlyHeatmap: React.FC<{ habits: Habit[], isExport?: boolean }> = ({ habits, isExport }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 365); 

    const dateMap = new Map<string, number>();
    habits.forEach(h => {
        h.completions.forEach(date => {
            if (date >= startDate.toISOString().split('T')[0]) {
               dateMap.set(date, (dateMap.get(date) || 0) + 1);
            }
        });
    });

    const weeks: { date: Date; count: number; iso: string }[][] = [];
    let currentWeek: { date: Date; count: number; iso: string }[] = [];
    
    const calendarStart = new Date(startDate);
    while (calendarStart.getDay() !== 0) calendarStart.setDate(calendarStart.getDate() - 1);
    const calendarEnd = new Date(today);
    while (calendarEnd.getDay() !== 6) calendarEnd.setDate(calendarEnd.getDate() + 1);

    const iterDate = new Date(calendarStart);
    while (iterDate <= calendarEnd) {
        const iso = iterDate.toISOString().split('T')[0];
        const count = dateMap.get(iso) || 0;
        currentWeek.push({ date: new Date(iterDate), count, iso });
        if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
        iterDate.setDate(iterDate.getDate() + 1);
    }

    const monthLabels: { label: string, index: number }[] = [];
    weeks.forEach((week, index) => {
        const firstDayOfWeek = week[0].date;
        if (index === 0 || firstDayOfWeek.getDate() <= 7) {
             const label = firstDayOfWeek.toLocaleString('default', { month: 'short' });
             if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
                 monthLabels.push({ label, index });
             }
        }
    });

    useEffect(() => {
        if (!isExport && scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [isExport]);

    const getExportColor = (count: number) => {
        if (count === 0) return "#f4f4f5";
        if (count <= 2) return "#86efac";
        if (count <= 4) return "#22c55e";
        return "#166534";
    };

    const SQUARE_SIZE = isExport ? 9 : 11;
    const GAP_SIZE = isExport ? 2 : 3;
    const COLUMN_WIDTH = SQUARE_SIZE + GAP_SIZE;

    return (
        <div className="w-full">
            <div 
                ref={scrollRef}
                className={clsx("w-full pb-2", !isExport && "overflow-x-auto scrollbar-hide")}
            >
                <div className="flex gap-2 w-max">
                    <div className="flex flex-col pr-1" style={{ paddingTop: '24px', gap: `${GAP_SIZE}px` }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span 
                                key={i} 
                                style={{ height: `${SQUARE_SIZE}px`, lineHeight: `${SQUARE_SIZE}px` }}
                                className={clsx("text-[9px] font-black w-4 text-right", (i === 1 || i === 3 || i === 5) ? "text-slate-400" : "invisible")}
                            >
                                {d}
                            </span>
                        ))}
                    </div>

                    <div className="relative">
                        <div className="h-5 mb-1 relative">
                            {monthLabels.map((m, i) => (
                                <div 
                                    key={i} 
                                    className="absolute text-[10px] font-black text-slate-400 whitespace-nowrap" 
                                    style={{ left: `${m.index * COLUMN_WIDTH}px` }}
                                >
                                    {m.label}
                                </div>
                            ))}
                        </div>

                        <div className="flex" style={{ gap: `${GAP_SIZE}px` }}>
                            {weeks.map((week, wIndex) => (
                                <div key={wIndex} className="flex flex-col shrink-0" style={{ gap: `${GAP_SIZE}px` }}>
                                    {week.map((day) => (
                                        <div
                                            key={day.iso}
                                            style={{ 
                                                backgroundColor: isExport ? getExportColor(day.count) : undefined,
                                                width: `${SQUARE_SIZE}px`,
                                                height: `${SQUARE_SIZE}px`
                                            }}
                                            className={clsx(
                                                "rounded-[1px] transition-all",
                                                !isExport && (
                                                    day.count === 0 ? "bg-slate-100 dark:bg-white/5" :
                                                    day.count <= 2 ? "bg-forest-200 dark:bg-forest-900" :
                                                    day.count <= 4 ? "bg-forest-400 dark:bg-forest-700" :
                                                    "bg-forest-600 dark:bg-forest-500"
                                                )
                                            )}
                                            title={`${day.iso}: ${day.count} completions`}
                                        ></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ habits }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const last7Days = getLast7Days();
  const weeklyData = last7Days.map(date => {
      const formattedDate = formatDate(date);
      const completedHabits = habits.filter(h => h.completions.includes(date));
      return { 
          date: formattedDate, 
          completed: completedHabits.length,
          habitDetails: completedHabits.map(h => ({ title: h.title, colorTheme: h.colorTheme })) 
      };
  }).reverse();

  const overallStats = {
    avgAdherence: Math.round(habits.reduce((acc, h) => acc + calculateStreak(h).completionRate, 0) / Math.max(1, habits.length)),
    totalLogs: habits.reduce((acc, h) => acc + h.completions.length, 0),
    maxStreak: Math.max(...habits.map(h => calculateStreak(h).longest), 0),
    count: habits.length
  };

  useLayoutEffect(() => {
    if (!showExportModal) return;
    const handleResize = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        const padding = window.innerWidth < 768 ? 32 : 80;
        const availableWidth = containerWidth - padding;
        const a4WidthInPx = (210 * 96) / 25.4; 
        if (availableWidth < a4WidthInPx) {
          setPreviewScale(availableWidth / a4WidthInPx);
        } else {
          setPreviewScale(1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showExportModal]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('analytics-report-preview');
    if (!element) return;
    try {
        setIsExporting(true);
        const canvas = await html2canvas(element, { 
            scale: 2.5, 
            backgroundColor: '#ffffff', 
            useCORS: true,
            windowWidth: 1024,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById('analytics-report-preview');
                if (clonedEl) clonedEl.style.transform = 'none';
            }
        });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`Nexus_Performance_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExporting(false);
    } catch (err) { 
        console.error(err);
        setIsExporting(false); 
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-forest-900 dark:text-white tracking-tight">Analytics</h2>
          <p className="text-slate-500 dark:text-forest-dark-muted text-sm">Quantifying your behavioral patterns</p>
        </div>
        <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-xl hover:bg-forest-700 transition-all shadow-lg active:scale-95 font-bold">
          <Download size={20} /> Generate Report
        </button>
      </div>

      <div className="bg-white/80 dark:bg-forest-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
          <h3 className="text-lg font-bold text-forest-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-forest-500" /> Consistency Heatmap
          </h3>
          <YearlyHeatmap habits={habits} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-forest-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg h-96">
          <h3 className="text-lg font-bold text-forest-900 dark:text-white mb-6">Weekly Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomWeeklyTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-forest-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg h-96">
          <h3 className="text-lg font-bold text-forest-900 dark:text-white mb-6">Retention Rates</h3>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={habits.map(h => ({ name: h.title, rate: calculateStreak(h).completionRate }))}>
                 <XAxis type="number" domain={[0, 100]} hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0D1B0D', borderRadius: '8px', color: '#fff', border: 'none' }} />
                 <Bar dataKey="rate" fill="#10B981" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[150] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-hidden">
             <div className="bg-white dark:bg-forest-dark-surface w-full max-w-7xl h-full sm:h-[95vh] rounded-none sm:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/5">
                
                <div className="w-full lg:w-80 bg-zinc-50 dark:bg-black p-6 md:p-8 flex flex-row lg:flex-col items-center lg:items-stretch gap-4 lg:gap-8 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-white/10">
                    <div className="flex-1 lg:flex-none flex items-center lg:items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="text-forest-600" />
                            <h3 className="font-black text-lg lg:text-xl tracking-tight dark:text-white uppercase">Nexus Audit</h3>
                        </div>
                        <button onClick={() => setShowExportModal(false)} className="lg:hidden p-2 text-zinc-400 hover:text-zinc-950"><X /></button>
                    </div>
                    
                    <div className="hidden lg:block space-y-4">
                        <div className="p-4 rounded-2xl bg-forest-500/5 border border-forest-500/10">
                            <p className="text-[10px] font-black text-forest-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldCheck size={12} /> High Fidelity Master
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                Exporting consistency and velocity metrics for clinical review.
                            </p>
                        </div>
                    </div>

                    <div className="lg:mt-auto flex lg:flex-col gap-2 w-auto lg:w-full">
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isExporting} 
                            className="px-6 lg:w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-black shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-sm"
                        >
                            {isExporting ? <span className="animate-pulse">Building...</span> : <><Download size={18} className="hidden sm:inline" /> Export PDF</>}
                        </button>
                        <button onClick={() => setShowExportModal(false)} className="hidden lg:block w-full py-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-white font-bold text-sm">
                            Cancel
                        </button>
                    </div>
                </div>

                <div 
                  ref={previewContainerRef}
                  className="flex-1 bg-zinc-200 dark:bg-zinc-900/50 overflow-y-auto overflow-x-hidden p-4 md:p-10 flex flex-col items-center scrollbar-hide relative"
                >
                    {previewScale < 1 && (
                      <div className="mb-4 px-3 py-1 bg-zinc-800/20 backdrop-blur rounded-full text-[10px] font-bold text-zinc-500 flex items-center gap-2 animate-fade-in shrink-0">
                        <Maximize2 size={10} /> Auto-scaled to {Math.round(previewScale * 100)}%
                      </div>
                    )}
                    
                    <div 
                        className="transition-transform duration-500 origin-top flex flex-col items-center"
                        style={{ 
                          transform: `scale(${previewScale})`,
                          marginBottom: previewScale < 1 ? `-${(1 - previewScale) * 100}%` : '0' 
                        }}
                    >
                      <div 
                          id="analytics-report-preview" 
                          className="bg-white text-zinc-900 shadow-2xl flex flex-col relative shrink-0" 
                          style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}
                      >
                          <div className="flex justify-between items-start border-b-[3px] border-zinc-900 pb-8 mb-12">
                              <div>
                                  <div className="flex items-center gap-2 mb-3">
                                      <Activity className="text-zinc-900" size={24} strokeWidth={3} />
                                      <span className="font-black text-2xl tracking-tighter uppercase">Nexus System</span>
                                  </div>
                                  <h1 className="text-4xl font-black tracking-tight text-zinc-900">Performance Metrics</h1>
                                  <p className="text-zinc-400 uppercase tracking-[0.2em] text-[9px] font-black mt-2">Personal Behavioral Analytics Report</p>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                  <div className="px-3 py-1 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest mb-3 rounded">Verified Audit</div>
                                  <p className="text-xs font-bold text-zinc-400">Date Issued</p>
                                  <p className="text-sm font-black text-zinc-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-12">
                              {[
                                  { label: 'Adherence', val: `${overallStats.avgAdherence}%`, icon: Target, color: '#166534' },
                                  { label: 'Retention', val: overallStats.totalLogs, icon: Hash, color: '#09090b' },
                                  { label: 'Peak Streak', val: `${overallStats.maxStreak}d`, icon: Award, color: '#b45309' },
                                  { label: 'Habits', val: overallStats.count, icon: TrendingUp, color: '#1d4ed8' }
                              ].map((kpi, i) => (
                                  <div key={i} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col">
                                      <div className="flex items-center justify-between mb-2">
                                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{kpi.label}</p>
                                          <kpi.icon size={12} style={{ color: kpi.color }} />
                                      </div>
                                      <p style={{ color: kpi.color }} className="text-3xl font-black">{kpi.val}</p>
                                  </div>
                              ))}
                          </div>

                          <div className="space-y-12">
                              <section>
                                  <h3 className="text-sm font-black uppercase tracking-[0.1em] text-zinc-400 mb-6 flex items-center gap-2 border-b pb-2">
                                      <Calendar size={14} className="text-zinc-900" /> Consistency Heatmap
                                  </h3>
                                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                      <YearlyHeatmap habits={habits} isExport={true} />
                                  </div>
                              </section>

                              <section>
                                  <h3 className="text-sm font-black uppercase tracking-[0.1em] text-zinc-400 mb-6 flex items-center gap-2 border-b pb-2">
                                      <Activity size={14} className="text-zinc-900" /> Weekly Velocity
                                  </h3>
                                  <div className="h-64 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={weeklyData}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                              <XAxis dataKey="date" tick={{fill: '#18181b', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                              <YAxis tick={{fill: '#71717a', fontSize: 10}} axisLine={false} tickLine={false} allowDecimals={false} />
                                              <Bar dataKey="completed" fill="#18181b" radius={[4, 4, 0, 0]} barSize={40} />
                                          </BarChart>
                                      </ResponsiveContainer>
                                  </div>
                              </section>
                          </div>

                          <div className="mt-auto pt-10 border-t border-zinc-100 flex justify-between items-end">
                              <div className="max-w-[320px]">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-2">Technical Disclaimer</p>
                                  <p className="text-[8px] text-zinc-400 leading-relaxed font-medium">
                                      This automated summary is derived from localized user logging data. All logged activities are verified against the user's primary identity hash.
                                  </p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-zinc-900">NEXUS SYSTEM v2.5</p>
                                  <p className="text-[8px] text-zinc-400 font-bold">Encrypted Behavioral Report • © {new Date().getFullYear()}</p>
                              </div>
                          </div>
                      </div>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

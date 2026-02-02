
import React, { useState, useEffect } from 'react';
import { UserSettings, Habit } from '../types';
import { saveSettings, exportData, api } from '../services/storage';
import { formatDate } from '../utils/dateUtils';
import { Moon, Sun, Download, Trash, Mail, AlertTriangle, FileText, X, Cloud, Check, RefreshCw, User, Tag, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import clsx from 'clsx';

interface SettingsProps {
    settings: UserSettings;
    habits: Habit[];
    onUpdateSettings: (s: UserSettings) => void;
    onResetData: () => void;
    onNavigate: (path: string) => void;
}

const SettingsPage: React.FC<SettingsProps> = ({ settings, habits, onUpdateSettings, onResetData, onNavigate }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Category Management State
    const [newCat, setNewCat] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportDateRange, setReportDateRange] = useState<{ start: string, end: string }>({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const user = api.getCurrentUser();
        setCurrentUser(user);
    }, []);

    const handleSyncNow = async () => {
        setSyncStatus('loading');
        const isHealthy = await api.checkHealth();
        if (isHealthy && api.isLoggedIn()) {
            const success = await api.syncData({ habits, settings });
            setSyncStatus(success ? 'success' : 'error');
        } else {
            setSyncStatus('error');
        }
        setTimeout(() => setSyncStatus('idle'), 3000);
    };

    const handleResetConfirm = () => {
        onResetData();
        setShowResetModal(false);
        onNavigate('/');
    };

    const handleAddCategory = () => {
        if (!newCat.trim()) return;
        const currentCats = settings.categories || ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social'];
        if (currentCats.includes(newCat.trim())) return;
        const updated = [...currentCats, newCat.trim()];
        onUpdateSettings({ ...settings, categories: updated });
        setNewCat('');
    };

    const handleRemoveCategory = (cat: string) => {
        const currentCats = settings.categories || ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social'];
        const updated = currentCats.filter(c => c !== cat);
        onUpdateSettings({ ...settings, categories: updated });
    };

    // --- Report Generation Logic ---
    const generateChartData = () => {
        const start = new Date(reportDateRange.start);
        const end = new Date(reportDateRange.end);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        const timelineData = [];
        for (let i = 0; i < daysDiff; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            const completedCount = habits.reduce((acc, h) => h.completions.includes(iso) ? acc + 1 : acc, 0);
            timelineData.push({ date: formatDate(iso), fullDate: iso, completed: completedCount });
        }
        const adherenceData = habits.map(h => {
            const completionsInRange = h.completions.filter(c => c >= reportDateRange.start && c <= reportDateRange.end).length;
            let ideal = daysDiff;
            const rate = Math.round((completionsInRange / Math.max(1, ideal)) * 100);
            return { name: h.title, rate: rate > 100 ? 100 : rate, count: completionsInRange, ideal: ideal };
        }).sort((a, b) => b.rate - a.rate);
        return { timelineData, adherenceData, totalDays: daysDiff };
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-preview-content');
        if (!element) return;
        try {
            setIsExporting(true);
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
            while (heightLeft > 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); heightLeft -= pdfHeight; }
            pdf.save(`nexus_report_${reportDateRange.start}_to_${reportDateRange.end}.pdf`);
            setIsExporting(false);
        } catch (e) { setIsExporting(false); }
    };

    const ReportModal = () => {
        const { timelineData, adherenceData } = generateChartData();
        return (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-start justify-center p-0 md:p-4 pt-10 md:pt-16 animate-fade-in overflow-y-auto">
                <div className="bg-slate-50 dark:bg-forest-dark-surface w-full h-full md:h-[85vh] md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-down border border-slate-200 dark:border-white/10">
                    <div className="w-full md:w-80 bg-white dark:bg-black border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                        <div className="flex justify-between items-center md:hidden"><h3 className="font-bold text-lg dark:text-white">Report Settings</h3><button onClick={() => setShowReportModal(false)}><X className="dark:text-white" /></button></div>
                        <div className="hidden md:block"><h3 className="font-bold text-xl text-forest-900 dark:text-white mb-1">Generate Report</h3><p className="text-sm text-forest-light-muted dark:text-forest-dark-muted">Customize your progress report</p></div>
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-forest-light-muted dark:text-forest-dark-muted uppercase tracking-wider">Date Range</label>
                            <div className="grid grid-cols-1 gap-3">
                                <div><span className="text-xs text-slate-400 mb-1 block">Start Date</span><input type="date" value={reportDateRange.start} onChange={(e) => setReportDateRange({ ...reportDateRange, start: e.target.value })} className="w-full p-2 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm" /></div>
                                <div><span className="text-xs text-slate-400 mb-1 block">End Date</span><input type="date" value={reportDateRange.end} onChange={(e) => setReportDateRange({ ...reportDateRange, end: e.target.value })} className="w-full p-2 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm" /></div>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                            <button onClick={handleDownloadPDF} disabled={isExporting} className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">{isExporting ? <span className="animate-pulse">Generating PDF...</span> : <><Download size={18} /> Download PDF</>}</button>
                            <button onClick={() => setShowReportModal(false)} className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-forest-600 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-white/5 font-medium">Close Preview</button>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-200 dark:bg-black/50 overflow-y-auto p-4 md:p-8 flex justify-center">
                        <div id="report-preview-content" className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] shadow-2xl p-8 md:p-12 flex flex-col" style={{ aspectRatio: '210/297' }}>
                            <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end"><div><h1 className="text-4xl font-black tracking-tight text-slate-900">Nexus Report</h1><p className="text-slate-500 mt-2 font-medium">Habit Tracking Progress & Analysis</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">Generated on</p><p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p></div></div>
                            <div className="space-y-8 mb-10">
                                <div><h3 className="text-xl font-bold text-slate-800 mb-4">Daily Activity</h3><div className="h-80 w-full border border-slate-100 rounded-lg p-2"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><BarChart data={timelineData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Bar dataKey="completed" fill="#4CAF50" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
                                <div><h3 className="text-xl font-bold text-slate-800 mb-4">Adherence Rates (%)</h3><div className="h-80 w-full border border-slate-100 rounded-lg p-2"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><BarChart layout="vertical" data={adherenceData}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} /><XAxis type="number" domain={[0, 100]} hide /><YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} /><Bar dataKey="rate" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={15} label={{ position: 'right', fill: '#64748b', fontSize: 10 }}>{adherenceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.rate >= 80 ? '#4CAF50' : entry.rate >= 50 ? '#81C784' : '#FFB74D'} />))}</Bar></BarChart></ResponsiveContainer></div></div>
                            </div>
                            <div className="mt-auto pt-8 border-t border-slate-200 text-center text-xs text-slate-400"><p>Nexus Habit Tracker • Personal Analytics Snapshot</p></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10 relative">
            <h2 className="text-3xl font-bold text-forest-900 dark:text-white tracking-tight">Settings</h2>

            <div className="bg-white/80 dark:bg-forest-dark-surface backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 space-y-8">

                {/* Appearance */}
                <div>
                    <h3 className="text-lg font-semibold text-forest-900 dark:text-white mb-4 flex items-center gap-2">
                        <Sun size={20} className="text-forest-light-muted dark:text-white/60" /> Appearance
                    </h3>
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-forest-800 dark:text-white/80">Theme Mode</span>
                        <div className="flex gap-2 bg-white dark:bg-black p-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-inner">
                            <button onClick={() => onUpdateSettings({ ...settings, theme: 'light' })} className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all", settings.theme === 'light' ? "bg-slate-200 text-black shadow-sm font-medium" : "text-slate-400 dark:text-forest-dark-muted hover:text-slate-900 dark:hover:text-white")}><Sun size={14} /> Light</button>
                            <button onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })} className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all", settings.theme === 'dark' ? "bg-forest-600 text-white shadow-md font-medium" : "text-slate-400 dark:text-forest-dark-muted hover:text-slate-900 dark:hover:text-white")}><Moon size={14} /> Dark</button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10"></div>

                {/* Categories */}
                <div>
                    <h3 className="text-lg font-semibold text-forest-900 dark:text-white mb-4 flex items-center gap-2">
                        <Tag size={20} className="text-forest-light-muted dark:text-white/60" /> Manage Categories
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCat}
                                onChange={(e) => setNewCat(e.target.value)}
                                placeholder="New category..."
                                className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm dark:text-white"
                            />
                            <button onClick={handleAddCategory} className="p-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-forest-500/20 p-1">
                            <div className="flex flex-wrap gap-2">
                                {(settings.categories || ['Wellness', 'Fitness', 'Productivity', 'Mindset', 'Social']).map(cat => (
                                    <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-50 dark:bg-forest-900/20 text-forest-700 dark:text-forest-300 border border-forest-100 dark:border-forest-500/20 text-xs font-bold">
                                        {cat}
                                        <button onClick={() => handleRemoveCategory(cat)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10"></div>

                {/* Account Status */}
                <div>
                    <h3 className="text-lg font-semibold text-forest-900 dark:text-white mb-4 flex items-center gap-2">
                        <Cloud size={20} className="text-forest-light-muted dark:text-white/60" /> Account & Sync
                    </h3>
                    <div className="space-y-4">
                        {currentUser ? (
                            <div className="bg-forest-50 dark:bg-forest-900/20 p-4 rounded-xl border border-forest-100 dark:border-forest-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white dark:bg-white/10 p-2 rounded-full">
                                        <User className="text-forest-600 dark:text-forest-300" size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-forest-900 dark:text-white">{currentUser.name}</p>
                                        <p className="text-xs text-forest-600 dark:text-forest-400">{currentUser.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={handleSyncNow} disabled={syncStatus === 'loading'} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors shadow-sm text-sm font-bold">
                                        {syncStatus === 'loading' ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />} Sync Now
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-xl border border-slate-200 dark:border-white/10 text-center">
                                <p className="text-slate-600 dark:text-slate-300 mb-4">Log in to sync your habits across devices and ensure your data is backed up safely.</p>
                                <button onClick={() => onNavigate('/profile')} className="px-6 py-2 bg-forest-600 text-white rounded-xl font-bold hover:bg-forest-700 transition-colors shadow-lg">Log In / Sign Up</button>
                            </div>
                        )}
                        {syncStatus === 'success' && <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-500/20"><Check size={16} /> Connected and synced successfully.</div>}
                        {syncStatus === 'error' && <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20"><AlertTriangle size={16} /> Connection failed.</div>}
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10"></div>

                {/* Danger Zone */}
                <div>
                    <h3 className="text-lg font-semibold text-forest-900 dark:text-white mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500" /> Danger Zone</h3>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-xl p-4">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">Resetting data deletes all habits and settings locally.</p>
                        <button onClick={() => setShowResetModal(true)} className="flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"><Trash size={18} /> Reset Everything</button>
                    </div>
                </div>
            </div>

            {showReportModal && <ReportModal />}
            {showResetModal && (
                <div className="fixed inset-0 md:left-64 z-[100] flex items-start justify-center p-4 pt-32 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-forest-dark-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-white/10 transform animate-slide-down">
                        <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3 text-red-500"><div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full"><AlertTriangle size={24} /></div><h3 className="text-xl font-bold text-slate-800 dark:text-white">Reset?</h3></div><button onClick={() => setShowResetModal(false)}><X size={20} /></button></div>
                        <p className="text-slate-600 dark:text-forest-dark-muted mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-3"><button onClick={() => setShowResetModal(false)} className="px-4 py-2 rounded-xl text-slate-600 font-medium">Cancel</button><button onClick={handleResetConfirm} className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium">Yes, Reset</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

import React from 'react';
import { LayoutDashboard, CheckSquare, PieChart, Award, Settings, Menu, X, Leaf, PanelLeftClose, PanelLeftOpen, ArrowLeft, Book, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { Habit } from '../types';
import { calculateStreak } from '../utils/dateUtils';

interface LayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  toggleTheme: () => void;
  habits: Habit[];
  currentRoute: string;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isDark, toggleTheme, habits, currentRoute, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState(true);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/habits', label: 'My Habits', icon: CheckSquare },
    { path: '/journal', label: 'Journal', icon: Book },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
    { path: '/profile', label: 'Profile', icon: UserCircle },
    { path: '/achievements', label: 'Achievements', icon: Award },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setIsSidebarOpen(false);
  };

  const isPathActive = (path: string) => {
    if (path === '/' && currentRoute === '/') return true;
    if (path !== '/' && currentRoute.startsWith(path)) return true;
    return false;
  };

  const calculateConsistencyScore = () => {
    if (habits.length === 0) return 0;
    const totalRate = habits.reduce((acc, habit) => acc + calculateStreak(habit).completionRate, 0);
    return Math.round(totalRate / habits.length);
  };

  const consistencyScore = calculateConsistencyScore();
  const isHome = currentRoute === '/';

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      {/* Mobile Header */}
      <header className="md:hidden bg-forest-light-surface dark:bg-forest-dark-surface border-b border-slate-200 dark:border-white/5 p-4 flex justify-between items-center shadow-sm relative z-50 transition-all duration-500">
        <div className="flex items-center gap-3">
             {!isHome && (
                 <button 
                    onClick={() => onNavigate('/')} 
                    className="p-1 text-forest-600 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                 >
                     <ArrowLeft size={24} />
                 </button>
             )}
             <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-forest-500 to-forest-800 dark:from-forest-400 dark:to-forest-200">Nexus</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-forest-light-text dark:text-forest-dark-text">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar / Navigation */}
      <aside className={clsx(
        "fixed md:relative inset-y-0 left-0 z-50 bg-forest-light-surface dark:bg-forest-dark-surface border-r border-slate-200 dark:border-white/5 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none overflow-hidden",
        // Mobile visibility
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        // Desktop visibility override
        "md:translate-x-0",
        isDesktopSidebarOpen ? "md:w-64" : "md:w-0 md:border-r-0"
      )}>
        <div className="p-8 hidden md:block min-w-[16rem]">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-forest-500 to-forest-800 dark:from-forest-400 dark:to-forest-200 flex items-center gap-2">
                <span className="text-forest-500"><Leaf size={28} fill="currentColor" /></span> Nexus
            </h2>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 min-w-[16rem]">
          {navItems.map((item) => {
            const active = isPathActive(item.path);
            return (
              <a
                key={item.path}
                href="#"
                onClick={(e) => { e.preventDefault(); handleNavClick(item.path); }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border focus:outline-none cursor-pointer",
                  active
                    ? "bg-gradient-to-r from-forest-500/10 to-forest-600/10 dark:bg-white/5 border-forest-200 dark:border-forest-500/30 text-forest-800 dark:text-forest-100 shadow-lg shadow-forest-500/5" 
                    : "border-transparent text-forest-light-muted dark:text-forest-dark-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-forest-900 dark:hover:text-white"
                )}
              >
                <item.icon size={20} className={active ? "text-forest-600 dark:text-forest-400" : ""} />
                <span className="font-medium">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-white/5 min-w-[16rem]">
           <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
             <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-forest-light-muted dark:text-forest-dark-muted">Consistency Score</p>
                <span className="text-xs font-bold text-forest-600 dark:text-forest-400">{consistencyScore}%</span>
             </div>
             <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-forest-500 to-forest-300 shadow-[0_0_10px_rgba(76,175,80,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${consistencyScore}%` }}
                ></div>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 relative bg-transparent flex flex-col transition-all duration-700 scroll-smooth">
        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3 mb-6 animate-fade-in transition-all duration-500">
             <button 
                 onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                 className="p-2.5 rounded-xl bg-white/50 dark:bg-forest-dark-surface border border-slate-200 dark:border-white/10 text-forest-600 dark:text-forest-300 hover:bg-white dark:hover:bg-white/5 transition-all hover:scale-105 active:scale-95 shadow-sm"
                 title={isDesktopSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
             >
                 {isDesktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
             </button>

             {!isHome && (
                 <button 
                    onClick={() => onNavigate('/')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 dark:bg-forest-dark-surface border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-white dark:hover:bg-white/5 transition-all hover:scale-105 active:scale-95 shadow-sm group"
                 >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Back to Home</span>
                 </button>
             )}
        </div>

        <div className="mx-auto w-full flex-1 flex flex-col max-w-6xl">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
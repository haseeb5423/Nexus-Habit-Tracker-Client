import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { api } from '../services/storage';
import { calculateStreak } from '../utils/dateUtils';
import { User, Mail, Edit2, Check, LogOut, Award, Activity, Calendar, Shield, Zap, Flame } from 'lucide-react';
import clsx from 'clsx';
import Auth from './Auth';

interface ProfileProps {
  habits: Habit[];
  onLogout: () => void;
  onSync: (data: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ habits, onLogout, onSync }) => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setBio(currentUser.bio || '');
        setName(currentUser.name || '');
    }
  }, []);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const result = await api.updateProfile(name, bio);
    if (result.success) {
        setUser(result.data);
        setIsEditing(false);
    }
    setIsSaving(false);
  };

  if (!api.isLoggedIn()) {
      return <Auth onLoginSuccess={(data) => {
          onSync(data);
          window.location.reload();
      }} />;
  }

  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  // Calculate Aggregated Stats
  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((acc, h) => acc + h.completions.length, 0);
  const avgCompletionRate = totalHabits > 0 
    ? Math.round(habits.reduce((acc, h) => acc + calculateStreak(h).completionRate, 0) / totalHabits) 
    : 0;
  const longestStreak = Math.max(...habits.map(h => calculateStreak(h).longest), 0);

  // Gamification Logic Reused for Profile display
  const badges = [
    { name: 'Sprout', icon: Zap, color: 'text-forest-400', achieved: habits.some(h => calculateStreak(h).current >= 3) },
    { name: 'Sapling', icon: Shield, color: 'text-forest-600', achieved: habits.some(h => calculateStreak(h).current >= 7) },
    { name: 'Mighty Oak', icon: Award, color: 'text-forest-800', achieved: habits.some(h => calculateStreak(h).current >= 30) },
  ];
  const achievedBadges = badges.filter(b => b.achieved);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-fade-in">
        
        {/* Header Card */}
        <div className="relative bg-white dark:bg-forest-dark-surface rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-forest-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User />}
                    </div>
                    
                    <div className="space-y-1">
                        {isEditing ? (
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-2xl font-bold bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded px-2 py-1 text-slate-900 dark:text-white w-full max-w-xs"
                            />
                        ) : (
                            <h2 className="text-3xl font-bold text-forest-900 dark:text-white">{user.name}</h2>
                        )}
                        <div className="flex items-center gap-2 text-slate-500 dark:text-forest-dark-muted text-sm">
                            <Mail size={14} /> {user.email}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 self-end md:self-auto">
                    {isEditing ? (
                        <button 
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors shadow-lg"
                        >
                            <Check size={16} /> Save
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10"
                        >
                            <Edit2 size={16} /> Edit Profile
                        </button>
                    )}
                    <button 
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-red-100 dark:border-white/5"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Bio</label>
                {isEditing ? (
                    <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white h-24 focus:outline-none focus:ring-2 focus:ring-forest-500/50"
                        placeholder="Tell us about yourself..."
                    />
                ) : (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        {bio || "No bio yet. Click edit to add one!"}
                    </p>
                )}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-forest-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 text-forest-600 mb-2"><Activity size={18} /> <span className="text-xs font-bold uppercase">Consistency</span></div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white">{avgCompletionRate}%</div>
            </div>
            <div className="bg-white/80 dark:bg-forest-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 text-orange-500 mb-2"><Flame size={18} /> <span className="text-xs font-bold uppercase">Best Streak</span></div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white">{longestStreak} <span className="text-sm font-medium text-slate-400">days</span></div>
            </div>
            <div className="bg-white/80 dark:bg-forest-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 text-blue-500 mb-2"><Check size={18} /> <span className="text-xs font-bold uppercase">Total Reps</span></div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white">{totalCompletions}</div>
            </div>
            <div className="bg-white/80 dark:bg-forest-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 text-purple-500 mb-2"><Calendar size={18} /> <span className="text-xs font-bold uppercase">Active Habits</span></div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white">{totalHabits}</div>
            </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white/80 dark:bg-forest-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-lg font-bold text-forest-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="text-amber-500" /> Recent Achievements
            </h3>
            {achievedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {achievedBadges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5">
                            <div className="p-2 bg-white dark:bg-white/10 rounded-full shadow-sm">
                                <badge.icon className={clsx("w-5 h-5", badge.color)} />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-white">{badge.name}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 italic">No badges earned yet. Keep going!</p>
            )}
        </div>
    </div>
  );
};

export default Profile;
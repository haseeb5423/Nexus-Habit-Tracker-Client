import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import { api } from '../services/storage';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let result;
    if (isLogin) {
        result = await api.login(email, password);
        if (result.success) {
            // Sync data immediately after login
            if (result.data.habits || result.data.settings) {
                onLoginSuccess(result.data); // Parent handles local storage update
            } else {
                window.location.reload(); // Simple reload if no complex merge needed
            }
        } else {
            setError(result.message);
        }
    } else {
        result = await api.register(name, email, password);
        if (result.success) {
            window.location.reload();
        } else {
            setError(result.message);
        }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
        <div className="w-full max-w-md bg-white dark:bg-forest-dark-surface p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-forest-900 dark:text-white tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Join Nexus'}
                </h2>
                <p className="text-forest-light-muted dark:text-forest-dark-muted mt-2">
                    {isLogin ? 'Sign in to sync your progress' : 'Start your journey to better habits'}
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm rounded-lg text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={!isLogin}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500/50"
                        />
                    </div>
                )}
                
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="email" 
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500/50"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500/50"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-forest-600 hover:bg-forest-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-forest-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : (
                        <>
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-forest-600 dark:text-forest-400 font-bold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Auth;
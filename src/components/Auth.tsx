import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleAuth = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                setMessage('Registrazione riuscita! Controlla la tua email per il link di verifica.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <img src="/vite.svg" alt="Timecard Pro Logo" className="h-16 w-auto mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Timecard Pro</h1>
                    <p className="text-gray-600 dark:text-slate-600 mt-2">{isLogin ? 'Accedi per continuare' : 'Crea un nuovo account'}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                            Indirizzo Email
                        </label>
                        <input
                            id="email"
                            className="mt-1 block w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"
                               className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                            Password
                        </label>
                        <input
                            id="password"
                            className="mt-1 block w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400"
                        >
                            {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
                        </button>
                    </div>
                </form>

                {message && <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">{message}</p>}
                {error && <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
                
                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setMessage(''); setError(''); }}
                            className="text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 font-medium">
                        {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;

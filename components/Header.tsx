import React, { useState, useEffect } from 'react';

interface HeaderProps {
    currentPage: 'dashboard' | 'calendar' | 'settings' | 'balances';
    onNavigate: (page: 'dashboard' | 'calendar' | 'settings' | 'balances') => void;
}

const SunIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const MoonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

const SettingsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 010 1.255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.333.183-.582.495-.645.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 010-1.255c.008-.378-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.213-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (localStorage.theme === 'dark') {
            return true;
        }
        return (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/50 sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center space-x-4">
                         <img src="/vite.svg" alt="Timecard Pro Logo" className="h-10 w-auto" />
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Timecard Pro</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <nav className="bg-gray-200 dark:bg-slate-800 p-1 rounded-lg flex space-x-1">
                           <button onClick={() => onNavigate('dashboard')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentPage === 'dashboard' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Dashboard</button>
                           <button onClick={() => onNavigate('calendar')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentPage === 'calendar' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Calendario</button>
                           <button onClick={() => onNavigate('balances')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentPage === 'balances' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Saldi</button>
                        </nav>
                        <button onClick={toggleTheme} className="p-2.5 rounded-lg bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors" aria-label="Toggle theme">
                            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        </button>
                         <button onClick={() => onNavigate('settings')} className={`p-2.5 rounded-lg font-semibold transition-colors ${currentPage === 'settings' ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white'}`} aria-label="Settings">
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

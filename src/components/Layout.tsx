import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { session } = useAuth();
    useSettings(); // For theme if needed

    // Map current path to page name for Header
    const getCurrentPage = () => {
        const path = location.pathname.substring(1);
        if (path === '' || path === 'dashboard') return 'dashboard';
        return path as 'dashboard' | 'calendar' | 'settings' | 'balances' | 'profile';
    };

    const handleNavigate = (page: 'dashboard' | 'calendar' | 'settings' | 'balances' | 'profile') => {
        navigate(page === 'dashboard' ? '/' : `/${page}`);
    };

    const handleLogout = async () => {
        const { supabase } = await import('../supabaseClient');
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {session && (
                <Header
                    currentPage={getCurrentPage()}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                // onOpenSearch will be handled via global event or context if needed
                />
            )}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

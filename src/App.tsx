import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DataProvider } from './contexts/DataContext';
import { UIProvider } from './contexts/UIContext';
import Layout from './components/Layout';
import Login from './components/Auth';
import OnboardingModal from './components/Onboarding';

// Lazy loaded pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const BalancesPage = lazy(() => import('./pages/BalancesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));

// Loading component
const PageLoading = () => (
    <div className="flex items-center justify-center h-full min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const AppContent = () => {
    const { session, showOnboarding, setShowOnboarding } = useAuth();

    return (
        <>
            <Routes>
                <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={
                        <Suspense fallback={<PageLoading />}>
                            <DashboardPage />
                        </Suspense>
                    } />
                    <Route path="calendar" element={
                        <Suspense fallback={<PageLoading />}>
                            <CalendarPage />
                        </Suspense>
                    } />
                    <Route path="balances" element={
                        <Suspense fallback={<PageLoading />}>
                            <BalancesPage />
                        </Suspense>
                    } />
                    <Route path="profile" element={
                        <Suspense fallback={<PageLoading />}>
                            <ProfilePage />
                        </Suspense>
                    } />
                    <Route path="settings" element={
                        <Suspense fallback={<PageLoading />}>
                            <SettingsPage />
                        </Suspense>
                    } />
                    {/* Catch all redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>

            {session && showOnboarding && (
                <OnboardingModal
                    onComplete={() => {
                        setShowOnboarding(false);
                        localStorage.setItem('onboarding_completed', 'true');
                    }}
                />
            )}
        </>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <SettingsProvider>
                    <UIProvider>
                        <DataProvider>
                            <AppContent />
                        </DataProvider>
                    </UIProvider>
                </SettingsProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
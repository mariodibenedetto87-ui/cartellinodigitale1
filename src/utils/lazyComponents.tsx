import React, { lazy, Suspense } from 'react';

// Lazy load delle pagine
export const LazyCalendarPage = lazy(() => import('../pages/CalendarPage'));
export const LazyBalancesPage = lazy(() => import('../pages/BalancesPage'));
export const LazySettingsPage = lazy(() => import('../components/SettingsPage'));

// Lazy load dei componenti pesanti
export const LazyComparativeStats = lazy(() => import('../components/ComparativeStats'));
export const LazyWeeklyHoursChart = lazy(() => import('../components/WeeklyHoursChart'));
export const LazyAnnualSummary = lazy(() => import('../components/AnnualSummary'));

// Loading component riutilizzabile
export const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-slate-600 font-medium">Caricamento...</p>
    </div>
  </div>
);

// Wrapper component per gestire il Suspense
export const withSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode = <PageLoader />
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

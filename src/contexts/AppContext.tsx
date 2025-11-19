import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { 
  WorkStatus, AllTimeLogs, WorkSettings, AllDayInfo, StatusItem, 
  DashboardLayout, WidgetVisibility, AllManualOvertime, SavedRotation, 
  OfferSettings, AllMealVouchers, ThemeSettings 
} from '../types';
import { SmartNotification } from '../utils/smartNotifications';

// Types
type Page = 'dashboard' | 'calendar' | 'settings' | 'balances';
type ToastMessage = { id: number; message: string; type: 'success' | 'error' };

// Context shape
interface AppContextValue {
  // Auth
  session: Session | null;
  setSession: (session: Session | null) => void;
  
  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  
  // Data
  allLogs: AllTimeLogs;
  setAllLogs: React.Dispatch<React.SetStateAction<AllTimeLogs>>;
  allDayInfo: AllDayInfo;
  setAllDayInfo: React.Dispatch<React.SetStateAction<AllDayInfo>>;
  allManualOvertime: AllManualOvertime;
  setAllManualOvertime: React.Dispatch<React.SetStateAction<AllManualOvertime>>;
  allMealVouchers: AllMealVouchers;
  setAllMealVouchers: React.Dispatch<React.SetStateAction<AllMealVouchers>>;
  
  // Work Status
  workStatus: WorkStatus;
  setWorkStatus: (status: WorkStatus) => void;
  currentSessionStart: Date | null;
  setCurrentSessionStart: (date: Date | null) => void;
  currentSessionDuration: string;
  setCurrentSessionDuration: (duration: string) => void;
  
  // Selected Date
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  
  // Settings
  settings: {
    workSettings: WorkSettings;
    offerSettings: OfferSettings;
    themeSettings: ThemeSettings;
    statusItems: StatusItem[];
    savedRotations: SavedRotation[];
    dashboardLayout: DashboardLayout;
    widgetVisibility: WidgetVisibility;
  };
  setSettings: React.Dispatch<React.SetStateAction<AppContextValue['settings']>>;
  
  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  
  // Smart Notifications
  smartNotifications: SmartNotification[];
  setSmartNotifications: (notifications: SmartNotification[]) => void;
  
  // Loading
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Create context
const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // AUTH & LOADING STATE
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // NAVIGATION
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  
  // DATA STATE
  const [allLogs, setAllLogs] = useState<AllTimeLogs>({});
  const [allDayInfo, setAllDayInfo] = useState<AllDayInfo>({});
  const [allManualOvertime, setAllManualOvertime] = useState<AllManualOvertime>({});
  const [allMealVouchers, setAllMealVouchers] = useState<AllMealVouchers>({});
  
  // WORK STATUS
  const [workStatus, setWorkStatus] = useState<WorkStatus>(WorkStatus.ClockedOut);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  const [currentSessionDuration, setCurrentSessionDuration] = useState('00:00:00');
  
  // DATE STATE
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // TOASTS
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [smartNotifications, setSmartNotifications] = useState<SmartNotification[]>([]);

  // SETTINGS
  const [settings, setSettings] = useState<AppContextValue['settings']>({
    workSettings: {
      standardDayHours: 6,
      nightTimeStartHour: 22,
      nightTimeEndHour: 6,
      treatHolidayAsOvertime: true,
      enableClockInReminder: false,
      enableClockOutReminder: true,
      deductAutoBreak: false,
      autoBreakThresholdHours: 6,
      autoBreakMinutes: 30,
      shifts: [
        { id: 'morning', name: 'Mattina', startHour: 8, endHour: 14, textColor: 'text-rose-800 dark:text-rose-200', bgColor: 'bg-rose-100 dark:bg-rose-900/50' },
        { id: 'afternoon', name: 'Pomeriggio', startHour: 14, endHour: 20, textColor: 'text-sky-800 dark:text-sky-200', bgColor: 'bg-sky-100 dark:bg-sky-900/50' },
        { id: 'evening', name: 'Serale', startHour: 16, endHour: 22, textColor: 'text-indigo-800 dark:text-indigo-200', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
        { id: 'night', name: 'Notturno', startHour: 21, endHour: 3, textColor: 'text-purple-800 dark:text-purple-200', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
        { id: 'rest', name: 'Riposo', startHour: null, endHour: null, textColor: 'text-pink-800 dark:text-pink-200', bgColor: 'bg-pink-100 dark:bg-pink-900/50' },
      ],
    },
    offerSettings: { title: '', description: '', imageUrl: '' },
    themeSettings: { accentColor: 'teal', primaryShade: '500' },
    statusItems: [],
    savedRotations: [],
    dashboardLayout: {
      main: ['smartNotifications', 'nfcScanner', 'summary', 'dashboardInsights', 'mealVoucherCard'],
      sidebar: ['plannerCard', 'offerCard', 'balancesSummary', 'monthlySummary', 'weeklySummary', 'weeklyHoursChart']
    },
    widgetVisibility: {
      smartNotifications: true, nfcScanner: true, summary: true, dashboardInsights: true,
      mealVoucherCard: true, plannerCard: true, offerCard: true,
      balancesSummary: true, monthlySummary: true, weeklySummary: true,
      weeklyHoursChart: false,
    }
  });

  // TOAST HANDLER
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const value: AppContextValue = {
    session,
    setSession,
    currentPage,
    setCurrentPage,
    allLogs,
    setAllLogs,
    allDayInfo,
    setAllDayInfo,
    allManualOvertime,
    setAllManualOvertime,
    allMealVouchers,
    setAllMealVouchers,
    workStatus,
    setWorkStatus,
    currentSessionStart,
    setCurrentSessionStart,
    currentSessionDuration,
    setCurrentSessionDuration,
    selectedDate,
    setSelectedDate,
    settings,
    setSettings,
    toasts,
    showToast,
    smartNotifications,
    setSmartNotifications,
    loading,
    setLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

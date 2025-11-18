import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { WorkStatus, AllTimeLogs, TimeEntry, WorkSettings, AllDayInfo, StatusItem, DashboardLayout, WidgetVisibility, AllManualOvertime, ManualOvertimeType, SavedRotation, ManualOvertimeEntry, DayInfo, LeaveType, ShiftType, OfferSettings, AllMealVouchers, ThemeSettings } from './types';
import { formatDateKey, formatDuration, addDays, parseDateKey } from './utils/timeUtils';
import { scheduleReminders, requestNotificationPermission, clearScheduledNotifications } from './utils/notificationUtils';
import { generateSmartNotifications, SmartNotification } from './utils/smartNotifications';
import { applyTheme } from './utils/themeUtils';
import { defaultStatusItems } from './data/statusItems';
import Auth from './components/Auth';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './components/SettingsPage';
import BalancesPage from './pages/BalancesPage';
import QuickLeaveModal from './components/QuickLeaveModal';
import Toast from './components/Toast';
import AddTimeEntryModal from './components/AddTimeEntryModal';
import AddManualEntryModal from './components/AddManualEntryModal';
import AddOvertimeModal from './components/AddOvertimeModal';
import RangePlannerModal from './components/RangePlannerModal';
import MealVoucherModal from './components/MealVoucherModal';
import Onboarding from './components/Onboarding';
import QuickActionsFAB from './components/QuickActionsFAB';
import ConnectionStatus from './components/ConnectionStatus';
import GlobalSearch from './components/GlobalSearch';
import InstallPrompt from './components/InstallPrompt';
import { offlineManager } from './utils/offlineManager';
import { syncWithDatabase } from './utils/syncManager';

type Page = 'dashboard' | 'calendar' | 'settings' | 'balances';
type ToastMessage = { id: number; message: string; type: 'success' | 'error'; };

// Helper function to debounce saving to Supabase
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
    });
};

const App: React.FC = () => {
    // AUTH & LOADING STATE
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // ONBOARDING STATE
    const [showOnboarding, setShowOnboarding] = useState(false);

    // GLOBAL APP STATE
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [allLogs, setAllLogs] = useState<AllTimeLogs>({});
    const [allDayInfo, setAllDayInfo] = useState<AllDayInfo>({});
    const [allManualOvertime, setAllManualOvertime] = useState<AllManualOvertime>({});
    const [allMealVouchers, setAllMealVouchers] = useState<AllMealVouchers>({});
    const [workStatus, setWorkStatus] = useState<WorkStatus>(WorkStatus.ClockedOut);
    const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
    const [currentSessionDuration, setCurrentSessionDuration] = useState('00:00:00');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [smartNotifications, setSmartNotifications] = useState<SmartNotification[]>([]);
    
    // All settings are now grouped into one state for easier Supabase management
    const [settings, setSettings] = useState<{
        workSettings: WorkSettings;
        offerSettings: OfferSettings;
        themeSettings: ThemeSettings;
        statusItems: StatusItem[];
        savedRotations: SavedRotation[];
        dashboardLayout: DashboardLayout;
        widgetVisibility: WidgetVisibility;
    }>({
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
        statusItems: defaultStatusItems,
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

    // MODAL STATES
    const [quickLeaveModalOptions, setQuickLeaveModalOptions] = useState<{date: Date; highlightedLeave?: LeaveType} | null>(null);
    const [addEntryModalDate, setAddEntryModalDate] = useState<Date | null>(null);
    const [addManualEntryModalDate, setAddManualEntryModalDate] = useState<Date | null>(null);
    const [addOvertimeModalDate, setAddOvertimeModalDate] = useState<Date | null>(null);
    const [mealVoucherModalDate, setMealVoucherModalDate] = useState<Date | null>(null);
    const [rangePlannerOptions, setRangePlannerOptions] = useState<{isOpen: boolean, startDate?: Date}>({isOpen: false});
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    
    // ANTI-DUPLICATE FLAGS
    const [isTogglingRef, setIsTogglingRef] = useState(false);
    const [isAddingEntryRef, setIsAddingEntryRef] = useState(false);

    // OFFLINE SYNC STATE
    const [isInitializingOffline, setIsInitializingOffline] = useState(true);

    // TOAST HANDLER
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // OFFLINE SYNC HANDLER
    const handleSyncRequest = useCallback(async () => {
        try {
            const result = await syncWithDatabase();
            if (result.success > 0 || result.failed > 0) {
                showToast(result.message, result.failed > 0 ? 'error' : 'success');
            }
            // Reload data after sync
            if (result.success > 0 && session) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Sync failed:', error);
            showToast('Sincronizzazione fallita', 'error');
        }
    }, [session, showToast]);

    // --- DATA FETCHING & INITIALIZATION ---
    // Initialize offline manager
    useEffect(() => {
        const initOffline = async () => {
            try {
                await offlineManager.init();
                setIsInitializingOffline(false);
            } catch (error) {
                console.error('Failed to initialize offline manager:', error);
                setIsInitializingOffline(false);
            }
        };
        initOffline();
    }, []);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
            
            // Check if first time user
            if (session && !localStorage.getItem('onboarding_completed')) {
                setShowOnboarding(true);
            }
        };
        fetchSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            const fetchData = async () => {
                setLoading(true);
                
                const { data: settingsData, error: settingsError } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();
                
                if (settingsData) {
                    setSettings(prevSettings => {
                        // Merge Logic for Shifts: Ensure new default shifts are added if missing
                        const loadedShifts = settingsData.work_settings?.shifts || [];
                        const defaultShifts = prevSettings.workSettings.shifts;
                        
                        const mergedShifts = [...loadedShifts];
                        defaultShifts.forEach((ds: any) => {
                             if (!mergedShifts.find((ls: any) => ls.id === ds.id)) {
                                 mergedShifts.push(ds);
                             }
                        });

                        // Merge dashboard layout: aggiungi nuovi widget ai layout esistenti
                        const loadedMainLayout = settingsData.dashboard_layout?.main || [];
                        const defaultMainLayout = prevSettings.dashboardLayout.main;
                        const mergedMainLayout = [...loadedMainLayout];
                        defaultMainLayout.forEach((widget: string) => {
                            if (!mergedMainLayout.includes(widget)) {
                                mergedMainLayout.push(widget);
                            }
                        });

                        const loadedSidebarLayout = settingsData.dashboard_layout?.sidebar || [];
                        const defaultSidebarLayout = prevSettings.dashboardLayout.sidebar;
                        const mergedSidebarLayout = [...loadedSidebarLayout];
                        defaultSidebarLayout.forEach((widget: string) => {
                            if (!mergedSidebarLayout.includes(widget)) {
                                mergedSidebarLayout.push(widget);
                            }
                        });

                        return {
                            workSettings: { 
                                ...prevSettings.workSettings, 
                                ...settingsData.work_settings,
                                shifts: mergedShifts 
                            },
                            offerSettings: { ...prevSettings.offerSettings, ...settingsData.offer_settings },
                            themeSettings: settingsData.theme_settings 
                                ? { ...prevSettings.themeSettings, ...settingsData.theme_settings }
                                : prevSettings.themeSettings, // Fallback se colonna manca
                            dashboardLayout: { 
                                main: mergedMainLayout,
                                sidebar: mergedSidebarLayout
                            },
                            widgetVisibility: { 
                                ...prevSettings.widgetVisibility, 
                                ...settingsData.widget_visibility 
                            },
                            statusItems: settingsData.status_items || prevSettings.statusItems,
                            savedRotations: settingsData.saved_rotations || prevSettings.savedRotations,
                        };
                    });
                } else if (settingsError && settingsError.code === 'PGRST116') {
                    // Inserimento nuovo utente - non include theme_settings se colonna manca
                    const insertData: any = { 
                        user_id: session.user.id, 
                        work_settings: settings.workSettings,
                        offer_settings: settings.offerSettings,
                        dashboard_layout: settings.dashboardLayout,
                        widget_visibility: settings.widgetVisibility,
                        status_items: settings.statusItems,
                        saved_rotations: settings.savedRotations,
                    };
                    
                    const { error: insertError } = await supabase.from('user_settings').insert(insertData);
                    if (insertError) showToast(`Errore nel creare le impostazioni: ${insertError.message}`, 'error');
                }

                const { data: logsData, error: logsError } = await supabase.from('time_logs').select('id, timestamp, type').eq('user_id', session.user.id);
                if (logsData) {
                    const logs: AllTimeLogs = {};
                    const seenTimestamps = new Map<string, string>(); // timestamp+type -> id
                    const duplicateIds: string[] = [];
                    
                    logsData.forEach(log => {
                        const key = `${log.timestamp}_${log.type}`;
                        
                        // Rileva duplicati esatti
                        if (seenTimestamps.has(key)) {
                            duplicateIds.push(log.id);
                        } else {
                            seenTimestamps.set(key, log.id);
                            const dateKey = formatDateKey(new Date(log.timestamp));
                            if (!logs[dateKey]) logs[dateKey] = [];
                            logs[dateKey].push({ id: log.id, timestamp: new Date(log.timestamp), type: log.type as 'in' | 'out' });
                        }
                    });
                    
                    // Elimina duplicati dal database
                    if (duplicateIds.length > 0) {
                        const { error: deleteError } = await supabase
                            .from('time_logs')
                            .delete()
                            .in('id', duplicateIds);
                        
                        if (!deleteError) {
                            showToast(`Rimossi ${duplicateIds.length} duplicati`, 'success');
                        }
                    }
                    
                    setAllLogs(logs);
                } else if (logsError) showToast(`Errore nel caricare le timbrature: ${logsError.message}`, 'error');

                const { data: dayInfoData, error: dayInfoError } = await supabase.from('day_info').select('date, info').eq('user_id', session.user.id);
                if (dayInfoData) {
                    const dayInfo: AllDayInfo = {};
                    dayInfoData.forEach(d => { dayInfo[d.date] = d.info; });
                    setAllDayInfo(dayInfo);
                } else if(dayInfoError) showToast(`Errore nel caricare la pianificazione: ${dayInfoError.message}`, 'error');

                const { data: overtimeData, error: overtimeError } = await supabase.from('manual_overtime').select('id, date, entry').eq('user_id', session.user.id);
                if (overtimeData) {
                    const overtime: AllManualOvertime = {};
                    overtimeData.forEach(o => {
                        if (!overtime[o.date]) overtime[o.date] = [];
                        overtime[o.date].push({ id: o.id, ...o.entry });
                    });
                    setAllManualOvertime(overtime);
                } else if(overtimeError) showToast(`Errore nel caricare lo straordinario: ${overtimeError.message}`, 'error');

                const { data: vouchersData, error: vouchersError } = await supabase.from('meal_vouchers').select('id, date, earned, manual, note').eq('user_id', session.user.id);
                if (vouchersData) {
                    const vouchers: AllMealVouchers = {};
                    vouchersData.forEach(v => {
                        vouchers[v.date] = { id: v.id, date: v.date, earned: v.earned, manual: v.manual, note: v.note || '' };
                    });
                    setAllMealVouchers(vouchers);
                } else if(vouchersError) showToast(`Errore nel caricare i buoni pasto: ${vouchersError.message}`, 'error');

                setLoading(false);
            };
            fetchData();
        } else {
            setAllLogs({});
            setAllDayInfo({});
            setAllManualOvertime({});
            setAllMealVouchers({});
        }
    }, [session, showToast]);

    // --- DATA PERSISTENCE ---
    const debouncedSaveSettings = useCallback(debounce(async (newSettings) => {
        if (!session) return;
        
        // Prepara i dati da salvare
        const updateData: any = {
            work_settings: newSettings.workSettings,
            offer_settings: newSettings.offerSettings,
            dashboard_layout: newSettings.dashboardLayout,
            widget_visibility: newSettings.widgetVisibility,
            status_items: newSettings.statusItems,
            saved_rotations: newSettings.savedRotations,
        };
        
        // Aggiungi theme_settings solo se supportato (evita errore 400)
        // TODO: Eseguire migration SQL per aggiungere colonna al database
        try {
            updateData.theme_settings = newSettings.themeSettings;
            const { error } = await supabase.from('user_settings').update(updateData).eq('user_id', session.user.id);
            if (error) {
                // Se errore per colonna mancante, riprova senza theme_settings
                if (error.message.includes('theme_settings')) {
                    delete updateData.theme_settings;
                    const { error: retryError } = await supabase.from('user_settings').update(updateData).eq('user_id', session.user.id);
                    if (retryError) showToast(`Salvataggio fallito: ${retryError.message}`, 'error');
                    else showToast('Impostazioni salvate! (tema locale)');
                } else {
                    showToast(`Salvataggio fallito: ${error.message}`, 'error');
                }
            } else {
                showToast('Impostazioni salvate nel cloud!');
            }
        } catch (err: any) {
            showToast(`Errore: ${err.message}`, 'error');
        }
    }, 2000), [session, showToast]);

    useEffect(() => {
        if (session && !loading) { debouncedSaveSettings(settings); }
    }, [settings, debouncedSaveSettings, session, loading]);

    // DERIVED STATE & TIMERS
    useEffect(() => {
        const todayKey = formatDateKey(new Date());
        const todayEntries = allLogs[todayKey] || [];
        const lastEntry = todayEntries[todayEntries.length - 1];
        if (lastEntry && lastEntry.type === 'in') {
            setWorkStatus(WorkStatus.ClockedIn);
            setCurrentSessionStart(new Date(lastEntry.timestamp));
        } else {
            setWorkStatus(WorkStatus.ClockedOut);
            setCurrentSessionStart(null);
        }
    }, [allLogs]);

    useEffect(() => {
        let interval: number | undefined;
        if (workStatus === WorkStatus.ClockedIn && currentSessionStart) {
            interval = window.setInterval(() => setCurrentSessionDuration(formatDuration(new Date().getTime() - new Date(currentSessionStart).getTime())), 1000);
        } else {
            setCurrentSessionDuration('00:00:00');
        }
        return () => clearInterval(interval);
    }, [workStatus, currentSessionStart]);
    
    // NOTIFICATIONS
    useEffect(() => {
        if (session) {
            (async () => {
                if (settings.workSettings.enableClockInReminder || settings.workSettings.enableClockOutReminder) {
                    const hasPermission = await requestNotificationPermission();
                    if (hasPermission) {
                        scheduleReminders(allDayInfo[formatDateKey(new Date())], settings.workSettings);
                    }
                } else {
                    clearScheduledNotifications();
                }
            })();
        }
    }, [session, settings.workSettings, allDayInfo]);

    // SMART NOTIFICATIONS - Genera notifiche intelligenti ogni 5 minuti
    useEffect(() => {
        if (session && !loading) {
            const updateNotifications = () => {
                const notifications = generateSmartNotifications(
                    workStatus,
                    allLogs,
                    allDayInfo,
                    allManualOvertime,
                    settings.workSettings,
                    currentSessionStart
                );
                setSmartNotifications(notifications);
            };

            updateNotifications(); // Primo caricamento
            const interval = window.setInterval(updateNotifications, 5 * 60 * 1000); // Ogni 5 min
            return () => clearInterval(interval);
        }
    }, [session, loading, workStatus, allLogs, allDayInfo, allManualOvertime, settings.workSettings, currentSessionStart]);

    // APPLY THEME - Applica il tema selezionato dinamicamente
    useEffect(() => {
        applyTheme(settings.themeSettings.accentColor, settings.themeSettings.primaryShade);
    }, [settings.themeSettings]);

    // --- CORE LOGIC HANDLERS ---
    const handleImportData = (importedDays: any[]) => {
        const newLogs: AllTimeLogs = {};
        const newDayInfo: AllDayInfo = {};
        const newManualOvertime: AllManualOvertime = {};

        importedDays.forEach(day => {
            try {
                const dateKey = day.date;
                if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                    console.warn("Skipping day with invalid date format:", day);
                    return;
                }

                // --- Shift Detection ---
                let shiftId: ShiftType | undefined;
                // Priority 1: Use work_code (LAV) from the AI analysis
                if (day.work_code) {
                    const code = String(day.work_code).trim(); // Handle potential spaces or string types
                    // Map known LAV codes to internal shift IDs
                    const shiftMap: Record<string, ShiftType> = {
                        '11': 'morning', 
                        '12': 'afternoon', 
                        '13': 'evening', 
                        '14': 'night', 
                        '1023': 'rest'
                    };
                    shiftId = shiftMap[code];
                }

                // Priority 2: Fallback to clock-in time if shift is still unknown AND day_type is work
                if (!shiftId && day.day_type === 'work' && day.clock_in) {
                    const inTime = day.clock_in.split(':').map(Number);
                    if (!isNaN(inTime[0])) {
                        const hour = inTime[0];
                        if (hour >= 7 && hour < 13) shiftId = 'morning';
                        else if (hour >= 13 && hour < 16) shiftId = 'afternoon';
                        else if (hour >= 16 && hour < 21) shiftId = 'evening';
                        else if (hour >= 21 || hour < 7) shiftId = 'night';
                    }
                }

                // Assign shift to dayInfo if detected, prioritizing it over existing data for import accuracy
                if (shiftId) {
                    const currentInfo = newDayInfo[dateKey] || {};
                    // Ensure we set the shift. This handles "scheduled but not worked" scenarios too.
                    newDayInfo[dateKey] = { ...currentInfo, shift: shiftId };
                }

                // --- Data Processing by Type ---
                if (day.day_type === 'work') {
                    if (day.clock_in && day.clock_out) {
                        const inTime = day.clock_in.split(':').map(Number);
                        const outTime = day.clock_out.split(':').map(Number);
                        if (!isNaN(inTime[0]) && !isNaN(outTime[0])) {

                            const inDate = parseDateKey(dateKey);
                            inDate.setHours(inTime[0], inTime[1] || 0);

                            const outDate = parseDateKey(dateKey);
                            outDate.setHours(outTime[0], outTime[1] || 0);

                            if (outDate < inDate) { // Handle overnight shifts crossing midnight
                                outDate.setDate(outDate.getDate() + 1);
                            }
                            
                            if (!newLogs[dateKey]) newLogs[dateKey] = [];
                            newLogs[dateKey].push({ id: self.crypto.randomUUID(), timestamp: inDate, type: 'in' });
                            newLogs[dateKey].push({ id: self.crypto.randomUUID(), timestamp: outDate, type: 'out' });
                        }
                    }

                    if (day.overtime_hours) {
                        const [h, m] = day.overtime_hours.split(':').map(Number);
                        const durationMs = ((h || 0) * 3600 + (m || 0) * 60) * 1000;
                        if (durationMs > 0) {
                            if (!newManualOvertime[dateKey]) newManualOvertime[dateKey] = [];
                            newManualOvertime[dateKey].push({
                                id: self.crypto.randomUUID(), durationMs, type: 'diurnal',
                                note: day.notes || 'Importato da cartellino',
                            });
                        }
                    }
                } else if (day.day_type === 'leave') {
                    // Handle leave days (holidays, sick leave, permits, etc.)
                    const currentInfo = newDayInfo[dateKey] || {};
                    const leaveTypeMap: Record<string, LeaveType> = {
                        'holiday': 'holiday',
                        'sick': 'sick',
                        'permit': 'permit',
                        'parental': 'parental'
                    };
                    const leave: DayInfo['leave'] = { 
                        type: leaveTypeMap[day.leave_type] || 'holiday' 
                    };
                    newDayInfo[dateKey] = { ...currentInfo, leave };
                } else if (day.day_type === 'rest') {
                    // Handle rest days
                    const currentInfo = newDayInfo[dateKey] || {};
                    newDayInfo[dateKey] = { ...currentInfo, shift: 'rest' };
                } else if (day.day_type === 'absence') {
                    if (day.status_code) {
                        const currentInfo = newDayInfo[dateKey] || {};
                        // Clean up status code to match 'code-X' format if possible, or use raw
                        const codeStr = String(day.status_code).trim();
                        const leave: DayInfo['leave'] = { type: `code-${codeStr}` };
                        
                        if (day.credited_hours) {
                            const [h, m] = day.credited_hours.split(':').map(Number);
                            if (!isNaN(h)) {
                                leave.hours = h + ((m || 0) / 60);
                            }
                        }
                        newDayInfo[dateKey] = { ...currentInfo, leave };
                    }
                }
            } catch (e) {
                console.error(`Skipping invalid day data during import processing:`, day, e);
            }
        });

        // Merge imported data with existing data and save to database
        (async () => {
            if (!session) {
                showToast("Devi essere autenticato per importare dati", 'error');
                return;
            }

            try {
                // Salvataggio dati nel database
                
                // Save time logs to database
                for (const [dateKey, logs] of Object.entries(newLogs)) {
                    for (const log of logs) {
                        const { error } = await supabase.from('time_logs').insert({ 
                            timestamp: log.timestamp, 
                            type: log.type 
                        });
                        if (error) {
                            console.error(`Errore salvare timbratura ${dateKey}:`, error);
                        }
                    }
                }

                // Save day info to database
                for (const [dateKey, info] of Object.entries(newDayInfo)) {
                    const { error } = await supabase.from('day_info').upsert({ 
                        date: dateKey, 
                        info: info 
                    }, { onConflict: 'user_id,date' });
                    if (error) {
                        console.error(`Errore salvare info giorno ${dateKey}:`, error);
                    }
                }

                // Save manual overtime to database
                for (const [dateKey, overtimes] of Object.entries(newManualOvertime)) {
                    for (const overtime of overtimes) {
                        const { error } = await supabase.from('manual_overtime').insert({ 
                            date: dateKey, 
                            entry: overtime 
                        });
                        if (error) {
                            console.error(`Errore salvare straordinario ${dateKey}:`, error);
                        }
                    }
                }

                // Update local state after successful database save
                setAllLogs(prev => ({ ...prev, ...newLogs }));
                handleSetAllDayInfo({ ...allDayInfo, ...newDayInfo });
                setAllManualOvertime(prev => ({ ...prev, ...newManualOvertime }));

                // Calcola automaticamente i buoni pasto per ogni giorno importato con timbrature
                for (const [dateKey, logs] of Object.entries(newLogs)) {
                    if (logs.length > 0) {
                        await autoCheckMealVoucher(dateKey, logs);
                    }
                }

                showToast("Dati importati e salvati con successo!");
            } catch (error) {
                console.error("Errore durante il salvataggio:", error);
                showToast("Errore durante il salvataggio dei dati", 'error');
            }
        })();
    };

    // Helper function per auto-calcolo e salvataggio buono pasto
    const autoCheckMealVoucher = async (dateKey: string, entries: TimeEntry[]) => {
        if (!session) return;
        
        const { calculateMealVoucherEligibility } = await import('./utils/mealVoucherUtils');
        const isEligible = calculateMealVoucherEligibility(entries);
        
        // Se è eligibile e non esiste già un voucher manuale, salvalo automaticamente
        const existingVoucher = allMealVouchers[dateKey];
        if (isEligible && !existingVoucher?.manual) {
            const { error: voucherError } = await supabase
                .from('meal_vouchers')
                .upsert({
                    user_id: session.user.id,
                    date: dateKey,
                    earned: true,
                    manual: false,
                    note: 'Calcolato automaticamente'
                }, {
                    onConflict: 'user_id,date'
                });
            
            if (!voucherError) {
                setAllMealVouchers(prev => ({
                    ...prev,
                    [dateKey]: {
                        id: prev[dateKey]?.id || '',
                        date: dateKey,
                        earned: true,
                        manual: false,
                        note: 'Calcolato automaticamente'
                    }
                }));
            }
        } else if (!isEligible && existingVoucher && !existingVoucher.manual) {
            // Se non è più eligibile e il voucher era automatico, rimuovilo
            await supabase.from('meal_vouchers').delete().eq('user_id', session.user.id).eq('date', dateKey);
            setAllMealVouchers(prev => {
                const updated = { ...prev };
                delete updated[dateKey];
                return updated;
            });
        }
    };

    const handleToggle = async () => {
        if (!session) return;
        
        // Protezione da chiamate concorrenti
        if (isTogglingRef) {
            showToast("Timbratura già in corso, attendere...", 'error');
            return;
        }
        
        setIsTogglingRef(true);
        
        try {
            const now = new Date();
            const todayKey = formatDateKey(now);
            const lastEntry = (allLogs[todayKey] || []).slice(-1)[0];
            const newType = (!lastEntry || lastEntry.type === 'out') ? 'in' : 'out';

            // Protezione anti-duplicati: verifica se esiste già una timbratura recente (< 5 secondi)
            const recentEntries = (allLogs[todayKey] || []).filter(entry => {
                const diff = Math.abs(now.getTime() - entry.timestamp.getTime());
                return diff < 5000 && entry.type === newType;
            });
            
            if (recentEntries.length > 0) {
                showToast("Timbratura già registrata pochi secondi fa!", 'error');
                return;
            }

            const { data, error } = await supabase.from('time_logs').insert({ timestamp: now, type: newType }).select().single();
            
            if (error || !data) {
                if (error) showToast(`Errore nella timbratura: ${error.message}`, 'error');
                return;
            }

            setAllLogs(prev => {
                const updated = { ...prev };
                if (!updated[todayKey]) updated[todayKey] = [];
                
                // CRITICAL: Verifica che l'ID non esista già (prevenzione duplicati da race condition)
                const alreadyExists = updated[todayKey].some(entry => entry.id === data.id);
                if (!alreadyExists) {
                    updated[todayKey].push({ id: data.id, timestamp: new Date(data.timestamp), type: data.type as 'in' | 'out' });
                }
                
                return updated;
            });
            
            // Auto-calcolo buono pasto dopo timbratura di uscita
            if (newType === 'out') {
                const updatedEntries = [...(allLogs[todayKey] || []), { id: data.id, timestamp: new Date(data.timestamp), type: 'out' as const }];
                autoCheckMealVoucher(todayKey, updatedEntries);
            }
            
            showToast(`Timbratura di ${newType === 'in' ? 'entrata' : 'uscita'} registrata!`);
        } finally {
            setTimeout(() => setIsTogglingRef(false), 1000);
        }
    };
    
    // --- NFC/SHORTCUTS URL AUTOMATION ---
    useEffect(() => {
        if (!session || loading) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const nfcTrigger = urlParams.get('nfc'); // Nuovo sistema intelligente: ?nfc=true
        const action = urlParams.get('action'); // Vecchio sistema retrocompatibile: ?action=clock-in/out
        
        // Sistema intelligente: se arriva ?nfc=true, rileva automaticamente lo stato e timbra
        if (nfcTrigger === 'true') {
            // Execute toggle directly
            (async () => {
                const today = new Date();
                const todayKey = formatDateKey(today);
                const now = new Date();
                
                // IMPORTANTE: Interroga il database direttamente per avere lo stato aggiornato in tempo reale
                const startOfDay = new Date(today);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(today);
                endOfDay.setHours(23, 59, 59, 999);
                
                const { data: todayLogs, error: fetchError } = await supabase
                    .from('time_logs')
                    .select('*')
                    .gte('timestamp', startOfDay.toISOString())
                    .lte('timestamp', endOfDay.toISOString())
                    .order('timestamp', { ascending: true });
                
                if (fetchError) {
                    showToast(`Errore nel recupero stato: ${fetchError.message}`, 'error');
                    return;
                }
                
                // Determina lo stato corrente dall'ultima entry del database
                const lastEntry = todayLogs && todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null;
                const currentStatus = !lastEntry || lastEntry.type === 'out' ? WorkStatus.ClockedOut : WorkStatus.ClockedIn;
                
                // Determina automaticamente l'azione in base allo stato corrente
                const autoAction = currentStatus === WorkStatus.ClockedOut ? 'clock-in' : 'clock-out';
                const newType = autoAction === 'clock-in' ? 'in' : 'out';
                
                // Protezione anti-duplicati: verifica se esiste già una timbratura recente (< 10 secondi)
                const recentEntries = todayLogs?.filter(entry => {
                    const entryTime = new Date(entry.timestamp).getTime();
                    const diff = Math.abs(now.getTime() - entryTime);
                    return diff < 10000 && entry.type === newType;
                }) || [];
                
                if (recentEntries.length > 0) {
                    showToast("Timbratura già registrata!", 'error');
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                }
                
                const { data, error } = await supabase.from('time_logs').insert({ timestamp: now, type: newType }).select().single();
                if (error || !data) {
                    if (error) showToast(`Errore nella timbratura: ${error.message}`, 'error');
                    return;
                }
                
                setAllLogs(prev => ({ ...prev, [todayKey]: [...(prev[todayKey] || []), {id: data.id, timestamp: new Date(data.timestamp), type: data.type as 'in' | 'out'}] }));
                
                // Show notification if supported (non disponibile su Safari iOS)
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Timbratura Registrata', {
                        body: autoAction === 'clock-in' ? 'Entrata registrata ✅' : 'Uscita registrata ✅',
                        icon: '/vite.svg',
                        badge: '/vite.svg'
                    });
                } else if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                }
                
                // Feedback visivo + vibrazione (funziona anche su Safari iOS)
                showToast(autoAction === 'clock-in' ? 'Entrata registrata tramite NFC ✅' : 'Uscita registrata tramite NFC ✅');
                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]); // Doppia vibrazione per conferma
                }
            })();
            
            // Clean URL to prevent re-triggering on page refresh
            window.history.replaceState({}, '', window.location.pathname);
        }
        // Supporto retrocompatibile per vecchio sistema con parametri espliciti
        else if (action === 'clock-in' || action === 'clock-out') {
            const today = new Date();
            const todayKey = formatDateKey(today);
            
            // Determine current work status from today's logs
            const todayEntries = allLogs[todayKey] || [];
            const sortedEntries = [...todayEntries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const lastEntry = sortedEntries[sortedEntries.length - 1];
            const currentStatus = !lastEntry || lastEntry.type === 'out' ? WorkStatus.ClockedOut : WorkStatus.ClockedIn;
            
            // Determine if we should toggle
            const shouldToggle = (action === 'clock-in' && currentStatus === WorkStatus.ClockedOut) ||
                                 (action === 'clock-out' && currentStatus === WorkStatus.ClockedIn);
            
            if (shouldToggle) {
                // Execute toggle directly
                (async () => {
                    const now = new Date();
                    const newType = action === 'clock-in' ? 'in' : 'out';
                    
                    // Protezione anti-duplicati: verifica se esiste già una timbratura recente (< 10 secondi per shortcuts)
                    const recentEntries = todayEntries.filter(entry => {
                        const diff = Math.abs(now.getTime() - entry.timestamp.getTime());
                        return diff < 10000 && entry.type === newType; // 10 secondi per shortcuts
                    });
                    
                    if (recentEntries.length > 0) {
                        showToast("Timbratura già registrata!", 'error');
                        window.history.replaceState({}, document.title, window.location.pathname);
                        return;
                    }
                    
                    const { data, error } = await supabase.from('time_logs').insert({ timestamp: now, type: newType }).select().single();
                    if (error || !data) {
                        if (error) showToast(`Errore nella timbratura: ${error.message}`, 'error');
                        return;
                    }
                    
                    setAllLogs(prev => ({ ...prev, [todayKey]: [...(prev[todayKey] || []), {id: data.id, timestamp: new Date(data.timestamp), type: data.type as 'in' | 'out'}] }));
                    
                    // Show notification if supported (non disponibile su Safari iOS)
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Timbratura Registrata', {
                            body: action === 'clock-in' ? 'Entrata registrata ✅' : 'Uscita registrata ✅',
                            icon: '/vite.svg',
                            badge: '/vite.svg'
                        });
                    } else if ('Notification' in window && Notification.permission === 'default') {
                        Notification.requestPermission();
                    }
                    
                    // Feedback visivo + vibrazione (funziona anche su Safari iOS)
                    showToast(action === 'clock-in' ? 'Entrata registrata tramite NFC ✅' : 'Uscita registrata tramite NFC ✅');
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]); // Doppia vibrazione per conferma
                    }
                })();
            }
            
            // Clean URL to prevent re-triggering on page refresh
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [session, loading, allLogs, showToast]);


    const handleEditEntry = async (dateKey: string, entryId: string, newTimestamp: Date, newType: 'in' | 'out') => {
        if (!session) return;
        const { error } = await supabase.from('time_logs').update({ timestamp: newTimestamp, type: newType }).eq('id', entryId);
        if (error) {
            showToast(`Errore nell'aggiornamento: ${error.message}`, 'error');
            return;
        }
        
        const newDateKey = formatDateKey(newTimestamp);
        
        setAllLogs(prev => {
            const updated = { ...prev };
            const entryIndex = updated[dateKey]?.findIndex(e => e.id === entryId);
            if (entryIndex === -1 || typeof entryIndex === 'undefined') return prev;
            
            const entry = updated[dateKey][entryIndex];

            updated[dateKey].splice(entryIndex, 1);
            if (updated[dateKey].length === 0) delete updated[dateKey];
            
            if (!updated[newDateKey]) updated[newDateKey] = [];
            updated[newDateKey].push({ ...entry, timestamp: newTimestamp, type: newType });
            updated[newDateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            return updated;
        });
        
        // Auto-calcolo buono pasto per il giorno modificato
        setTimeout(() => {
            const updatedEntries = allLogs[newDateKey] || [];
            if (updatedEntries.length > 0) {
                autoCheckMealVoucher(newDateKey, updatedEntries);
            }
            // Se la data è cambiata, ricalcola anche il giorno originale
            if (dateKey !== newDateKey && allLogs[dateKey]) {
                autoCheckMealVoucher(dateKey, allLogs[dateKey]);
            }
        }, 100);
        
        showToast("Timbratura aggiornata.");
    };

    const handleDeleteEntry = async (dateKey: string, entryId: string) => {
        if (!session) return;
        const { error } = await supabase.from('time_logs').delete().eq('id', entryId);
        if (error) { showToast(`Errore nell'eliminazione: ${error.message}`, 'error'); return; }
        setAllLogs(prev => {
            const updated = { ...prev };
            updated[dateKey] = updated[dateKey].filter(e => e.id !== entryId);
            if (updated[dateKey].length === 0) delete updated[dateKey];
            return updated;
        });
        
        // Auto-calcolo buono pasto dopo eliminazione
        setTimeout(() => {
            const remainingEntries = allLogs[dateKey]?.filter(e => e.id !== entryId) || [];
            if (remainingEntries.length > 0) {
                autoCheckMealVoucher(dateKey, remainingEntries);
            } else {
                // Se non ci sono più timbrature, rimuovi il voucher automatico
                const existingVoucher = allMealVouchers[dateKey];
                if (existingVoucher && !existingVoucher.manual) {
                    supabase.from('meal_vouchers').delete().eq('user_id', session.user.id).eq('date', dateKey);
                    setAllMealVouchers(prev => {
                        const updated = { ...prev };
                        delete updated[dateKey];
                        return updated;
                    });
                }
            }
        }, 100);
        
        showToast("Timbratura eliminata.", 'error');
    };
    
    const handleAddEntry = async (newTimestamp: Date, type: 'in' | 'out') => {
        if (!session) return;
        
        // Protezione da chiamate concorrenti
        if (isAddingEntryRef) {
            showToast("Aggiunta timbratura già in corso, attendere...", 'error');
            return;
        }
        
        setIsAddingEntryRef(true);
        
        try {
            const dateKey = formatDateKey(newTimestamp);
            const timestampStr = newTimestamp.toISOString();
            
            // Check if this exact entry already exists to prevent duplicates
            const existingEntries = allLogs[dateKey] || [];
            const isDuplicate = existingEntries.some(entry => 
                entry.timestamp.toISOString() === timestampStr && entry.type === type
            );
            
            if (isDuplicate) {
                showToast("Questa timbratura esiste già!", 'error');
                setAddEntryModalDate(null);
                return;
            }
            
            const { data, error } = await supabase.from('time_logs').insert({ timestamp: newTimestamp, type }).select().single();
            
            if (error || !data) { 
                if (error) showToast(`Errore: ${error.message}`, 'error');
                return; 
            }
            
            setAllLogs(prev => {
                const updated = { ...prev };
                if (!updated[dateKey]) updated[dateKey] = [];
                
                // CRITICAL: Verifica che l'ID non esista già (prevenzione duplicati da race condition)
                const alreadyExists = updated[dateKey].some(entry => entry.id === data.id);
                if (!alreadyExists) {
                    updated[dateKey].push({ id: data.id, timestamp: new Date(data.timestamp), type: data.type as 'in' | 'out' });
                    updated[dateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                }
                
                return updated;
            });
            
            // Auto-calcolo buono pasto dopo aggiunta
            setTimeout(() => {
                const updatedEntries = [...(allLogs[dateKey] || []), { id: data.id, timestamp: new Date(data.timestamp), type: data.type as 'in' | 'out' }];
                autoCheckMealVoucher(dateKey, updatedEntries);
            }, 100);
            
            setAddEntryModalDate(null);
            showToast("Timbratura manuale aggiunta.");
        } finally {
            setTimeout(() => setIsAddingEntryRef(false), 500);
        }
    };

    const handleAddOvertime = async (dateKey: string, durationMs: number, type: ManualOvertimeType, note: string) => {
        if (!session) return;
        const newEntry: Omit<ManualOvertimeEntry, 'id'> = { durationMs, type, note };
        const { data, error } = await supabase.from('manual_overtime').insert({ date: dateKey, entry: newEntry }).select().single();
    if (error || !data) { if (error) showToast(`Errore: ${error.message}`, 'error'); return; }
        setAllManualOvertime(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), { id: data.id, ...data.entry }] }));
        setAddManualEntryModalDate(null);
        showToast("Voce manuale aggiunta.");
    };

    const handleDeleteManualOvertime = async (dateKey: string, entryId: string) => {
        if (!session) return;
        const { error } = await supabase.from('manual_overtime').delete().eq('id', entryId);
        if (error) { showToast(`Errore: ${error.message}`, 'error'); return; }
        setAllManualOvertime(prev => {
            const updated = { ...prev };
            updated[dateKey] = updated[dateKey].filter(e => e.id !== entryId);
            if (updated[dateKey].length === 0) delete updated[dateKey];
            return updated;
        });
        showToast("Voce manuale eliminata.", "error");
    };

    const handleSaveMealVoucher = async (dateKey: string, earned: boolean, note: string) => {
        if (!session) return;
        
        // Upsert: inserisce o aggiorna se esiste già
        const { data, error } = await supabase
            .from('meal_vouchers')
            .upsert({ 
                user_id: session.user.id,
                date: dateKey, 
                earned, 
                manual: true,
                note 
            }, { onConflict: 'user_id,date' })
            .select()
            .single();
        
        if (error || !data) { 
            if (error) showToast(`Errore: ${error.message}`, 'error'); 
            return; 
        }
        
        setAllMealVouchers(prev => ({
            ...prev,
            [dateKey]: { id: data.id, date: data.date, earned: data.earned, manual: data.manual, note: data.note || '' }
        }));
        setMealVoucherModalDate(null);
        showToast(earned ? "✓ Buono pasto confermato!" : "Buono pasto rimosso.");
    };

    const handleSetAllDayInfo = async (newAllDayInfo: AllDayInfo) => {
        if (!session) return;
        const oldDayInfo = { ...allDayInfo };
        setAllDayInfo(newAllDayInfo);

        const upsertData = Object.entries(newAllDayInfo).map(([date, info]) => ({ date, info, user_id: session.user.id }));
        const toDelete = Object.keys(oldDayInfo).filter(date => !newAllDayInfo[date]);

        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase.from('day_info').delete().in('date', toDelete);
            if (deleteError) { showToast(`Errore: ${deleteError.message}`, 'error'); setAllDayInfo(oldDayInfo); return; }
        }
        if (upsertData.length > 0) {
            const { error: upsertError } = await supabase.from('day_info').upsert(upsertData, { onConflict: 'date, user_id' });
            if (upsertError) { showToast(`Errore: ${upsertError.message}`, 'error'); setAllDayInfo(oldDayInfo); return; }
        }
        showToast("Pianificazione salvata.");
    };
    
    const handleSetDayInfoForRange = useCallback(async (start: string, end: string, action: { type: 'shift' | 'leave' | 'clear', value: ShiftType | LeaveType | null }) => {
        let newAllDayInfo = { ...allDayInfo };
        let currentDate = parseDateKey(start);
        while (currentDate <= parseDateKey(end)) {
            const dateKey = formatDateKey(currentDate);
            const currentInfo: DayInfo = newAllDayInfo[dateKey] ? {...newAllDayInfo[dateKey]} : {};
            if (action.type === 'clear') {
                delete newAllDayInfo[dateKey];
            } else if (action.type === 'shift' && action.value) {
                newAllDayInfo[dateKey] = { ...currentInfo, shift: action.value as ShiftType, leave: undefined };
            } else if (action.type === 'leave' && action.value) {
                newAllDayInfo[dateKey] = { ...currentInfo, leave: { type: action.value as LeaveType }, shift: undefined };
            }
            currentDate = addDays(currentDate, 1);
        }
        await handleSetAllDayInfo(newAllDayInfo);
        showToast('Intervallo di date aggiornato!');
    }, [allDayInfo, showToast]);

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-teal-500"></div></div>;
    }
    if (!session) {
        return <Auth />;
    }
    
    const { workSettings, offerSettings, statusItems, savedRotations, dashboardLayout, widgetVisibility } = settings;

    const renderPage = () => {
        switch(currentPage) {
            case 'dashboard':
                return <DashboardPage 
                    session={session}
                    allLogs={allLogs} allDayInfo={allDayInfo} allManualOvertime={allManualOvertime}
                    allMealVouchers={allMealVouchers}
                    selectedDate={selectedDate} workStatus={workStatus} currentSessionStart={currentSessionStart}
                    currentSessionDuration={currentSessionDuration} workSettings={workSettings}
                    offerSettings={offerSettings} statusItems={statusItems} 
                    smartNotifications={smartNotifications}
                    dashboardLayout={dashboardLayout}
                    widgetVisibility={widgetVisibility} onNavigateToCalendar={() => setCurrentPage('calendar')}
                    onToggle={handleToggle} onOpenQuickLeaveModal={(options) => setQuickLeaveModalOptions(options)}
                    onSetSelectedDate={setSelectedDate}
                    onDismissNotification={(id) => setSmartNotifications(prev => prev.filter(n => n.id !== id))}
                    onEditEntry={(dateKey, index, ts, type) => handleEditEntry(dateKey, allLogs[dateKey][index].id, ts, type)}
                    onDeleteEntry={(dateKey, index) => handleDeleteEntry(dateKey, allLogs[dateKey][index].id)}
                    onOpenAddEntryModal={setAddEntryModalDate}
                    onOpenAddManualEntryModal={setAddManualEntryModalDate}
                    onDeleteManualOvertime={handleDeleteManualOvertime}
                    onOpenAddOvertimeModal={setAddOvertimeModalDate}
                    onOpenMealVoucherModal={setMealVoucherModalDate}
                    onOpenRangePlanner={(options) => setRangePlannerOptions({ isOpen: true, startDate: options?.startDate || selectedDate })}
                />;
            case 'calendar':
                return <CalendarPage 
                    allLogs={allLogs} allDayInfo={allDayInfo} allManualOvertime={allManualOvertime}
                    workSettings={workSettings} statusItems={statusItems} savedRotations={savedRotations}
                    onSetAllDayInfo={handleSetAllDayInfo}
                    onEditEntry={(dateKey, index, ts, type) => handleEditEntry(dateKey, allLogs[dateKey][index].id, ts, type)}
                    onDeleteEntry={(dateKey, index) => handleDeleteEntry(dateKey, allLogs[dateKey][index].id)}
                    onOpenAddEntryModal={setAddEntryModalDate}
                    onOpenAddOvertimeModal={setAddOvertimeModalDate}
                    onDeleteManualOvertime={handleDeleteManualOvertime} onImportData={handleImportData}
                    onOpenQuickLeaveModal={(options) => setQuickLeaveModalOptions(options)}
                    onSetSavedRotations={(r) => setSettings(s => ({ ...s, savedRotations: r }))}
                    onOpenRangePlanner={(options) => setRangePlannerOptions({isOpen: true, startDate: options.startDate})}
                />;
            case 'balances':
                return <BalancesPage 
                    allDayInfo={allDayInfo} 
                    statusItems={statusItems} 
                    allLogs={allLogs} 
                    workSettings={workSettings} 
                    allManualOvertime={allManualOvertime}
                    allMealVouchers={allMealVouchers}
                    onOpenAddOvertimeModal={setAddOvertimeModalDate}
                />;
            case 'settings':
                return <SettingsPage 
                    workSettings={workSettings} offerSettings={offerSettings} themeSettings={settings.themeSettings}
                    dashboardLayout={dashboardLayout}
                    widgetVisibility={widgetVisibility} savedRotations={savedRotations} statusItems={statusItems}
                    allDayInfo={allDayInfo}
                    onSaveWorkSettings={(s) => setSettings(prev => ({...prev, workSettings: s}))}
                    onSaveOfferSettings={(s) => setSettings(prev => ({...prev, offerSettings: s}))}
                    onSaveThemeSettings={(s) => setSettings(prev => ({...prev, themeSettings: s}))}
                    onSaveDashboardLayout={(l) => setSettings(prev => ({...prev, dashboardLayout: l}))}
                    onSaveWidgetVisibility={(v) => setSettings(prev => ({...prev, widgetVisibility: v}))}
                    onSaveSavedRotations={(r) => setSettings(prev => ({...prev, savedRotations: r}))}
                    onSetStatusItems={(i) => setSettings(prev => ({...prev, statusItems: i}))}
                    onShowToast={showToast}
                />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans">
            {showOnboarding && (
                <Onboarding 
                    onComplete={() => {
                        setShowOnboarding(false);
                        localStorage.setItem('onboarding_completed', 'true');
                    }} 
                />
            )}
            <Header currentPage={currentPage} onNavigate={setCurrentPage} onOpenSearch={() => setIsGlobalSearchOpen(true)} />
            <div className="flex-grow overflow-y-auto bg-gray-100 dark:bg-slate-900">
              {renderPage()}
            </div>
            {!showOnboarding && (
                <QuickActionsFAB
                    workStatus={workStatus}
                    onToggleWork={handleToggle}
                    onAddLeave={() => setQuickLeaveModalOptions({ date: new Date() })}
                    onOpenNFC={() => showToast('Apri l\'app Shortcuts e usa il tag NFC!')}
                    onAddNote={() => setAddManualEntryModalDate(new Date())}
                    disabled={loading}
                />
            )}
            {quickLeaveModalOptions && (
                <QuickLeaveModal 
                    date={quickLeaveModalOptions.date} 
                    statusItems={settings.statusItems} 
                    workSettings={settings.workSettings}
                    allDayInfo={allDayInfo}
                    highlightedLeave={quickLeaveModalOptions.highlightedLeave}
                    onClose={() => setQuickLeaveModalOptions(null)}
                    onSetLeave={(date: Date, leaveType: string | null, hours?: number) => {
                        const dateKey = formatDateKey(date);
                        const newAllDayInfo = { ...allDayInfo };
                        const currentInfo = newAllDayInfo[dateKey] || {};
                        if (leaveType === null) { delete newAllDayInfo[dateKey]; } 
                        else { newAllDayInfo[dateKey] = { ...currentInfo, leave: { type: leaveType, hours: hours || 0 }, shift: undefined }; }
                        handleSetAllDayInfo(newAllDayInfo);
                    }}
                    onSetShift={(date: Date, shift: string | null) => {
                        const dateKey = formatDateKey(date);
                        const newAllDayInfo = { ...allDayInfo };
                        const currentInfo = newAllDayInfo[dateKey] || {};
                        if (shift === null) { delete newAllDayInfo[dateKey]; } 
                        else { newAllDayInfo[dateKey] = { ...currentInfo, shift, leave: undefined }; }
                        handleSetAllDayInfo(newAllDayInfo);
                    }}
                    onOpenAddEntryModal={() => { setAddEntryModalDate(quickLeaveModalOptions.date); setQuickLeaveModalOptions(null); }}
                />
            )}
            {addEntryModalDate && <AddTimeEntryModal date={addEntryModalDate} onClose={() => setAddEntryModalDate(null)} onSave={handleAddEntry} />}
            {addManualEntryModalDate && (
                <AddManualEntryModal
                    date={addManualEntryModalDate}
                    statusItems={settings.statusItems}
                    onClose={() => setAddManualEntryModalDate(null)}
                    onSave={handleAddOvertime}
                />
            )}
            {addOvertimeModalDate && (
                <AddOvertimeModal
                    date={addOvertimeModalDate}
                    allLogs={allLogs}
                    allManualOvertime={allManualOvertime}
                    statusItems={settings.statusItems}
                    onClose={() => setAddOvertimeModalDate(null)}
                    onSave={handleAddOvertime}
                    onDelete={handleDeleteManualOvertime}
                />
            )}
            {mealVoucherModalDate && (
                <MealVoucherModal
                    date={mealVoucherModalDate}
                    allLogs={allLogs}
                    onClose={() => setMealVoucherModalDate(null)}
                    onSave={handleSaveMealVoucher}
                />
            )}
            <RangePlannerModal
                isOpen={rangePlannerOptions.isOpen} 
                startDate={rangePlannerOptions.startDate}
                statusItems={statusItems} 
                workSettings={workSettings}
                onClose={() => setRangePlannerOptions({ isOpen: false })}
                onApply={handleSetDayInfoForRange}
            />
            <div className="fixed top-24 right-4 z-[100] w-full max-w-xs space-y-2">
                {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => setToasts(p => p.filter(toast => toast.id !== t.id))} />)}
            </div>
            {session && !isInitializingOffline && (
                <ConnectionStatus onSyncRequest={handleSyncRequest} />
            )}
            {isGlobalSearchOpen && (
                <GlobalSearch
                    allLogs={allLogs}
                    allDayInfo={allDayInfo}
                    allManualOvertime={allManualOvertime}
                    statusItems={settings.statusItems}
                    shifts={settings.workSettings.shifts}
                    onClose={() => setIsGlobalSearchOpen(false)}
                    onSelectDate={(date) => {
                        setSelectedDate(date);
                        setCurrentPage('calendar');
                    }}
                />
            )}
            
            {/* Install PWA Prompt */}
            <InstallPrompt />
        </div>
    );
};

export default App;
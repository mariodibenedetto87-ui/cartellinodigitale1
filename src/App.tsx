import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { WorkStatus, AllTimeLogs, TimeEntry, WorkSettings, AllDayInfo, StatusItem, DashboardLayout, WidgetVisibility, AllManualOvertime, ManualOvertimeType, SavedRotation, ManualOvertimeEntry, DayInfo, LeaveType, ShiftType, OfferSettings } from './types';
import { formatDateKey, formatDuration, isSameDay, addDays, parseDateKey } from './utils/timeUtils';
import { scheduleReminders, requestNotificationPermission, clearScheduledNotifications } from './utils/notificationUtils';
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
import RangePlannerModal from './components/RangePlannerModal';

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

    // GLOBAL APP STATE
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [allLogs, setAllLogs] = useState<AllTimeLogs>({});
    const [allDayInfo, setAllDayInfo] = useState<AllDayInfo>({});
    const [allManualOvertime, setAllManualOvertime] = useState<AllManualOvertime>({});
    const [workStatus, setWorkStatus] = useState<WorkStatus>(WorkStatus.ClockedOut);
    const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
    const [currentSessionDuration, setCurrentSessionDuration] = useState('00:00:00');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    // All settings are now grouped into one state for easier Supabase management
    const [settings, setSettings] = useState<{
        workSettings: WorkSettings;
        offerSettings: OfferSettings;
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
        statusItems: defaultStatusItems,
        savedRotations: [],
        dashboardLayout: {
            main: ['nfcScanner', 'summary'],
            sidebar: ['plannerCard', 'offerCard', 'balancesSummary', 'monthlySummary', 'weeklySummary', 'weeklyHoursChart']
        },
        widgetVisibility: {
            nfcScanner: true, summary: true, plannerCard: true, offerCard: true,
            balancesSummary: true, monthlySummary: true, weeklySummary: true,
            weeklyHoursChart: false,
        }
    });

    // MODAL STATES
    const [quickLeaveModalOptions, setQuickLeaveModalOptions] = useState<{date: Date; highlightedLeave?: LeaveType} | null>(null);
    const [addEntryModalDate, setAddEntryModalDate] = useState<Date | null>(null);
    const [addManualEntryModalDate, setAddManualEntryModalDate] = useState<Date | null>(null);
    const [rangePlannerOptions, setRangePlannerOptions] = useState<{isOpen: boolean, startDate?: Date}>({isOpen: false});

    // TOAST HANDLER
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // --- DATA FETCHING & INITIALIZATION ---
    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
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

                        return {
                            workSettings: { 
                                ...prevSettings.workSettings, 
                                ...settingsData.work_settings,
                                shifts: mergedShifts 
                            },
                            offerSettings: { ...prevSettings.offerSettings, ...settingsData.offer_settings },
                            dashboardLayout: { ...prevSettings.dashboardLayout, ...settingsData.dashboard_layout },
                            widgetVisibility: { ...prevSettings.widgetVisibility, ...settingsData.widget_visibility },
                            statusItems: settingsData.status_items || prevSettings.statusItems,
                            savedRotations: settingsData.saved_rotations || prevSettings.savedRotations,
                        };
                    });
                } else if (settingsError && settingsError.code === 'PGRST116') {
                    const { error: insertError } = await supabase.from('user_settings').insert({ user_id: session.user.id, ...settings });
                    if (insertError) showToast(`Errore nel creare le impostazioni: ${insertError.message}`, 'error');
                }

                const { data: logsData, error: logsError } = await supabase.from('time_logs').select('id, timestamp, type');
                if (logsData) {
                    const logs: AllTimeLogs = {};
                    logsData.forEach(log => {
                        const dateKey = formatDateKey(new Date(log.timestamp));
                        if (!logs[dateKey]) logs[dateKey] = [];
                        logs[dateKey].push({ id: log.id, timestamp: new Date(log.timestamp), type: log.type as 'in' | 'out' });
                    });
                    setAllLogs(logs);
                } else if (logsError) showToast(`Errore nel caricare le timbrature: ${logsError.message}`, 'error');

                const { data: dayInfoData, error: dayInfoError } = await supabase.from('day_info').select('date, info');
                if (dayInfoData) {
                    const dayInfo: AllDayInfo = {};
                    dayInfoData.forEach(d => { dayInfo[d.date] = d.info; });
                    setAllDayInfo(dayInfo);
                } else if(dayInfoError) showToast(`Errore nel caricare la pianificazione: ${dayInfoError.message}`, 'error');

                const { data: overtimeData, error: overtimeError } = await supabase.from('manual_overtime').select('id, date, entry');
                if (overtimeData) {
                    const overtime: AllManualOvertime = {};
                    overtimeData.forEach(o => {
                        if (!overtime[o.date]) overtime[o.date] = [];
                        overtime[o.date].push({ id: o.id, ...o.entry });
                    });
                    setAllManualOvertime(overtime);
                } else if(overtimeError) showToast(`Errore nel caricare lo straordinario: ${overtimeError.message}`, 'error');

                setLoading(false);
            };
            fetchData();
        } else {
            setAllLogs({});
            setAllDayInfo({});
            setAllManualOvertime({});
        }
    }, [session, showToast]);

    // --- DATA PERSISTENCE ---
    const debouncedSaveSettings = useCallback(debounce(async (newSettings) => {
        if (!session) return;
        const { error } = await supabase.from('user_settings').update({
            work_settings: newSettings.workSettings,
            offer_settings: newSettings.offerSettings,
            dashboard_layout: newSettings.dashboardLayout,
            widget_visibility: newSettings.widgetVisibility,
            status_items: newSettings.statusItems,
            saved_rotations: newSettings.savedRotations,
        }).eq('user_id', session.user.id);
        if (error) showToast(`Salvataggio impostazioni fallito: ${error.message}`, 'error');
        else showToast('Impostazioni salvate nel cloud!');
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

        // Merge imported data with existing data and save
        setAllLogs(prev => ({ ...prev, ...newLogs }));
        handleSetAllDayInfo({ ...allDayInfo, ...newDayInfo });
        setAllManualOvertime(prev => ({ ...prev, ...newManualOvertime }));

        showToast("Dati importati e uniti con successo!");
    };


    const handleToggle = async () => {
        if (!session) return;
        const now = new Date();
        const todayKey = formatDateKey(now);
        const lastEntry = (allLogs[todayKey] || []).slice(-1)[0];
        const newType = (!lastEntry || lastEntry.type === 'out') ? 'in' : 'out';

        const { data, error } = await supabase.from('time_logs').insert({ timestamp: now, type: newType }).select().single();
        if (error || !data) {
            showToast(`Errore nella timbratura: ${error.message}`, 'error');
            return;
        }

        setAllLogs(prev => ({ ...prev, [todayKey]: [...(prev[todayKey] || []), {id: data.id, timestamp: new Date(data.timestamp), type: data.type as 'in' | 'out'}] }));
        showToast(`Timbratura di ${newType === 'in' ? 'entrata' : 'uscita'} registrata!`);
    };

    const handleEditEntry = async (dateKey: string, entryId: string, newTimestamp: Date, newType: 'in' | 'out') => {
        if (!session) return;
        const { error } = await supabase.from('time_logs').update({ timestamp: newTimestamp, type: newType }).eq('id', entryId);
        if (error) {
            showToast(`Errore nell'aggiornamento: ${error.message}`, 'error');
            return;
        }
        setAllLogs(prev => {
            const updated = { ...prev };
            const entryIndex = updated[dateKey]?.findIndex(e => e.id === entryId);
            if (entryIndex === -1 || typeof entryIndex === 'undefined') return prev;
            
            const entry = updated[dateKey][entryIndex];
            const newDateKey = formatDateKey(newTimestamp);

            updated[dateKey].splice(entryIndex, 1);
            if (updated[dateKey].length === 0) delete updated[dateKey];
            
            if (!updated[newDateKey]) updated[newDateKey] = [];
            updated[newDateKey].push({ ...entry, timestamp: newTimestamp, type: newType });
            updated[newDateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            return updated;
        });
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
        showToast("Timbratura eliminata.", 'error');
    };
    
    const handleAddEntry = async (newTimestamp: Date, type: 'in' | 'out') => {
        if (!session) return;
        const { data, error } = await supabase.from('time_logs').insert({ timestamp: newTimestamp, type }).select().single();
        if (error || !data) { showToast(`Errore: ${error.message}`, 'error'); return; }
        
        const dateKey = formatDateKey(newTimestamp);
        setAllLogs(prev => {
            const updated = { ...prev };
            if (!updated[dateKey]) updated[dateKey] = [];
            updated[dateKey].push({ id: data.id, timestamp: new Date(data.timestamp), type: data.type  as 'in' | 'out' });
            updated[dateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            return updated;
        });
        setAddEntryModalDate(null);
        showToast("Timbratura manuale aggiunta.");
    };

    const handleAddOvertime = async (dateKey: string, durationMs: number, type: ManualOvertimeType, note: string) => {
        if (!session) return;
        const newEntry: Omit<ManualOvertimeEntry, 'id'> = { durationMs, type, note };
        const { data, error } = await supabase.from('manual_overtime').insert({ date: dateKey, entry: newEntry }).select().single();
        if (error || !data) { showToast(`Errore: ${error.message}`, 'error'); return; }
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
                    allLogs={allLogs} allDayInfo={allDayInfo} allManualOvertime={allManualOvertime}
                    selectedDate={selectedDate} workStatus={workStatus} currentSessionStart={currentSessionStart}
                    currentSessionDuration={currentSessionDuration} workSettings={workSettings}
                    offerSettings={offerSettings} statusItems={statusItems} dashboardLayout={dashboardLayout}
                    widgetVisibility={widgetVisibility} onNavigateToCalendar={() => setCurrentPage('calendar')}
                    onToggle={handleToggle} onOpenQuickLeaveModal={(options) => setQuickLeaveModalOptions(options)}
                    onSetSelectedDate={setSelectedDate} 
                    onEditEntry={(dateKey, index, ts, type) => handleEditEntry(dateKey, allLogs[dateKey][index].id, ts, type)}
                    onDeleteEntry={(dateKey, index) => handleDeleteEntry(dateKey, allLogs[dateKey][index].id)}
                    onOpenAddEntryModal={setAddEntryModalDate} onOpenAddManualEntryModal={setAddManualEntryModalDate}
                    onDeleteManualOvertime={handleDeleteManualOvertime} 
                    onOpenRangePlanner={(options) => setRangePlannerOptions({ isOpen: true, startDate: options?.startDate || selectedDate })}
                />;
            case 'calendar':
                return <CalendarPage 
                    allLogs={allLogs} allDayInfo={allDayInfo} allManualOvertime={allManualOvertime}
                    workSettings={workSettings} statusItems={statusItems} savedRotations={savedRotations}
                    onSetAllDayInfo={handleSetAllDayInfo}
                    onEditEntry={(dateKey, index, ts, type) => handleEditEntry(dateKey, allLogs[dateKey][index].id, ts, type)}
                    onDeleteEntry={(dateKey, index) => handleDeleteEntry(dateKey, allLogs[dateKey][index].id)}
                    onOpenAddEntryModal={setAddEntryModalDate} onOpenAddManualEntryModal={setAddManualEntryModalDate}
                    onDeleteManualOvertime={handleDeleteManualOvertime} onImportData={handleImportData}
                    onOpenQuickLeaveModal={(options) => setQuickLeaveModalOptions(options)}
                    onSetSavedRotations={(r) => setSettings(s => ({ ...s, savedRotations: r }))}
                    onOpenRangePlanner={(options) => setRangePlannerOptions({isOpen: true, startDate: options.startDate})}
                />;
            case 'balances':
                return <BalancesPage allDayInfo={allDayInfo} statusItems={statusItems} allLogs={allLogs} workSettings={workSettings} allManualOvertime={allManualOvertime} />;
            case 'settings':
                return <SettingsPage 
                    workSettings={workSettings} offerSettings={offerSettings} dashboardLayout={dashboardLayout}
                    widgetVisibility={widgetVisibility} savedRotations={savedRotations} statusItems={statusItems}
                    allDayInfo={allDayInfo}
                    onSaveWorkSettings={(s) => setSettings(prev => ({...prev, workSettings: s}))}
                    onSaveOfferSettings={(s) => setSettings(prev => ({...prev, offerSettings: s}))}
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
            <Header currentPage={currentPage} onNavigate={setCurrentPage} />
            <div className="flex-grow overflow-y-auto bg-gray-100 dark:bg-slate-900">
              {renderPage()}
            </div>
            {quickLeaveModalOptions && (
                <QuickLeaveModal 
                    date={quickLeaveModalOptions.date} statusItems={statusItems} workSettings={workSettings}
                    highlightedLeave={quickLeaveModalOptions.highlightedLeave}
                    onClose={() => setQuickLeaveModalOptions(null)}
                    onSetLeave={(date, leaveType, hours) => {
                        const dateKey = formatDateKey(date);
                        const newAllDayInfo = { ...allDayInfo };
                        const currentInfo = newAllDayInfo[dateKey] || {};
                        if (leaveType === null) { delete newAllDayInfo[dateKey]; } 
                        else { newAllDayInfo[dateKey] = { ...currentInfo, leave: { type: leaveType, hours }, shift: undefined }; }
                        handleSetAllDayInfo(newAllDayInfo);
                    }}
                    onSetShift={(date, shift) => {
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
        </div>
    );
};

export default App;
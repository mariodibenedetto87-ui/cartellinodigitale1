
import React, { useState, useEffect, useCallback } from 'react';
import { WorkStatus, AllTimeLogs, TimeEntry, WorkSettings, AllDayInfo, LeaveEntitlements, CustomLeaveType, LeaveType, ShiftType, DayInfo, OfferSettings, StatusItem, DashboardLayout, WidgetVisibility, AllManualOvertime, ManualOvertimeType, SavedRotation, ManualOvertimeEntry } from './types';
import { formatDateKey, formatDuration, isSameDay, addDays, parseDateKey } from './utils/timeUtils';
import { scheduleReminders, requestNotificationPermission, clearScheduledNotifications } from './utils/notificationUtils';
import { defaultStatusItems } from './data/statusItems';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './components/SettingsPage';
import BalancesPage from './pages/BalancesPage';
import QuickLeaveModal from './components/QuickLeaveModal';
import Toast from './components/Toast';
import AddTimeEntryModal from './components/AddTimeEntryModal';
import AddOvertimeModal from './components/AddOvertimeModal';
import RangePlannerModal from './components/RangePlannerModal';

type Page = 'dashboard' | 'calendar' | 'settings' | 'balances';
type ToastMessage = { id: number; message: string; type: 'success' | 'error'; };

const App: React.FC = () => {
    // STATE MANAGEMENT
    const [currentPage, setCurrentPage] = useState<Page>('balances');
    const [allLogs, setAllLogs] = useState<AllTimeLogs>(() => {
        const saved = localStorage.getItem('allTimeLogs');
        return saved ? JSON.parse(saved, (key, value) => key === 'timestamp' ? new Date(value) : value) : {};
    });
    const [allDayInfo, setAllDayInfo] = useState<AllDayInfo>(() => JSON.parse(localStorage.getItem('allDayInfo') || '{}'));
    const [allManualOvertime, setAllManualOvertime] = useState<AllManualOvertime>(() => {
        const saved = localStorage.getItem('allManualOvertime');
        return saved ? JSON.parse(saved) : {};
    });
    const [workStatus, setWorkStatus] = useState<WorkStatus>(WorkStatus.ClockedOut);
    const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
    const [currentSessionDuration, setCurrentSessionDuration] = useState('00:00:00');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    // Default settings can be adjusted here
    const [workSettings, setWorkSettings] = useState<WorkSettings>(() => {
        const saved = localStorage.getItem('workSettings');
        const defaults: WorkSettings = {
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
                { id: 'morning', name: 'Mattina', startHour: 8, endHour: 14, textColor: 'text-amber-800 dark:text-amber-200', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
                { id: 'afternoon', name: 'Pomeriggio', startHour: 16, endHour: 22, textColor: 'text-indigo-800 dark:text-indigo-200', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
                { id: 'rest', name: 'Riposo', startHour: null, endHour: null, textColor: 'text-slate-800 dark:text-slate-200', bgColor: 'bg-slate-200 dark:bg-slate-700/50' },
            ],
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    const [offerSettings, setOfferSettings] = useState<OfferSettings>(() => {
        const saved = localStorage.getItem('offerSettings');
        return saved ? JSON.parse(saved) : {
            title: '',
            description: '',
            imageUrl: ''
        };
    });
    
    const [statusItems, setStatusItems] = useState<StatusItem[]>(() => {
        const saved = localStorage.getItem('statusItems');
        return saved ? JSON.parse(saved) : defaultStatusItems;
    });

    const [savedRotations, setSavedRotations] = useState<SavedRotation[]>(() => {
        const saved = localStorage.getItem('savedRotations');
        return saved ? JSON.parse(saved) : [];
    });

    const [quickLeaveModalOptions, setQuickLeaveModalOptions] = useState<{date: Date; highlightedLeave?: LeaveType} | null>(null);
    const [addEntryModalDate, setAddEntryModalDate] = useState<Date | null>(null);
    const [addOvertimeModalDate, setAddOvertimeModalDate] = useState<Date | null>(null);
    const [rangePlannerOptions, setRangePlannerOptions] = useState<{isOpen: boolean, startDate?: Date}>({isOpen: false});

    // MODULAR DASHBOARD STATE
    const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>(() => {
        const saved = localStorage.getItem('dashboardLayout');
        const defaults: DashboardLayout = {
            main: ['nfcScanner', 'summary'],
            sidebar: ['plannerCard', 'offerCard', 'balancesSummary', 'monthlySummary', 'weeklySummary', 'weeklyHoursChart']
        };
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                main: [...new Set([...(parsed.main || []), ...defaults.main])],
                sidebar: [...new Set([...(parsed.sidebar || []), ...defaults.sidebar])]
            };
        }
        return defaults;
    });
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>(() => {
        const saved = localStorage.getItem('widgetVisibility');
        const defaults: WidgetVisibility = {
            nfcScanner: true,
            summary: true,
            plannerCard: true,
            offerCard: true,
            balancesSummary: true,
            monthlySummary: true,
            weeklySummary: true,
            weeklyHoursChart: false,
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    // TOAST HANDLER
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    // PERSISTENCE & INITIALIZATION EFFECTS
    useEffect(() => {
        localStorage.setItem('allTimeLogs', JSON.stringify(allLogs));
    }, [allLogs]);

    useEffect(() => {
        localStorage.setItem('allDayInfo', JSON.stringify(allDayInfo));
    }, [allDayInfo]);

    useEffect(() => {
        localStorage.setItem('allManualOvertime', JSON.stringify(allManualOvertime));
    }, [allManualOvertime]);
    
    useEffect(() => {
        localStorage.setItem('workSettings', JSON.stringify(workSettings));
        // Reschedule reminders if settings change
        if (window.Notification?.permission === 'granted') {
           const todayKey = formatDateKey(new Date());
           scheduleReminders(allDayInfo[todayKey], workSettings);
        }
    }, [workSettings, allDayInfo]);

    useEffect(() => {
        localStorage.setItem('offerSettings', JSON.stringify(offerSettings));
    }, [offerSettings]);
    
    useEffect(() => {
        localStorage.setItem('statusItems', JSON.stringify(statusItems));
    }, [statusItems]);

    useEffect(() => {
        localStorage.setItem('savedRotations', JSON.stringify(savedRotations));
    }, [savedRotations]);

    useEffect(() => {
        localStorage.setItem('dashboardLayout', JSON.stringify(dashboardLayout));
    }, [dashboardLayout]);

    useEffect(() => {
        localStorage.setItem('widgetVisibility', JSON.stringify(widgetVisibility));
    }, [widgetVisibility]);


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

    // Duration Timer Effect
    useEffect(() => {
        let interval: number | undefined;
        if (workStatus === WorkStatus.ClockedIn && currentSessionStart) {
            interval = window.setInterval(() => {
                const durationMs = new Date().getTime() - currentSessionStart.getTime();
                setCurrentSessionDuration(formatDuration(durationMs));
            }, 1000);
        } else {
            setCurrentSessionDuration('00:00:00');
        }
        return () => clearInterval(interval);
    }, [workStatus, currentSessionStart]);

    // Notification Permission and Scheduling Effect
    useEffect(() => {
        const setupNotifications = async () => {
            if (workSettings.enableClockInReminder || workSettings.enableClockOutReminder) {
                const hasPermission = await requestNotificationPermission();
                if (hasPermission) {
                    const todayKey = formatDateKey(new Date());
                    scheduleReminders(allDayInfo[todayKey], workSettings);
                }
            } else {
                clearScheduledNotifications();
            }
        };
        setupNotifications();
    }, [workSettings.enableClockInReminder, workSettings.enableClockOutReminder, allDayInfo]);


    // CORE LOGIC HANDLERS
    const handleClockIn = useCallback(() => {
        const now = new Date();
        const todayKey = formatDateKey(now);
        const newEntry: TimeEntry = { id: self.crypto.randomUUID(), timestamp: now, type: 'in' };

        setAllLogs(prev => ({
            ...prev,
            [todayKey]: [...(prev[todayKey] || []), newEntry]
        }));
        setWorkStatus(WorkStatus.ClockedIn);
        setCurrentSessionStart(now);
        showToast('Timbratura di entrata registrata!');
    }, [showToast]);

    const handleClockOut = useCallback(() => {
        const now = new Date();
        const todayKey = formatDateKey(now);
        const newEntry: TimeEntry = { id: self.crypto.randomUUID(), timestamp: now, type: 'out' };

        setAllLogs(prev => ({
            ...prev,
            [todayKey]: [...(prev[todayKey] || []), newEntry]
        }));
        setWorkStatus(WorkStatus.ClockedOut);
        setCurrentSessionStart(null);
        showToast('Timbratura di uscita registrata!');
    }, [showToast]);

    const handleToggle = useCallback(() => {
        const todayKey = formatDateKey(new Date());
        const todayEntries = allLogs[todayKey] || [];
        const lastEntry = todayEntries[todayEntries.length - 1];

        if (!lastEntry || lastEntry.type === 'out') {
            handleClockIn();
        } else {
            handleClockOut();
        }
    }, [allLogs, handleClockIn, handleClockOut]);

    const handleEditEntry = (dateKey: string, entryIndex: number, newTimestamp: Date, newType: 'in' | 'out') => {
        const updatedLogs = { ...allLogs };
        const originalDateKey = formatDateKey(updatedLogs[dateKey][entryIndex].timestamp);
        const newDateKey = formatDateKey(newTimestamp);

        // If the date has changed, we need to move the entry
        if (originalDateKey !== newDateKey) {
            const entryToMove = { ...updatedLogs[dateKey][entryIndex], timestamp: newTimestamp, type: newType };
            
            // Remove from original day
            updatedLogs[dateKey].splice(entryIndex, 1);
            if (updatedLogs[dateKey].length === 0) {
                delete updatedLogs[dateKey];
            }
            
            // Add to new day
            if (!updatedLogs[newDateKey]) {
                updatedLogs[newDateKey] = [];
            }
            updatedLogs[newDateKey].push(entryToMove);
            updatedLogs[newDateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        } else { // Date is the same, just update
            updatedLogs[dateKey][entryIndex] = { ...updatedLogs[dateKey][entryIndex], timestamp: newTimestamp, type: newType };
            updatedLogs[dateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }

        setAllLogs(updatedLogs);
        showToast("Timbratura aggiornata.");
    };

    const handleDeleteEntry = (dateKey: string, entryIndex: number) => {
        const updatedLogs = { ...allLogs };
        updatedLogs[dateKey].splice(entryIndex, 1);
        if (updatedLogs[dateKey].length === 0) {
            delete updatedLogs[dateKey];
        }
        setAllLogs(updatedLogs);
        showToast("Timbratura eliminata.", 'error');
    };
    
    const handleAddEntry = (newTimestamp: Date, type: 'in' | 'out') => {
        const dateKey = formatDateKey(newTimestamp);
        const newEntry: TimeEntry = { id: self.crypto.randomUUID(), timestamp: newTimestamp, type };
        
        const updatedLogs = { ...allLogs };
        if (!updatedLogs[dateKey]) {
            updatedLogs[dateKey] = [];
        }
        updatedLogs[dateKey].push(newEntry);
        updatedLogs[dateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        setAllLogs(updatedLogs);
        setAddEntryModalDate(null);
        showToast("Timbratura manuale aggiunta.");
    };

    const handleAddOvertime = (dateKey: string, durationMs: number, type: ManualOvertimeType, note: string) => {
        const newEntry: ManualOvertimeEntry = { id: self.crypto.randomUUID(), durationMs, type, note };
        setAllManualOvertime(prev => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), newEntry]
        }));
        setAddOvertimeModalDate(null);
        showToast("Straordinario manuale aggiunto.");
    };

    const handleDeleteManualOvertime = (dateKey: string, entryId: string) => {
        setAllManualOvertime(prev => {
            const updated = { ...prev };
            updated[dateKey] = updated[dateKey].filter(entry => entry.id !== entryId);
            if (updated[dateKey].length === 0) {
                delete updated[dateKey];
            }
            return updated;
        });
        showToast("Straordinario manuale eliminato.", "error");
    };
    
    const handleSetLeave = (date: Date, leaveType: LeaveType | null, hours?: number) => {
        const dateKey = formatDateKey(date);
        const newAllDayInfo = { ...allDayInfo };
        const currentInfo: DayInfo = newAllDayInfo[dateKey] ? { ...newAllDayInfo[dateKey] } : {};

        if (leaveType === null) {
            delete currentInfo.leave;
        } else {
            currentInfo.leave = { type: leaveType };
            if (hours && hours > 0) {
                currentInfo.leave.hours = hours;
            }
            delete currentInfo.shift; // Setting leave removes any shift
        }

        if (!currentInfo.shift && !currentInfo.leave) {
            delete newAllDayInfo[dateKey];
        } else {
            newAllDayInfo[dateKey] = currentInfo;
        }
        
        setAllDayInfo(newAllDayInfo);
    };


    const handleSetShift = (date: Date, shift: ShiftType | null) => {
        const dateKey = formatDateKey(date);
        const newAllDayInfo = { ...allDayInfo };
        const currentInfo: DayInfo = newAllDayInfo[dateKey] ? { ...newAllDayInfo[dateKey] } : {};

        if (shift === null) {
            delete currentInfo.shift;
        } else {
            currentInfo.shift = shift;
            delete currentInfo.leave; // Setting a shift removes any leave
        }

        if (!currentInfo.shift && !currentInfo.leave) {
            delete newAllDayInfo[dateKey];
        } else {
            newAllDayInfo[dateKey] = currentInfo;
        }
        
        setAllDayInfo(newAllDayInfo);
    };

    const handleImportData = (importedDays: any[]) => {
        const newLogs: AllTimeLogs = {};
        const newDayInfo: AllDayInfo = {};

        importedDays.forEach(day => {
            try {
                const dateKey = day.date; // Assuming YYYY-MM-DD format
                if (!dateKey) return;
                
                if (day.entries && day.entries.length > 0) {
                    newLogs[dateKey] = day.entries.map((entry: any) => {
                        const [hours, minutes] = entry.time.split(':').map(Number);
                        const timestamp = parseDateKey(dateKey);
                        timestamp.setHours(hours, minutes);
                        return { id: self.crypto.randomUUID(), timestamp, type: entry.type };
                    });
                }
                
                if (day.note) {
                    const note = day.note.toLowerCase();
                    // Basic keyword matching
                    let matched = false;
                    for (const item of statusItems) {
                        if (note.includes(item.description.toLowerCase().split(' ')[0])) {
                            newDayInfo[dateKey] = { leave: { type: `code-${item.code}` } };
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                         if (note.includes('riposo')) newDayInfo[dateKey] = { shift: 'rest' };
                    }
                }
            } catch (e) {
                console.error(`Skipping invalid day data:`, day, e);
            }
        });

        // Merge imported data with existing data
        setAllLogs(prev => ({...prev, ...newLogs}));
        setAllDayInfo(prev => ({...prev, ...newDayInfo}));
    };
    
    const openRangePlanner = (options?: {startDate?: Date}) => {
        setRangePlannerOptions({isOpen: true, startDate: options?.startDate || selectedDate });
    };

    const handleSetDayInfoForRange = useCallback((start: string, end: string, action: { type: 'shift' | 'leave' | 'clear', value: ShiftType | LeaveType | null }) => {
        const startDate = parseDateKey(start);
        const endDate = parseDateKey(end);
        
        setAllDayInfo(prevAllDayInfo => {
            const newAllDayInfo = { ...prevAllDayInfo };
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateKey = formatDateKey(currentDate);
                const currentInfo: DayInfo = newAllDayInfo[dateKey] ? {...newAllDayInfo[dateKey]} : {};
                
                if (action.type === 'clear') {
                    delete newAllDayInfo[dateKey];
                } else if (action.type === 'shift' && action.value) {
                    newAllDayInfo[dateKey] = { ...currentInfo, shift: action.value as ShiftType };
                    delete newAllDayInfo[dateKey].leave;
                } else if (action.type === 'leave' && action.value) {
                    newAllDayInfo[dateKey] = { ...currentInfo, leave: { type: action.value as LeaveType } };
                    delete newAllDayInfo[dateKey].shift;
                }
                
                currentDate = addDays(currentDate, 1);
            }
            return newAllDayInfo;
        });
        showToast('Intervallo di date aggiornato con successo!');
    }, [showToast]);


    // RENDER LOGIC
    const renderPage = () => {
        switch(currentPage) {
            case 'dashboard':
                return <DashboardPage 
                            allLogs={allLogs} 
                            allDayInfo={allDayInfo}
                            allManualOvertime={allManualOvertime}
                            selectedDate={selectedDate}
                            workStatus={workStatus} 
                            currentSessionStart={currentSessionStart}
                            currentSessionDuration={currentSessionDuration}
                            workSettings={workSettings}
                            offerSettings={offerSettings}
                            statusItems={statusItems}
                            dashboardLayout={dashboardLayout}
                            widgetVisibility={widgetVisibility}
                            onNavigateToCalendar={() => setCurrentPage('calendar')}
                            onToggle={handleToggle}
                            onOpenQuickLeaveModal={(options) => setQuickLeaveModalOptions(options)}
                            onSetSelectedDate={setSelectedDate}
                            onEditEntry={handleEditEntry}
                            onDeleteEntry={handleDeleteEntry}
                            onOpenAddEntryModal={setAddEntryModalDate}
                            onOpenAddOvertimeModal={setAddOvertimeModalDate}
                            onDeleteManualOvertime={handleDeleteManualOvertime}
                            onOpenRangePlanner={openRangePlanner}
                        />;
            case 'calendar':
                return <CalendarPage 
                            allLogs={allLogs} 
                            allDayInfo={allDayInfo}
                            allManualOvertime={allManualOvertime}
                            workSettings={workSettings}
                            statusItems={statusItems}
                            savedRotations={savedRotations}
                            onSetAllDayInfo={setAllDayInfo}
                            onEditEntry={handleEditEntry}
                            onDeleteEntry={handleDeleteEntry}
                            onOpenAddEntryModal={setAddEntryModalDate}
                            onOpenAddOvertimeModal={setAddOvertimeModalDate}
                            onDeleteManualOvertime={handleDeleteManualOvertime}
                            onImportData={handleImportData}
                            onOpenQuickLeaveModal={(options) => setQuickLeaveModalOptions(options)}
                            onSetSavedRotations={setSavedRotations}
                            onOpenRangePlanner={openRangePlanner}
                       />;
            case 'balances':
                return <BalancesPage 
                            allDayInfo={allDayInfo} 
                            statusItems={statusItems} 
                            allLogs={allLogs}
                            workSettings={workSettings}
                            allManualOvertime={allManualOvertime}
                        />;
            case 'settings':
                return <SettingsPage 
                            workSettings={workSettings}
                            offerSettings={offerSettings}
                            dashboardLayout={dashboardLayout}
                            widgetVisibility={widgetVisibility}
                            savedRotations={savedRotations}
                            statusItems={statusItems}
                            allDayInfo={allDayInfo}
                            onSaveWorkSettings={setWorkSettings}
                            onSaveOfferSettings={setOfferSettings}
                            onSaveDashboardLayout={setDashboardLayout}
                            onSaveWidgetVisibility={setWidgetVisibility}
                            onSaveSavedRotations={setSavedRotations}
                            onSetStatusItems={setStatusItems}
                            onShowToast={showToast}
                        />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans">
            <Header currentPage={currentPage} onNavigate={setCurrentPage} />
            <div className="flex-grow overflow-y-auto">
              {renderPage()}
            </div>
            {quickLeaveModalOptions && (
                <QuickLeaveModal 
                    date={quickLeaveModalOptions.date}
                    statusItems={statusItems}
                    highlightedLeave={quickLeaveModalOptions.highlightedLeave}
                    onClose={() => setQuickLeaveModalOptions(null)}
                    onSetLeave={handleSetLeave}
                    onSetShift={handleSetShift}
                    // FIX: Pass workSettings to QuickLeaveModal
                    workSettings={workSettings}
                    onOpenAddEntryModal={() => {
                        setAddEntryModalDate(quickLeaveModalOptions.date);
                        setQuickLeaveModalOptions(null);
                    }}
                />
            )}
            {addEntryModalDate && (
                <AddTimeEntryModal 
                    date={addEntryModalDate}
                    onClose={() => setAddEntryModalDate(null)}
                    onSave={handleAddEntry}
                />
            )}
            {addOvertimeModalDate && (
                 <AddOvertimeModal
                    date={addOvertimeModalDate}
                    onClose={() => setAddOvertimeModalDate(null)}
                    onSave={handleAddOvertime}
                />
            )}
            <RangePlannerModal
                isOpen={rangePlannerOptions.isOpen}
                startDate={rangePlannerOptions.startDate}
                statusItems={statusItems}
                onClose={() => setRangePlannerOptions({ isOpen: false })}
                onApply={handleSetDayInfoForRange}
            />
            <div className="fixed top-24 right-4 z-[100] w-full max-w-xs space-y-2">
                {toasts.map(toast => (
                    <Toast 
                        key={toast.id} 
                        message={toast.message} 
                        type={toast.type} 
                        onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default App;

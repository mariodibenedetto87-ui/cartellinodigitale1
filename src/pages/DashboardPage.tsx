import React, { useMemo, useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUI } from '../contexts/UIContext';
import { formatDateKey, isSameDay, addDays, startOfWeek, calculateWorkSummary } from '../utils/timeUtils';
import { useGeofencing } from '../hooks/useGeofencing';
import NfcScanner from '../components/NfcScanner';
import Summary from '../components/Summary';
import WeeklySummary from '../components/WeeklySummary';
import MonthlySummary from '../components/MonthlySummary';
import OfferCard from '../components/OfferCard';
import BalancesSummary from '../components/BalancesSummary';
import PlannerCard from '../components/PlannerCard';
import MealVoucherCard from '../components/MealVoucherCard';
import SmartNotificationsPanel from '../components/SmartNotificationsPanel';
import DashboardInsights from '../components/DashboardInsights';
import { GeofenceNotification } from '../components/GeofenceNotification';

// Lazy load chart
const WeeklyHoursChart = lazy(() => import('../components/WeeklyHoursChart'));

const DashboardPage: React.FC = () => {
    const { session } = useAuth();
    const {
        allLogs, allDayInfo, allManualOvertime, allMealVouchers,
        selectedDate, setSelectedDate, workStatus, currentSessionStart, currentSessionDuration,
        handleToggleWorkStatus, handleEditEntry, handleDeleteEntry, handleDeleteManualOvertime
    } = useData();
    const { settings, workLocation } = useSettings();
    const {
        openQuickLeaveModal, openAddEntryModal, openAddManualEntryModal,
        openAddOvertimeModal, openHoursMissingModal, openMealVoucherModal, openRangePlanner
    } = useUI();

    const { workSettings, offerSettings, statusItems, dashboardLayout, widgetVisibility } = settings;

    // Smart notifications logic could be moved to a hook or context, for now keeping local or assuming passed?
    // Actually App.tsx had smartNotifications state. We should probably move that to DataContext or a hook.
    // For now, let's assume we might need to implement it here or fetch from DataContext if we added it.
    // I didn't add smartNotifications to DataContext yet. I should probably add it or just calculate it here.
    // Let's calculate it here for now to avoid another context update immediately.
    const [smartNotifications, setSmartNotifications] = useState<any[]>([]); // Placeholder
    const [showGeofenceNotification, setShowGeofenceNotification] = useState(false);
    const [showExitNotification, setShowExitNotification] = useState(false);
    const [geofenceDistance, setGeofenceDistance] = useState(0);
    const [lastExitTime, setLastExitTime] = useState<Date | null>(null);

    const [summaryRenderKey, setSummaryRenderKey] = useState(0);

    // Helper function to check if current time is near shift start/end
    const isNearShiftTime = (shiftHour: number | null | undefined, minutesBefore: number = 30): boolean => {
        if (shiftHour === null || shiftHour === undefined) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const shiftTotalMinutes = shiftHour * 60;

        // Check if we're within minutesBefore of the shift time
        const diff = shiftTotalMinutes - currentTotalMinutes;
        return diff >= 0 && diff <= minutesBefore;
    };

    // Geofencing integration with smart logic
    useGeofencing({
        workLocation: workLocation,
        enabled: !!workLocation,
        onEnterWorkZone: (distance) => {
            console.log('📍 Entrato nella zona di lavoro!', distance);

            const shiftStart = workSettings.shifts.find(s => s.id !== 'rest')?.startHour;

            // Check if we should show the notification
            let shouldShow = false;

            // Rule 1: Always show near shift start time
            if (isNearShiftTime(shiftStart, 30)) {
                shouldShow = true;
                console.log('✅ Mostro notifica: vicino all\'inizio turno');
            }
            // Rule 2: Show if returning within 3 hours of last exit
            else if (lastExitTime) {
                const hoursSinceExit = (new Date().getTime() - lastExitTime.getTime()) / (1000 * 60 * 60);
                if (hoursSinceExit <= 3) {
                    shouldShow = true;
                    console.log(`✅ Mostro notifica: ritorno entro 3h (${hoursSinceExit.toFixed(1)}h fa)`);
                } else {
                    console.log(`❌ Non mostro notifica: troppo tempo dall'uscita (${hoursSinceExit.toFixed(1)}h fa)`);
                }
            }
            // Rule 3: If no previous exit, show only near shift time
            else {
                console.log('❌ Non mostro notifica: nessuna uscita recente e non vicino al turno');
            }

            if (shouldShow) {
                setGeofenceDistance(distance);
                setShowGeofenceNotification(true);
            }
        },
        onExitWorkZone: (distance) => {
            console.log('🚪 Uscito dalla zona di lavoro!', distance);

            const shiftEnd = workSettings.shifts.find(s => s.id !== 'rest')?.endHour;

            // Check if we should show the exit notification
            let shouldShow = false;

            // Rule 1: Always show near shift end time
            if (isNearShiftTime(shiftEnd, 30)) {
                shouldShow = true;
                console.log('✅ Mostro notifica uscita: vicino alla fine turno');
            } else {
                console.log('ℹ️ Noto uscita ma non vicino alla fine turno');
            }

            // Track exit time for the 3-hour rule
            setLastExitTime(new Date());

            if (shouldShow) {
                setGeofenceDistance(distance);
                setShowExitNotification(true);
            }
        },
        shiftStartHour: workSettings.shifts.find(s => s.id !== 'rest')?.startHour ?? undefined,
        shiftEndHour: workSettings.shifts.find(s => s.id !== 'rest')?.endHour ?? undefined,
    });

    useEffect(() => {
        setSummaryRenderKey(prev => prev + 1);
    }, [allLogs]);

    const isTodaySelected = isSameDay(selectedDate, new Date());
    const selectedDateKey = formatDateKey(selectedDate);
    const entriesForSelectedDate = allLogs[selectedDateKey] || [];
    const manualOvertimeForSelectedDate = allManualOvertime[selectedDateKey] || [];
    const dayInfoForSelectedDate = allDayInfo[selectedDateKey];
    const nextDay = addDays(selectedDate, 1);
    const nextDayKey = formatDateKey(nextDay);
    const nextDayInfoForSelectedDate = allDayInfo[nextDayKey];

    const { summary: summaryForSelectedDate } = useMemo(() => calculateWorkSummary(
        selectedDate,
        entriesForSelectedDate,
        workSettings,
        dayInfoForSelectedDate,
        nextDayInfoForSelectedDate,
        []
    ), [selectedDate, entriesForSelectedDate, workSettings, dayInfoForSelectedDate, nextDayInfoForSelectedDate]);

    const totalWorkMsForSelectedDate = summaryForSelectedDate.totalWorkMs;

    const weeklyData = useMemo(() => {
        let totalWorkMs = 0;
        let totalOvertimeDiurnalMs = 0;
        let totalOvertimeNocturnalMs = 0;
        let totalOvertimeHolidayMs = 0;
        let totalOvertimeNocturnalHolidayMs = 0;
        let totalExcessHoursMs = 0;
        const weekStart = startOfWeek(selectedDate);

        let workDays = 0;
        let vacationDays = 0;
        let permitDays = 0;
        let restDays = 0;

        for (let i = 0; i < 7; i++) {
            const day = addDays(weekStart, i);
            const dateKey = formatDateKey(day);
            const entries = allLogs[dateKey];
            const manualOvertime = allManualOvertime[dateKey];
            const dayInfo = allDayInfo[dateKey];
            const nextDay = addDays(day, 1);
            const nextDayKey = formatDateKey(nextDay);
            const nextDayInfo = allDayInfo[nextDayKey];

            if (dayInfo?.leave?.type) {
                const leaveCodeStr = dayInfo.leave.type.split('-')[1];
                if (leaveCodeStr) {
                    const leaveCode = parseInt(leaveCodeStr, 10);
                    if (leaveCode === 15 || leaveCode === 16) {
                        vacationDays++;
                    } else {
                        permitDays++;
                    }
                }
            } else if (dayInfo?.shift === 'rest') {
                restDays++;
            } else if ((entries && entries.length > 0) || (manualOvertime && manualOvertime.length > 0)) {
                workDays++;
            }

            if ((entries && entries.length > 0) || (manualOvertime && manualOvertime.length > 0)) {
                const { summary } = calculateWorkSummary(day, entries, workSettings, dayInfo, nextDayInfo, manualOvertime);
                totalWorkMs += summary.totalWorkMs;
                totalExcessHoursMs += summary.excessHoursMs;
                totalOvertimeDiurnalMs += summary.overtimeDiurnalMs;
                totalOvertimeNocturnalMs += summary.overtimeNocturnalMs;
                totalOvertimeHolidayMs += summary.overtimeHolidayMs;
                totalOvertimeNocturnalHolidayMs += summary.overtimeNocturnalHolidayMs;
            }
        }

        const totalOvertimeMs = totalOvertimeDiurnalMs + totalOvertimeNocturnalMs + totalOvertimeHolidayMs + totalOvertimeNocturnalHolidayMs;

        return {
            totalWorkMs,
            totalOvertimeMs,
            totalExcessHoursMs,
            totalOvertimeDiurnalMs,
            totalOvertimeNocturnalMs,
            totalOvertimeHolidayMs,
            totalOvertimeNocturnalHolidayMs,
            workDays,
            vacationDays,
            permitDays,
            restDays
        };
    }, [allLogs, allDayInfo, allManualOvertime, selectedDate, workSettings]);

    const widgetComponents: Record<string, React.ReactNode> = {
        nfcScanner: (
            <NfcScanner
                workStatus={workStatus}
                onToggle={handleToggleWorkStatus}
                disabled={!isTodaySelected}
                currentSessionDuration={currentSessionDuration}
                currentSessionStart={currentSessionStart}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                dayTotalWorkMs={totalWorkMsForSelectedDate}
                workSettings={workSettings}
            />
        ),
        summary: (
            <Summary
                key={`summary-dashboard-${selectedDateKey}-${summaryRenderKey}`}
                date={selectedDate}
                entries={entriesForSelectedDate}
                dayInfo={dayInfoForSelectedDate}
                nextDayInfo={nextDayInfoForSelectedDate}
                workSettings={workSettings}
                statusItems={statusItems}
                manualOvertimeEntries={manualOvertimeForSelectedDate}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
                onOpenAddEntryModal={openAddEntryModal}
                onOpenAddManualEntryModal={openAddManualEntryModal}
                onDeleteManualOvertime={handleDeleteManualOvertime}
                onOpenQuickLeaveModal={(date) => openQuickLeaveModal(date)}
                onOpenAddOvertimeModal={openAddOvertimeModal}
                onOpenHoursMissingModal={openHoursMissingModal || ((date) => openQuickLeaveModal(date))}
            />
        ),
        plannerCard: <PlannerCard onOpen={() => openRangePlanner()} />,
        offerCard: <OfferCard settings={offerSettings} />,
        balancesSummary: <BalancesSummary allDayInfo={allDayInfo} statusItems={statusItems} allManualOvertime={allManualOvertime} />,
        monthlySummary: <MonthlySummary allLogs={allLogs} allDayInfo={allDayInfo} workSettings={workSettings} selectedDate={selectedDate} onDateChange={setSelectedDate} />,
        weeklySummary: (
            <WeeklySummary
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                workDays={weeklyData.workDays}
                vacationDays={weeklyData.vacationDays}
                permitDays={weeklyData.permitDays}
                restDays={weeklyData.restDays}
                totalWorkMs={weeklyData.totalWorkMs}
                excessHoursMs={weeklyData.totalExcessHoursMs}
                overtimeDetails={{
                    diurnal: weeklyData.totalOvertimeDiurnalMs,
                    nocturnal: weeklyData.totalOvertimeNocturnalMs,
                    holiday: weeklyData.totalOvertimeHolidayMs,
                    nocturnalHoliday: weeklyData.totalOvertimeNocturnalHolidayMs,
                }}
            />
        ),
        weeklyHoursChart: (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>}>
                <WeeklyHoursChart
                    totalWorkMs={weeklyData.totalWorkMs}
                    totalOvertimeMs={weeklyData.totalOvertimeMs}
                />
            </Suspense>
        ),
        mealVoucherCard: (
            <MealVoucherCard
                date={selectedDate}
                allLogs={allLogs}
                allMealVouchers={allMealVouchers}
                onOpenModal={openMealVoucherModal}
                session={session}
            />
        ),
        smartNotifications: (
            <SmartNotificationsPanel
                notifications={smartNotifications}
                onDismiss={(id) => setSmartNotifications(prev => prev.filter(n => n.id !== id))}
                onAction={(id) => {
                    const notification = smartNotifications.find(n => n.id === id);
                    if (notification?.id === 'forgot-clock-in') {
                        handleToggleWorkStatus();
                    }
                    setSmartNotifications(prev => prev.filter(n => n.id !== id));
                }}
            />
        ),
        dashboardInsights: (
            <DashboardInsights
                allLogs={allLogs}
                allDayInfo={allDayInfo}
                allManualOvertime={allManualOvertime}
                workSettings={workSettings}
            />
        ),
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8">
                    {dashboardLayout.main.map(widgetId =>
                        widgetVisibility[widgetId] && widgetComponents[widgetId]
                            ? <div key={widgetId}>{widgetComponents[widgetId]}</div>
                            : null
                    )}
                </div>

                <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
                    {dashboardLayout.sidebar.map(widgetId =>
                        widgetVisibility[widgetId] && widgetComponents[widgetId]
                            ? <div key={widgetId}>{widgetComponents[widgetId]}</div>
                            : null
                    )}
                </div>
            </div>

            {/* Geofence Entry Notification */}
            <GeofenceNotification
                isOpen={showGeofenceNotification}
                workLocationName={workLocation?.name || 'Lavoro'}
                distance={geofenceDistance}
                shiftStartHour={workSettings.shifts.find(s => s.id !== 'rest')?.startHour ?? undefined}
                onClockIn={async () => {
                    await handleToggleWorkStatus();
                    setShowGeofenceNotification(false);
                }}
                onDismiss={() => setShowGeofenceNotification(false)}
            />

            {/* Geofence Exit Notification */}
            {showExitNotification && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowExitNotification(false)}
                    />
                    <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl max-w-sm w-full animate-slide-down">
                        <button
                            onClick={() => setShowExitNotification(false)}
                            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            aria-label="Chiudi notifica"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex justify-center pt-8 pb-4">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                        </div>
                        <div className="px-6 pb-6 text-center text-white">
                            <h2 className="text-2xl font-bold mb-2">Sei uscito! 👋</h2>
                            <p className="text-orange-50 mb-4">
                                Ti sei allontanato da <span className="font-semibold">{workLocation?.name || 'Lavoro'}</span>
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        await handleToggleWorkStatus();
                                        setShowExitNotification(false);
                                    }}
                                    className="w-full py-3 px-6 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 active:scale-95 transition-all shadow-lg"
                                >
                                    ⏱️ Timbra Uscita
                                </button>
                                <button
                                    onClick={() => setShowExitNotification(false)}
                                    className="w-full py-2 px-6 bg-orange-700/50 text-white font-medium rounded-xl hover:bg-orange-700/70 transition-colors"
                                >
                                    Più tardi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DashboardPage;

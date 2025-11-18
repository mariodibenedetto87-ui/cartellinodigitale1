import React, { useMemo } from 'react';
import { AllTimeLogs, WorkStatus, WorkSettings, AllDayInfo, OfferSettings, StatusItem, DashboardLayout, WidgetVisibility, AllManualOvertime, AllMealVouchers } from '../types';
import { formatDateKey, isSameDay, addDays, startOfWeek, calculateWorkSummary } from '../utils/timeUtils';
import { Session } from '@supabase/supabase-js';
import NfcScanner from '../components/NfcScanner';
import Summary from '../components/Summary';
import WeeklySummary from '../components/WeeklySummary';
import MonthlySummary from '../components/MonthlySummary';
import OfferCard from '../components/OfferCard';
import WeeklyHoursChart from '../components/WeeklyHoursChart';
import BalancesSummary from '../components/BalancesSummary';
import PlannerCard from '../components/PlannerCard';
import MealVoucherCard from '../components/MealVoucherCard';

interface DashboardPageProps {
    session: Session | null;
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    allManualOvertime: AllManualOvertime;
    allMealVouchers: AllMealVouchers;
    selectedDate: Date;
    workStatus: WorkStatus;
    currentSessionStart: Date | null;
    currentSessionDuration: string;
    workSettings: WorkSettings;
    offerSettings: OfferSettings;
    statusItems: StatusItem[];
    dashboardLayout: DashboardLayout;
    widgetVisibility: WidgetVisibility;
    onNavigateToCalendar: () => void;
    onToggle: () => void;
    onOpenQuickLeaveModal: (options: { date: Date }) => void;
    onSetSelectedDate: (date: Date) => void;
    onEditEntry: (dateKey: string, entryIndex: number, newTimestamp: Date, newType: 'in' | 'out') => void;
    onDeleteEntry: (dateKey: string, entryIndex: number) => void;
    onOpenAddEntryModal: (date: Date) => void;
    onOpenAddManualEntryModal: (date: Date) => void;
    onDeleteManualOvertime: (dateKey: string, entryId: string) => void;
    onOpenRangePlanner: (options?: { startDate?: Date }) => void;
    onOpenAddOvertimeModal: (date: Date) => void;
    onOpenMealVoucherModal: (date: Date) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { 
        session, allLogs, allDayInfo, allManualOvertime, allMealVouchers, selectedDate, workStatus, 
        currentSessionStart, currentSessionDuration, workSettings, offerSettings,
        statusItems, onToggle,
        onSetSelectedDate, onEditEntry, onDeleteEntry, onOpenAddEntryModal,
        onOpenAddManualEntryModal, onDeleteManualOvertime,
        dashboardLayout, widgetVisibility, onOpenRangePlanner, onOpenQuickLeaveModal,
        onOpenAddOvertimeModal, onOpenMealVoucherModal
    } = props;
    
    const isTodaySelected = isSameDay(selectedDate, new Date());
    const selectedDateKey = formatDateKey(selectedDate);
    const entriesForSelectedDate = allLogs[selectedDateKey] || [];
    const manualOvertimeForSelectedDate = allManualOvertime[selectedDateKey] || [];
    const dayInfoForSelectedDate = allDayInfo[selectedDateKey];
    const nextDay = addDays(selectedDate, 1);
    const nextDayKey = formatDateKey(nextDay);
    const nextDayInfoForSelectedDate = allDayInfo[nextDayKey];

    // "Ore Lavorate Totali" mostra solo le ore dalle timbrature (SENZA straordinari manuali)
    // Gli straordinari manuali vengono mostrati separatamente negli appositi widget
    const { summary: summaryForSelectedDate } = useMemo(() => calculateWorkSummary(
        selectedDate,
        entriesForSelectedDate,
        workSettings,
        dayInfoForSelectedDate,
        nextDayInfoForSelectedDate,
        [] // NON includiamo straordinari manuali nel conteggio ore lavorate
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
        
        for(let i=0; i<7; i++) {
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
                onToggle={onToggle}
                disabled={!isTodaySelected}
                currentSessionDuration={currentSessionDuration}
                currentSessionStart={currentSessionStart}
                selectedDate={selectedDate}
                onDateChange={onSetSelectedDate}
                dayTotalWorkMs={totalWorkMsForSelectedDate}
                workSettings={workSettings}
            />
        ),
        summary: (
            <Summary
                date={selectedDate}
                entries={entriesForSelectedDate}
                dayInfo={dayInfoForSelectedDate}
                nextDayInfo={nextDayInfoForSelectedDate}
                workSettings={workSettings}
                statusItems={statusItems}
                manualOvertimeEntries={manualOvertimeForSelectedDate}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                onOpenAddEntryModal={onOpenAddEntryModal}
                onOpenAddManualEntryModal={onOpenAddManualEntryModal}
                onDeleteManualOvertime={onDeleteManualOvertime}
                onOpenQuickLeaveModal={(date) => onOpenQuickLeaveModal({ date })}
                onOpenAddOvertimeModal={onOpenAddOvertimeModal}
            />
        ),
        plannerCard: <PlannerCard onOpen={() => onOpenRangePlanner()} />,
        offerCard: <OfferCard settings={offerSettings} />,
        balancesSummary: <BalancesSummary allDayInfo={allDayInfo} statusItems={statusItems} />,
        monthlySummary: <MonthlySummary allLogs={allLogs} allDayInfo={allDayInfo} workSettings={workSettings} selectedDate={selectedDate} onDateChange={onSetSelectedDate} />,
        weeklySummary: (
            <WeeklySummary 
                selectedDate={selectedDate} 
                onDateChange={onSetSelectedDate}
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
            <WeeklyHoursChart 
                totalWorkMs={weeklyData.totalWorkMs}
                totalOvertimeMs={weeklyData.totalOvertimeMs}
            />
        ),
        mealVoucherCard: (
            <MealVoucherCard
                date={selectedDate}
                allLogs={allLogs}
                allMealVouchers={allMealVouchers}
                onOpenModal={onOpenMealVoucherModal}
                session={session}
            />
        ),
    };

    return (
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:px-8">
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
        </main>
    );
};

export default DashboardPage;

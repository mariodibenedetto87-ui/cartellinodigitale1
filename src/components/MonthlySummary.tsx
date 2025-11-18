import React, { useMemo } from 'react';
import { AllTimeLogs, AllDayInfo, WorkSettings } from '../types';
import { calculateWorkSummary, formatDuration, isSameMonth, addDays, formatDateKey, parseDateKey } from '../utils/timeUtils';

interface MonthlySummaryProps {
  allLogs: AllTimeLogs;
  allDayInfo: AllDayInfo;
  workSettings: WorkSettings;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const StatCard: React.FC<{label: string, value: string | number, colorClasses: string}> = ({label, value, colorClasses}) => (
    <div className={`p-3 rounded-lg ${colorClasses}`}>
        <p className="text-sm font-semibold opacity-80">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
    </div>
);


const MonthlySummary: React.FC<MonthlySummaryProps> = ({ allLogs, allDayInfo, workSettings, selectedDate, onDateChange }) => {
  
  const handleMonthNavigation = (months: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + months);
      onDateChange(newDate);
  };
    
  const monthlyData = useMemo(() => {
    let totalWorkMs = 0;
    let totalExcessHoursMs = 0;
    let totalOvertimeDiurnalMs = 0;
    let totalOvertimeNocturnalMs = 0;
    let totalOvertimeHolidayMs = 0;
    let totalOvertimeNocturnalHolidayMs = 0;
    let workDays = 0;

    Object.keys(allLogs).forEach(dateKey => {
      const logDate = parseDateKey(dateKey);
      if (isSameMonth(logDate, selectedDate)) {
        const entries = allLogs[dateKey];
        const dayInfo = allDayInfo[dateKey];
        const nextDay = addDays(logDate, 1);
        const nextDayKey = formatDateKey(nextDay);
        const nextDayInfo = allDayInfo[nextDayKey];
        if (entries && entries.length > 0) {
          const { summary } = calculateWorkSummary(logDate, entries, workSettings, dayInfo, nextDayInfo);
          totalWorkMs += summary.totalWorkMs;
          totalExcessHoursMs += summary.excessHoursMs;
          totalOvertimeDiurnalMs += summary.overtimeDiurnalMs;
          totalOvertimeNocturnalMs += summary.overtimeNocturnalMs;
          totalOvertimeHolidayMs += summary.overtimeHolidayMs;
          totalOvertimeNocturnalHolidayMs += summary.overtimeNocturnalHolidayMs;
          workDays++;
        }
      }
    });

    return { 
        totalWorkMs, 
        totalExcessHoursMs,
        totalOvertimeDiurnalMs,
        totalOvertimeNocturnalMs,
        totalOvertimeHolidayMs,
        totalOvertimeNocturnalHolidayMs,
        workDays 
    };
  }, [allLogs, allDayInfo, selectedDate, workSettings]);
  
  const hasOvertime = monthlyData.totalOvertimeDiurnalMs > 0 || monthlyData.totalOvertimeNocturnalMs > 0 || monthlyData.totalOvertimeHolidayMs > 0 || monthlyData.totalOvertimeNocturnalHolidayMs > 0;
  const hasExtraHours = hasOvertime || monthlyData.totalExcessHoursMs > 0;

  const leaveDays = useMemo(() => {
      return Object.keys(allDayInfo).filter(dateKey => {
          const logDate = parseDateKey(dateKey);
          return isSameMonth(logDate, selectedDate) && allDayInfo[dateKey]?.leave;
      }).length;
  }, [allDayInfo, selectedDate]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => handleMonthNavigation(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Mese precedente">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 text-center">
            Riepilogo Mensile <br className="sm:hidden" />({selectedDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric'})})
        </h3>
        <button onClick={() => handleMonthNavigation(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Mese successivo">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
        <StatCard label="Giorni Lavorati" value={monthlyData.workDays} colorClasses="bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300" />
        <StatCard label="Ore Totali" value={formatDuration(monthlyData.totalWorkMs).slice(0, 5)} colorClasses="bg-gray-100 dark:bg-slate-700/50 text-slate-800 dark:text-white" />
      </div>

      {hasExtraHours && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <h4 className="text-md font-semibold text-gray-700 dark:text-slate-300 mb-3 text-center">Riepilogo Ore Extra Mensili</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                 {monthlyData.totalExcessHoursMs > 0 && <StatCard label="Eccedenti" value={formatDuration(monthlyData.totalExcessHoursMs).slice(0, 5)} colorClasses="bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400" />}
                 {monthlyData.totalOvertimeDiurnalMs > 0 && <StatCard label="Straordinario Diurno" value={formatDuration(monthlyData.totalOvertimeDiurnalMs).slice(0, 5)} colorClasses="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" />}
                 {monthlyData.totalOvertimeNocturnalMs > 0 && <StatCard label="Straordinario Notturno" value={formatDuration(monthlyData.totalOvertimeNocturnalMs).slice(0, 5)} colorClasses="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" />}
                 {monthlyData.totalOvertimeHolidayMs > 0 && <StatCard label="Straordinario Festivo" value={formatDuration(monthlyData.totalOvertimeHolidayMs).slice(0, 5)} colorClasses="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400" />}
                 {monthlyData.totalOvertimeNocturnalHolidayMs > 0 && <StatCard label="Straordinario Fest. Notturno" value={formatDuration(monthlyData.totalOvertimeNocturnalHolidayMs).slice(0, 5)} colorClasses="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" />}
             </div>
        </div>
      )}

       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
            <StatCard label="Giorni Assenza" value={leaveDays} colorClasses="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" />
        </div>
    </div>
  );
};

export default MonthlySummary;

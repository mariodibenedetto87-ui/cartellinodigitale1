import React, { useMemo } from 'react';
import { AllTimeLogs, AllDayInfo, WorkSettings, AllManualOvertime } from '../types';
import { calculateWorkSummary, formatDuration, parseDateKey, addDays, formatDateKey } from '../utils/timeUtils';

interface AnnualSummaryProps {
  year: number;
  allLogs: AllTimeLogs;
  allDayInfo: AllDayInfo;
  workSettings: WorkSettings;
  allManualOvertime: AllManualOvertime;
  onYearChange: (year: number) => void;
}

const StatCard: React.FC<{label: string, value: string | number, colorClasses: string}> = ({label, value, colorClasses}) => (
    <div className={`p-4 rounded-lg text-center ${colorClasses}`}>
        <p className="text-sm font-semibold opacity-80">{label}</p>
        <p className="text-4xl font-bold">{value}</p>
    </div>
);

const AnnualSummary: React.FC<AnnualSummaryProps> = ({ year, allLogs, allDayInfo, workSettings, allManualOvertime, onYearChange }) => {

  const annualData = useMemo(() => {
    let totalWorkMs = 0;
    let totalOvertimeMs = 0;
    let workDays = 0;
    let leaveDays = 0;

    const allKeys = new Set([...Object.keys(allLogs), ...Object.keys(allDayInfo), ...Object.keys(allManualOvertime)]);

    allKeys.forEach(dateKey => {
      try {
        const logDate = parseDateKey(dateKey);
        if (logDate.getFullYear() === year) {
          const entries = allLogs[dateKey] || [];
          const manualOvertime = allManualOvertime[dateKey] || [];
          const dayInfo = allDayInfo[dateKey];

          if (dayInfo?.leave) {
              leaveDays++;
          }

          if ((entries && entries.length > 0) || (manualOvertime && manualOvertime.length > 0)) {
            workDays++;
            const nextDay = addDays(logDate, 1);
            const nextDayKey = formatDateKey(nextDay);
            const nextDayInfo = allDayInfo[nextDayKey];
            const { summary } = calculateWorkSummary(logDate, entries, workSettings, dayInfo, nextDayInfo, manualOvertime);
            
            totalWorkMs += summary.totalWorkMs;
            totalOvertimeMs += summary.overtimeDiurnalMs + summary.overtimeNocturnalMs + summary.overtimeHolidayMs + summary.overtimeNocturnalHolidayMs;
          }
        }
      } catch (e) {
        console.error("Invalid date key found in annual summary calculation:", dateKey, e);
      }
    });

    return { totalWorkMs, totalOvertimeMs, workDays, leaveDays };
  }, [year, allLogs, allDayInfo, allManualOvertime, workSettings]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 mb-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => onYearChange(year - 1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Anno precedente">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Riepilogo Annuale {year}</h1>
        <button onClick={() => onYearChange(year + 1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Anno successivo">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Giorni Lavorati" value={annualData.workDays} colorClasses="bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300" />
        <StatCard label="Giorni Assenza" value={annualData.leaveDays} colorClasses="bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300" />
        <StatCard label="Ore Totali" value={formatDuration(annualData.totalWorkMs).slice(0, 5)} colorClasses="bg-gray-100 dark:bg-slate-700/50 text-slate-800 dark:text-white" />
        <StatCard label="Straordinario" value={formatDuration(annualData.totalOvertimeMs).slice(0, 5)} colorClasses="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" />
      </div>
    </div>
  );
};

export default AnnualSummary;

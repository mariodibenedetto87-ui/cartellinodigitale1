import React, { memo } from 'react';
import { formatDuration, startOfWeek, addDays } from '../utils/timeUtils';

interface WeeklySummaryProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  workDays: number;
  vacationDays: number;
  permitDays: number;
  restDays: number;
  totalWorkMs: number;
  excessHoursMs: number;
  overtimeDetails: {
      diurnal: number;
      nocturnal: number;
      holiday: number;
      nocturnalHoliday: number;
  };
}

const StatBox: React.FC<{label: string, value: number, bgColor: string, textColor: string}> = memo(({label, value, bgColor, textColor}) => (
    <div className={`${bgColor} p-3 rounded-lg text-center`}>
        <p className={`text-sm font-semibold ${textColor}`}>{label}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className={`text-xs ${textColor}`}>Giorni</p>
    </div>
));
StatBox.displayName = 'StatBox';

const OvertimeRow: React.FC<{label: string, valueMs: number, color: string}> = memo(({label, valueMs, color}) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-slate-400">{label}</span>
        <span className={`font-bold ${color}`}>{formatDuration(valueMs)}</span>
    </div>
));
OvertimeRow.displayName = 'OvertimeRow';

const WeeklySummary: React.FC<WeeklySummaryProps> = memo(({ 
    selectedDate, onDateChange, workDays, vacationDays, permitDays, restDays, 
    totalWorkMs, excessHoursMs, overtimeDetails 
}) => {
    
  const handleWeekNavigation = (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      onDateChange(newDate);
  };
    
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = addDays(weekStart, 6);
  const weekRangeString = `${weekStart.getDate()} ${weekStart.toLocaleDateString('it-IT', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('it-IT', { month: 'short' })}`;

  const { diurnal, nocturnal, holiday, nocturnalHoliday } = overtimeDetails;
  const totalOvertimeMs = diurnal + nocturnal + holiday + nocturnalHoliday;
  const totalExtraMs = totalOvertimeMs + excessHoursMs;
  const hasExtraHours = totalExtraMs > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 h-full flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
        <div>
            <div className="flex justify-between items-center mb-2">
                <button onClick={() => handleWeekNavigation(-7)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Settimana precedente">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                 <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">Riepilogo Sett.</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">{weekRangeString}</p>
                </div>
                <button onClick={() => handleWeekNavigation(7)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Settimana successiva">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <StatBox label="Lavorati" value={workDays} bgColor="bg-teal-100 dark:bg-teal-900/50" textColor="text-teal-700 dark:text-teal-300" />
                    <StatBox label="Ferie" value={vacationDays} bgColor="bg-sky-100 dark:bg-sky-900/50" textColor="text-sky-700 dark:text-sky-300" />
                    <StatBox label="Permessi" value={permitDays} bgColor="bg-indigo-100 dark:bg-indigo-900/50" textColor="text-indigo-700 dark:text-indigo-300" />
                    <StatBox label="Riposi" value={restDays} bgColor="bg-pink-100 dark:bg-pink-900/50" textColor="text-pink-700 dark:text-pink-300" />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Ore Totali Lavorate</p>
                    <p className="text-5xl font-bold text-slate-800 dark:text-white">{formatDuration(totalWorkMs)}</p>
                </div>

                {hasExtraHours && (
                    <div className="pt-4 border-t border-dashed border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="text-center">
                            <p className="text-md font-semibold text-orange-600 dark:text-orange-400">Riepilogo Ore Extra</p>
                            <p className="text-4xl font-bold text-orange-500 dark:text-orange-400">{formatDuration(totalExtraMs)}</p>
                        </div>
                        
                        <div className="space-y-2 px-4 bg-gray-50 dark:bg-slate-700/50 py-3 rounded-lg">
                            <h5 className="text-sm font-bold text-center text-gray-700 dark:text-slate-300 mb-2">Dettaglio Tipologie</h5>
                            {excessHoursMs > 0 && <OvertimeRow label="Ore Eccedenti" valueMs={excessHoursMs} color="text-cyan-500 dark:text-cyan-400" />}
                            {diurnal > 0 && <OvertimeRow label="Straordinario Diurno" valueMs={diurnal} color="text-orange-500 dark:text-orange-400" />}
                            {nocturnal > 0 && <OvertimeRow label="Straordinario Notturno" valueMs={nocturnal} color="text-indigo-500 dark:text-indigo-400" />}
                            {holiday > 0 && <OvertimeRow label="Straordinario Festivo" valueMs={holiday} color="text-yellow-500 dark:text-yellow-400" />}
                            {nocturnalHoliday > 0 && <OvertimeRow label="Straordinario Fest. Notturno" valueMs={nocturnalHoliday} color="text-blue-500 dark:text-blue-400" />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
});
WeeklySummary.displayName = 'WeeklySummary';

export default WeeklySummary;

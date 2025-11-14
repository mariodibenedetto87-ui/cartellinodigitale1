import React, { useMemo } from 'react';
import { AllTimeLogs, AllDayInfo, StatusItem, WorkSettings } from '../../types';
import { formatDateKey, isSameDay, getShiftDetails, calculateWorkSummary, addDays } from '../../utils/timeUtils';
// FIX: Corrected function name from getLeaveTypeDetails to getStatusItemDetails.
import { getStatusItemDetails } from '../../utils/leaveUtils';
import { getYearMatrix } from '../../utils/calendarUtils';

interface YearViewProps {
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    workSettings: WorkSettings;
    selectedDate: Date;
    displayDate: Date;
    zoomLevel: number;
    onDateSelect: (date: Date) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    statusItems: StatusItem[];
    activeFilter: string | null;
}

const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const MinusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

const getWorkdayHeatmapColor = (workMs: number, standardDayHours: number): string => {
    if (workMs <= 0) return 'bg-gray-200 dark:bg-slate-700/50';
    const standardDayMs = standardDayHours * 60 * 60 * 1000;
    const ratio = workMs / standardDayMs;

    if (ratio < 0.25) return 'bg-teal-200 dark:bg-teal-900';
    if (ratio < 0.75) return 'bg-teal-300 dark:bg-teal-800';
    if (ratio < 1.0) return 'bg-teal-400 dark:bg-teal-700';
    if (ratio < 1.25) return 'bg-teal-500 dark:bg-teal-600';
    return 'bg-teal-600 dark:bg-teal-500';
};


const YearView: React.FC<YearViewProps> = ({ allLogs, allDayInfo, workSettings, selectedDate, displayDate, zoomLevel, onDateSelect, onZoomIn, onZoomOut, statusItems, activeFilter }) => {
    const year = displayDate.getFullYear();
    const yearMatrix = useMemo(() => getYearMatrix(year), [year]);
    const weekDays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

    const dayDataCache = useMemo(() => new Map<string, string>(), [allLogs, allDayInfo, workSettings, statusItems]);

    const getDayStatusColor = (day: Date | null): string => {
        if (!day) return 'bg-gray-100 dark:bg-slate-800/50';
        
        const dateKey = formatDateKey(day);
        if (dayDataCache.has(dateKey)) {
            return dayDataCache.get(dateKey)!;
        }

        const info = allDayInfo[dateKey];
        const log = allLogs[dateKey];

        let color: string;

        if (info?.onCall) {
            color = 'bg-blue-400 dark:bg-blue-600';
        } else if (info?.leave?.type) {
            color = getStatusItemDetails(info.leave.type, statusItems).bgColor;
        } else if (info?.shift) {
            // FIX: Use getShiftDetails with shifts from workSettings.
            color = getShiftDetails(info.shift, workSettings.shifts)?.bgColor || 'bg-gray-200 dark:bg-slate-700/50';
        } else if (log && log.length > 0) {
            const nextDayInfo = allDayInfo[formatDateKey(addDays(day, 1))];
            const { summary } = calculateWorkSummary(day, log, workSettings, info, nextDayInfo);
            color = getWorkdayHeatmapColor(summary.totalWorkMs, workSettings.standardDayHours);
        } else {
            color = 'bg-gray-200 dark:bg-slate-700/50';
        }
        
        dayDataCache.set(dateKey, color);
        return color;
    };

    const gridClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    }[zoomLevel] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

    const dayTextClasses = {
        1: 'text-sm',
        2: 'text-xs',
        3: 'text-xs',
        4: 'text-[10px]',
    }[zoomLevel] || 'text-[10px]';

    return (
        <div className="relative">
            <div className={`grid ${gridClasses} gap-6 p-4`}>
                {yearMatrix.map((monthData, monthIndex) => (
                    <div key={monthIndex} className="bg-white dark:bg-slate-900/50 rounded-lg p-3">
                        <h4 className="font-bold text-center text-teal-500 dark:text-teal-400 mb-2">
                            {new Date(year, monthIndex).toLocaleDateString('it-IT', { month: 'long' })}
                        </h4>
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {weekDays.map((wd, i) => <span key={`${wd}-${i}`} className="text-xs text-gray-400 dark:text-slate-500">{wd}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {monthData.map((day, dayIndex) => {
                                if (!day) {
                                  return <div key={dayIndex} className="w-full h-full bg-gray-100 dark:bg-slate-800/50"></div>;
                                }
                                const isSelected = isSameDay(day, selectedDate);
                                const color = getDayStatusColor(day);
                                const info = allDayInfo[formatDateKey(day)];
                                const isMatch = !activeFilter || (info?.shift === activeFilter) || (info?.leave?.type === activeFilter) || (activeFilter === 'onCall' && info?.onCall);
                                return (
                                    <div key={dayIndex} className="relative group w-full aspect-square">
                                        <button 
                                            onClick={() => onDateSelect(day)}
                                            aria-label={`Seleziona ${day.toLocaleDateString('it-IT')}`}
                                            className={`w-full h-full rounded-sm transition-all hover:scale-125 hover:z-10 ${color} ${isSelected ? 'ring-2 ring-teal-500 dark:ring-white' : ''} flex items-center justify-center ${activeFilter && !isMatch ? 'opacity-20' : ''}`}
                                        >
                                            <span className={`${dayTextClasses} text-slate-800 dark:text-white/70 group-hover:font-bold`}>{day.getDate()}</span>
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 dark:bg-slate-950 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" role="tooltip">
                                            {day.toLocaleDateString('it-IT')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute bottom-6 right-6 z-10 flex items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-slate-700/50">
                <button 
                    onClick={onZoomIn} 
                    disabled={zoomLevel === 1}
                    className="p-3 text-slate-700 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 disabled:text-gray-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Ingrandisci"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-slate-600"></div>
                <button 
                    onClick={onZoomOut} 
                    disabled={zoomLevel === 4}
                    className="p-3 text-slate-700 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 disabled:text-gray-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Riduci"
                >
                    <MinusIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default YearView;
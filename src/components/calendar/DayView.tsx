import React from 'react';
import { AllTimeLogs, AllDayInfo, TimeEntry, StatusItem, WorkSettings, ManualOvertimeEntry } from '../../types';
import { formatDateKey, getShiftDetails, calculateWorkSummary, formatDuration, addDays } from '../../utils/timeUtils';
import { getStatusItemDetails } from '../../utils/leaveUtils';
import { PhoneIcon } from '../ShiftIcons';

interface DayViewProps {
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    selectedDate: Date;
    statusItems: StatusItem[];
    activeFilter: string | null;
    workSettings: WorkSettings;
    manualOvertimeEntries: ManualOvertimeEntry[];
}

const DayView: React.FC<DayViewProps> = ({ allLogs, allDayInfo, selectedDate, statusItems, activeFilter, workSettings, manualOvertimeEntries }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00
    const dateKey = formatDateKey(selectedDate);
    const logs = allLogs[dateKey] || [];
    const dayInfo = allDayInfo[dateKey];
    
    // Gestione eventi multipli con retrocompatibilità
    const events = dayInfo?.events || [];
    const hasMultipleEvents = events.length > 0;
    
    // Se non ci sono eventi multipli, usa la vecchia struttura
    const legacyShift = !hasMultipleEvents && dayInfo?.shift;
    const legacyLeave = !hasMultipleEvents && dayInfo?.leave;
    const legacyOnCall = !hasMultipleEvents && dayInfo?.onCall;
    
    const isMatch = !activeFilter || 
        (hasMultipleEvents && events.some(e => 
            (e.shift === activeFilter) || 
            (e.leave?.type === activeFilter) || 
            (activeFilter === 'onCall' && e.onCall)
        )) ||
        (legacyShift === activeFilter) || 
        (legacyLeave && legacyLeave.type === activeFilter) || 
        (activeFilter === 'onCall' && legacyOnCall);
    
    const nextDayInfo = allDayInfo[formatDateKey(addDays(selectedDate, 1))];
    const { summary } = calculateWorkSummary(selectedDate, logs, workSettings, dayInfo, nextDayInfo, manualOvertimeEntries);
    const totalWorkMs = summary.totalWorkMs + summary.nullHoursMs;
    const totalOvertimeMs = summary.overtimeDiurnalMs + summary.overtimeNocturnalMs + summary.overtimeHolidayMs + summary.overtimeNocturnalHolidayMs;


    const getWorkBlocks = (entries: TimeEntry[]) => {
        if (!entries || entries.length === 0) return [];
        const blocks = [];
        let lastInTime: Date | null = null;
        const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (const entry of sortedEntries) {
            if (entry.type === 'in') {
                lastInTime = new Date(entry.timestamp);
            } else if (entry.type === 'out' && lastInTime) {
                const startMinutes = lastInTime.getHours() * 60 + lastInTime.getMinutes();
                const endMinutes = new Date(entry.timestamp).getHours() * 60 + new Date(entry.timestamp).getMinutes();
                const durationMinutes = endMinutes - startMinutes;
                if (durationMinutes > 0) {
                     blocks.push({
                        topRem: (startMinutes / 60) * 4, // Each hour is h-16 (4rem)
                        heightRem: (durationMinutes / 60) * 4,
                        label: `${lastInTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit'})} - ${new Date(entry.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit'})}`
                    });
                }
                lastInTime = null;
            }
        }
        return blocks;
    };
    
    const workBlocks = getWorkBlocks(logs);
    
    // Gestione shift multipli e legacy
    const shiftBlocks: Array<{
        topRem: number;
        heightRem: number;
        label: string;
        bgColor: string;
        borderColor: string;
        startTime: string;
        endTime: string;
    }> = [];
    
    if (hasMultipleEvents) {
        // Processa tutti gli eventi shift
        events.forEach((event) => {
            if (event.type === 'shift' && event.shift) {
                const shiftDetails = getShiftDetails(event.shift, workSettings.shifts);
                if (shiftDetails && shiftDetails.startHour !== null && shiftDetails.endHour !== null) {
                    const startMinutes = shiftDetails.startHour * 60;
                    const durationMinutes = (shiftDetails.endHour * 60) - startMinutes;
                    shiftBlocks.push({
                        topRem: (startMinutes / 60) * 4,
                        heightRem: (durationMinutes / 60) * 4,
                        label: `Turno: ${shiftDetails.label}`,
                        bgColor: shiftDetails.bgColor,
                        borderColor: shiftDetails.borderColor,
                        startTime: `${String(Math.floor(shiftDetails.startHour)).padStart(2, '0')}:${String(Math.round((shiftDetails.startHour % 1) * 60)).padStart(2, '0')}`,
                        endTime: `${String(Math.floor(shiftDetails.endHour)).padStart(2, '0')}:${String(Math.round((shiftDetails.endHour % 1) * 60)).padStart(2, '0')}`
                    });
                }
            }
        });
    } else if (legacyShift) {
        // Modalità legacy - singolo shift
        const shiftDetails = getShiftDetails(legacyShift, workSettings.shifts);
        if (shiftDetails && shiftDetails.startHour !== null && shiftDetails.endHour !== null) {
            const startMinutes = shiftDetails.startHour * 60;
            const durationMinutes = (shiftDetails.endHour * 60) - startMinutes;
            shiftBlocks.push({
                topRem: (startMinutes / 60) * 4,
                heightRem: (durationMinutes / 60) * 4,
                label: `Turno: ${shiftDetails.label}`,
                bgColor: shiftDetails.bgColor,
                borderColor: shiftDetails.borderColor,
                startTime: `${String(Math.floor(shiftDetails.startHour)).padStart(2, '0')}:${String(Math.round((shiftDetails.startHour % 1) * 60)).padStart(2, '0')}`,
                endTime: `${String(Math.floor(shiftDetails.endHour)).padStart(2, '0')}:${String(Math.round((shiftDetails.endHour % 1) * 60)).padStart(2, '0')}`
            });
        }
    }
    
    // Gestione leave multipli e legacy
    const leaveEvents = hasMultipleEvents 
        ? events.filter(e => e.type === 'leave' && e.leave).map(e => e.leave!)
        : (legacyLeave ? [legacyLeave] : []);
    
    // Gestione onCall multipli e legacy
    const hasOnCall = hasMultipleEvents 
        ? events.some(e => e.type === 'onCall' && e.onCall)
        : Boolean(legacyOnCall);
    
    if (activeFilter && !isMatch) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-800/50 text-center p-4">
                <h3 className="text-xl font-bold text-gray-700 dark:text-slate-300">Nessuna Corrispondenza</h3>
                <p className="text-gray-500 dark:text-slate-400">Questo giorno non corrisponde al filtro attivo.</p>
            </div>
        );
    }

    // Visualizzazione leave quando non ci sono timbrature
    if (leaveEvents.length > 0 && workBlocks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-800/50 p-4">
                <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg space-y-4">
                    {leaveEvents.map((leave, index) => {
                        const leaveDetails = getStatusItemDetails(leave.type, statusItems);
                        return (
                            <div key={index}>
                                <div className={`inline-block px-6 py-3 rounded-lg text-2xl font-bold ${leaveDetails.textColor} ${leaveDetails.bgColor} mb-2`}>
                                    {leaveDetails.label}
                                </div>
                                {leave.hours && (
                                    <p className="text-gray-500 dark:text-slate-400">Permesso di {leave.hours} ore</p>
                                )}
                            </div>
                        );
                    })}
                    {leaveEvents.length === 1 && !leaveEvents[0].hours && (
                        <p className="text-gray-500 dark:text-slate-400">Giorno di assenza pianificato</p>
                    )}
                </div>
            </div>
        );
    }

    if (workBlocks.length === 0 && shiftBlocks.length === 0 && !hasOnCall) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-800/50 p-4">
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-slate-200">Nessuna Attività</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Nessuna timbratura o turno pianificato per questo giorno.</p>
                </div>
            </div>
        );
    }


    const timelineHeight = 24 * 4; // 24 hours * 4rem per hour
    return (
        <div className="flex flex-col h-full">
            {(totalWorkMs > 0 || dayInfo?.onCall) && (
                <div className="p-4 border-b border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0 space-y-3">
                    {totalWorkMs > 0 && (
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Riepilogo Presenza</p>
                                <p className="text-3xl font-bold text-slate-800 dark:text-white">{formatDuration(totalWorkMs)}</p>
                            </div>
                            <div className="text-right text-xs space-y-0.5">
                                {summary.standardWorkMs > 0 && <div><span>Ordinarie:</span><span className="font-semibold text-slate-700 dark:text-slate-200 ml-2">{formatDuration(summary.standardWorkMs)}</span></div>}
                                {summary.excessHoursMs > 0 && <div><span>Eccedenti:</span><span className="font-semibold text-cyan-500 dark:text-cyan-400 ml-2">{formatDuration(summary.excessHoursMs)}</span></div>}
                                {totalOvertimeMs > 0 && <div><span>Straordinario:</span><span className="font-semibold text-orange-500 dark:text-orange-400 ml-2">{formatDuration(totalOvertimeMs)}</span></div>}
                            </div>
                        </div>
                    )}
                    {dayInfo?.onCall && (
                        <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/50 p-3 rounded-lg flex items-center space-x-3">
                            <PhoneIcon className="w-6 h-6 flex-shrink-0" />
                            <span className="text-sm font-semibold">
                                Giorno di Reperibilità (22:00 - 07:00 del giorno successivo)
                            </span>
                        </div>
                    )}
                </div>
            )}
            <div className="flex-grow overflow-y-auto">
                <div className="flex p-4">
                    <div className="w-16 text-right pr-2 text-sm text-gray-500 dark:text-slate-400 flex-shrink-0" style={{ height: `${timelineHeight}rem` }}>
                        {hours.map(hour => (
                            <div key={hour} className="h-16 flex items-start justify-end pt-1 relative -top-3">
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 border-l border-gray-200 dark:border-slate-700/50 relative" style={{ height: `${timelineHeight}rem` }}>
                        {hours.map(hour => (
                            <div key={hour} className="h-16 border-t border-gray-200 dark:border-slate-700/50"></div>
                        ))}
                        {shiftBlocks.map((shiftBlock, index) => (
                            <div 
                                key={index}
                                className={`absolute w-full border-2 border-dashed rounded-lg p-2 text-sm text-slate-800 dark:text-white/80 overflow-hidden ${shiftBlock.bgColor} ${shiftBlock.borderColor}`}
                                style={{ top: `${shiftBlock.topRem}rem`, height: `${shiftBlock.heightRem}rem`, left: '0.5rem', width: 'calc(100% - 1rem)' }}>
                                <div className="font-semibold">{shiftBlock.label}</div>
                                <div className="text-xs opacity-80">{shiftBlock.startTime} - {shiftBlock.endTime}</div>
                            </div>
                        ))}
                        {workBlocks.map((block, i) => (
                            <div key={i}
                                className="absolute w-full bg-teal-500/90 rounded-lg p-2 text-xs text-white overflow-hidden z-10 shadow-md"
                                style={{ top: `${block.topRem}rem`, height: `${block.heightRem}rem`, left: '0.5rem', width: 'calc(100% - 1rem)' }}>
                                <div className="font-mono font-bold">{block.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayView;
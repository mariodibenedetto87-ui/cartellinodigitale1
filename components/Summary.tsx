import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TimeEntry, WorkSettings, DayInfo, CustomLeaveType, LeaveType, StatusItem, ManualOvertimeEntry, Shift } from '../types';
import { calculateWorkSummary, formatDuration, getShiftDetails } from '../utils/timeUtils';
import EditTimeEntryModal from './EditTimeEntryModal';
import { getStatusItemDetails } from '../utils/leaveUtils';
import { generateGoogleCalendarUrl, CalendarEvent } from '../utils/calendarUtils';
import { generateSingleEventICS } from '../utils/icsUtils';


interface SummaryProps {
    date: Date;
    entries: TimeEntry[];
    dayInfo?: DayInfo;
    nextDayInfo?: DayInfo;
    workSettings: WorkSettings;
    statusItems: StatusItem[];
    manualOvertimeEntries: ManualOvertimeEntry[];
    onEditEntry: (dateKey: string, entryIndex: number, newTimestamp: Date, newType: 'in' | 'out') => void;
    onDeleteEntry: (dateKey: string, entryIndex: number) => void;
    onOpenAddEntryModal: (date: Date) => void;
    onOpenAddOvertimeModal: (date: Date) => void;
    onDeleteManualOvertime: (dateKey: string, entryId: string) => void;
    onOpenQuickLeaveModal: (date: Date) => void;
}

const CalendarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
    </svg>
);


const Summary: React.FC<SummaryProps> = ({ date, entries, dayInfo, nextDayInfo, workSettings, statusItems, manualOvertimeEntries, onEditEntry, onDeleteEntry, onOpenAddEntryModal, onOpenAddOvertimeModal, onDeleteManualOvertime, onOpenQuickLeaveModal }) => {
    const [editingEntry, setEditingEntry] = useState<{ entry: TimeEntry; index: number } | null>(null);
    const [isCalendarPopoverOpen, setCalendarPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const calendarButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !calendarButtonRef.current?.contains(event.target as Node)) {
                setCalendarPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const dateKey = date.toISOString().split('T')[0];
    const { summary, intervals } = calculateWorkSummary(date, entries, workSettings, dayInfo, nextDayInfo, manualOvertimeEntries);
    
    // The "gross" total time is the sum of payable time (totalWorkMs) and non-payable pre-shift time (nullHoursMs).
    // This gives the user a clear view of total time on-site vs. what's broken down for pay.
    const grossTotalMs = summary.totalWorkMs + summary.nullHoursMs;
    const totalOvertimeMs = summary.overtimeDiurnalMs + summary.overtimeNocturnalMs + summary.overtimeHolidayMs + summary.overtimeNocturnalHolidayMs;

    const standardDayMs = workSettings.standardDayHours * 3600 * 1000;
    const deficitMs = standardDayMs - summary.totalWorkMs;
    const showDeficitWarning = entries.length > 0 && (!dayInfo?.leave || !!dayInfo.leave.hours) && deficitMs > 60000;


    const intervalMap = useMemo(() => 
        new Map(intervals.filter(i => i.closingEntryId).map(i => [i.closingEntryId, i]))
    , [intervals]);

    const firstIn = entries.find(e => e.type === 'in');
    const lastOut = [...entries].reverse().find(e => e.type === 'out');
    
    const formatTime = (timestamp: Date) => new Date(timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const getLeaveLabel = (leave: LeaveType) => {
        const details = getStatusItemDetails(leave, statusItems);
        return details.label;
    };

    const hasEntries = entries && entries.length > 0;
    const hasManualOvertime = manualOvertimeEntries && manualOvertimeEntries.length > 0;

    const getEventDetailsForCalendar = (): CalendarEvent | null => {
        if (dayInfo?.leave) {
            const leaveLabel = getLeaveLabel(dayInfo.leave.type);
            let title = leaveLabel;
            if (dayInfo.leave.hours) {
                title += ` (${dayInfo.leave.hours}h)`;
            }
            return {
                title: title,
                start: date,
                end: date, // Ignored for all-day
                isAllDay: true,
                description: `Giorno di ${leaveLabel} pianificato in Timecard Pro.`
            };
        }
    
        if (dayInfo?.shift && !hasEntries) {
            const shiftDetails = getShiftDetails(dayInfo.shift, workSettings.shifts);
            if (!shiftDetails) return null;
            if (dayInfo.shift === 'rest') {
                 return { title: 'Riposo', start: date, end: date, isAllDay: true, description: 'Giorno di riposo pianificato in Timecard Pro.' };
            }
            if (shiftDetails.startHour !== null && shiftDetails.endHour !== null) {
                const startDate = new Date(date);
                startDate.setHours(shiftDetails.startHour, 0, 0, 0);
                const endDate = new Date(date);
                endDate.setHours(shiftDetails.endHour, 0, 0, 0);
                return {
                    title: `Turno: ${shiftDetails.name}`,
                    start: startDate,
                    end: endDate,
                    isAllDay: false,
                    description: `Turno di ${shiftDetails.name} pianificato in Timecard Pro.`
                };
            }
        }
        
        if (hasEntries && firstIn && lastOut) {
            const { summary: workSummary } = calculateWorkSummary(date, entries, workSettings, dayInfo, nextDayInfo, manualOvertimeEntries);
            const overtimeMs = workSummary.overtimeDiurnalMs + workSummary.overtimeNocturnalMs + workSummary.overtimeHolidayMs + workSummary.overtimeNocturnalHolidayMs;
            const excessMs = workSummary.excessHoursMs;
            let description = `Ore totali lavorate: ${formatDuration(workSummary.totalWorkMs)}.`;
            if (excessMs > 0) {
                description += `\nOre Eccedenti: ${formatDuration(excessMs)}.`;
            }
            if (overtimeMs > 0) {
                description += `\nOre di straordinario: ${formatDuration(overtimeMs)}.`;
            }
            return {
                title: 'Orario di Lavoro',
                start: new Date(firstIn.timestamp),
                end: new Date(lastOut.timestamp),
                isAllDay: false,
                description: description
            };
        }
    
        return null;
    }

    const eventDetails = getEventDetailsForCalendar();
    
    const handleDownloadIcs = () => {
        if (!eventDetails) return;
        const icsContent = generateSingleEventICS(
            eventDetails.title,
            eventDetails.description,
            eventDetails.start,
            eventDetails.end,
            eventDetails.isAllDay
        );
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `${eventDetails.title.replace(/\s+/g, '_')}_${dateKey}.ics`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setCalendarPopoverOpen(false);
    };

    const handleGoogleCalendar = () => {
        if (!eventDetails) return;
        const url = generateGoogleCalendarUrl(eventDetails);
        window.open(url, '_blank', 'noopener,noreferrer');
        setCalendarPopoverOpen(false);
    };

    const overtimeTypeLabels: Record<string, string> = {
        'diurnal': 'Diurno',
        'nocturnal': 'Notturno',
        'holiday': 'Festivo',
        'nocturnal-holiday': 'Festivo Notturno'
    };


    // If it's a leave day and there are NO work entries, show the leave-only card.
    if (dayInfo?.leave && !hasEntries && !hasManualOvertime) {
        const leaveDetails = getStatusItemDetails(dayInfo.leave.type, statusItems);
        const leaveLabel = leaveDetails.label;
        return (
             <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 h-full transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">Riepilogo del Giorno</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{date.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                     <button
                        ref={calendarButtonRef}
                        onClick={() => setCalendarPopoverOpen(prev => !prev)}
                        disabled={!eventDetails}
                        className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        aria-label="Aggiungi al calendario"
                      >
                          <CalendarIcon className="w-5 h-5" />
                      </button>
                </div>
                {isCalendarPopoverOpen && (
                  <div ref={popoverRef} className="absolute top-16 right-6 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-20 animate-fade-in-up py-1">
                       <button onClick={handleGoogleCalendar} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600">Google Calendar</button>
                       <button onClick={handleDownloadIcs} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600">Apple/Outlook (.ics)</button>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <leaveDetails.Icon className="w-12 h-12 mb-3" />
                    <span className={`text-xl font-bold text-center ${leaveDetails.textColor}`}>{leaveLabel}</span>
                    <p className="text-gray-500 dark:text-slate-400">
                        {dayInfo.leave.hours ? `Permesso di ${dayInfo.leave.hours} ore` : 'Giorno di assenza'}
                    </p>
                </div>
            </div>
        )
    }

    // Otherwise, show the full summary. If it's a leave day with entries, a banner will be shown.
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 h-full transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">Riepilogo del Giorno</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{date.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="relative">
                     <button
                        ref={calendarButtonRef}
                        onClick={() => setCalendarPopoverOpen(prev => !prev)}
                        disabled={!eventDetails}
                        className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        aria-label="Aggiungi al calendario"
                      >
                          <CalendarIcon className="w-5 h-5" />
                      </button>
                      {isCalendarPopoverOpen && (
                          <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-20 animate-fade-in-up py-1">
                               <button onClick={handleGoogleCalendar} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600">Google Calendar</button>
                               <button onClick={handleDownloadIcs} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600">Apple/Outlook (.ics)</button>
                          </div>
                      )}
                </div>
            </div>

            {showDeficitWarning && (
                <div className="my-4 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-500/50">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-amber-500 dark:text-amber-400">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-amber-800 dark:text-amber-200">Ore lavorate inferiori allo standard</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Mancano <span className="font-bold">{formatDuration(deficitMs)}</span> per completare l'orario. Puoi giustificare l'assenza parziale.
                            </p>
                            <button 
                                onClick={() => onOpenQuickLeaveModal(date)}
                                className="mt-3 px-3 py-1.5 text-sm font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                            >
                                Giustifica Assenza
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner for when work is logged on a leave day (e.g., holiday) */}
            {dayInfo?.leave && (hasEntries || hasManualOvertime) && (() => {
                const leaveDetails = getStatusItemDetails(dayInfo.leave.type, statusItems);
                let leaveLabel = leaveDetails.label;
                if (dayInfo.leave.hours) {
                    leaveLabel += ` (${dayInfo.leave.hours}h)`;
                }
                const bannerColors = "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50";
                return (
                    <div className={`my-4 p-3 rounded-lg flex items-center space-x-3 ${bannerColors}`}>
                        <leaveDetails.Icon className="w-6 h-6 flex-shrink-0" />
                        <span className="text-sm font-semibold">
                            Lavoro registrato durante: {leaveLabel}
                        </span>
                    </div>
                );
            })()}

            <div className="space-y-6">
                {/* Summary Widget with Detailed Stats */}
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Ore Lavorate Totali</p>
                        <p className="text-5xl font-bold text-slate-800 dark:text-white">{formatDuration(grossTotalMs)}</p>
                    </div>
                     
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                        <h4 className="text-sm font-semibold text-center text-gray-600 dark:text-slate-300 mb-3">Riepilogo Ore</h4>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                                <span>Primo Ingresso</span>
                                <span className="font-semibold text-right text-slate-700 dark:text-slate-300">{firstIn ? formatTime(firstIn.timestamp) : 'N/D'}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                                <span>Ultima Uscita</span>
                                <span className="font-semibold text-right text-slate-700 dark:text-slate-300">{lastOut ? formatTime(lastOut.timestamp) : 'N/D'}</span>
                            </div>

                            {(summary.standardWorkMs > 0 || summary.excessHoursMs > 0 || totalOvertimeMs > 0 || summary.nullHoursMs > 0) && (
                               <div className="!my-3 border-b border-dashed border-gray-300 dark:border-slate-600"></div>
                            )}

                            <div className="space-y-1.5">
                                {summary.nullHoursMs > 0 && (
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                          Ore Nulle (pre-turno)
                                        </span>
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">{formatDuration(summary.nullHoursMs)}</span>
                                    </div>
                                )}
                                {summary.standardWorkMs > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 dark:text-slate-300">Ore Ordinarie</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{formatDuration(summary.standardWorkMs)}</span>
                                    </div>
                                )}
                                {summary.excessHoursMs > 0 && (
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium">
                                          <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                          Ore Eccedenti
                                        </span>
                                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatDuration(summary.excessHoursMs)}</span>
                                    </div>
                                )}
                                
                                {totalOvertimeMs > 0 && (
                                    <div className="pt-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-slate-300 font-medium">Totale Straordinario</span>
                                            <span className="font-bold text-orange-600 dark:text-orange-400">{formatDuration(totalOvertimeMs)}</span>
                                        </div>
                                        <div className="pl-4 mt-1.5 space-y-1 text-sm border-l-2 border-orange-200 dark:border-orange-800/50 ml-1">
                                            {summary.overtimeDiurnalMs > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                      Diurno
                                                    </span>
                                                    <span className="font-semibold text-orange-500 dark:text-orange-400">{formatDuration(summary.overtimeDiurnalMs)}</span>
                                                </div>
                                            )}
                                            {summary.overtimeNocturnalMs > 0 && (
                                                 <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                      Notturno
                                                    </span>
                                                    <span className="font-semibold text-indigo-500 dark:text-indigo-400">{formatDuration(summary.overtimeNocturnalMs)}</span>
                                                </div>
                                            )}
                                            {summary.overtimeHolidayMs > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                      Festivo
                                                    </span>
                                                    <span className="font-semibold text-yellow-500 dark:text-yellow-400">{formatDuration(summary.overtimeHolidayMs)}</span>
                                                </div>
                                            )}
                                            {summary.overtimeNocturnalHolidayMs > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                      Festivo Notturno
                                                    </span>
                                                    <span className="font-semibold text-blue-500 dark:text-blue-400">{formatDuration(summary.overtimeNocturnalHolidayMs)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timestamps List */}
                <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-slate-300">Timbrature del Giorno</h4>
                        <button onClick={() => onOpenAddEntryModal(date)} className="text-sm bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 font-semibold py-1 px-3 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900 transition-colors">
                            Aggiungi
                        </button>
                    </div>
                    {entries.length > 0 ? (
                        <ul className="space-y-2">
                            {entries.map((entry, index) => {
                                const intervalForEntry = entry.type === 'out' ? intervalMap.get(entry.id) : undefined;
                                const hasIntervalDetails = intervalForEntry && (intervalForEntry.nullHoursMs > 0 || intervalForEntry.standardWorkMs > 0 || intervalForEntry.excessHoursMs > 0 || intervalForEntry.overtimeDiurnalMs > 0 || intervalForEntry.overtimeNocturnalMs > 0 || intervalForEntry.overtimeHolidayMs > 0 || intervalForEntry.overtimeNocturnalHolidayMs > 0);

                                return (
                                <li key={entry.id} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center group">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${entry.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">{new Date(entry.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{entry.type === 'in' ? 'Entrata' : 'Uscita'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingEntry({ entry, index })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="Modifica timbratura">
                                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => onDeleteEntry(dateKey, index)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Elimina timbratura">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    {hasIntervalDetails && (
                                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-slate-600">
                                            <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 pl-1">Riepilogo Intervallo</h5>
                                            <dl className="text-xs space-y-0.5 pl-1">
                                                {intervalForEntry.nullHoursMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Nulle (pre-turno):</dt><dd className="font-semibold text-slate-500 dark:text-slate-400">{formatDuration(intervalForEntry.nullHoursMs)}</dd></div>}
                                                {intervalForEntry.standardWorkMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Ordinario:</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{formatDuration(intervalForEntry.standardWorkMs)}</dd></div>}
                                                {intervalForEntry.excessHoursMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Eccedenti:</dt><dd className="font-semibold text-cyan-500 dark:text-cyan-400">{formatDuration(intervalForEntry.excessHoursMs)}</dd></div>}
                                                {intervalForEntry.overtimeDiurnalMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Straord. Diurno:</dt><dd className="font-semibold text-orange-500 dark:text-orange-400">{formatDuration(intervalForEntry.overtimeDiurnalMs)}</dd></div>}
                                                {intervalForEntry.overtimeNocturnalMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Straord. Notturno:</dt><dd className="font-semibold text-indigo-500 dark:text-indigo-400">{formatDuration(intervalForEntry.overtimeNocturnalMs)}</dd></div>}
                                                {intervalForEntry.overtimeHolidayMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Straord. Festivo:</dt><dd className="font-semibold text-yellow-500 dark:text-yellow-400">{formatDuration(intervalForEntry.overtimeHolidayMs)}</dd></div>}
                                                {intervalForEntry.overtimeNocturnalHolidayMs > 0 && <div className="flex justify-between"><dt className="text-gray-600 dark:text-slate-400">Straord. Fest. Nott.:</dt><dd className="font-semibold text-blue-500 dark:text-blue-400">{formatDuration(intervalForEntry.overtimeNocturnalHolidayMs)}</dd></div>}
                                            </dl>
                                        </div>
                                    )}
                                </li>
                            )})}
                        </ul>
                    ) : (
                        !hasManualOvertime && (
                            <div className="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <p className="text-gray-500 dark:text-slate-400">Nessuna timbratura registrata per questo giorno.</p>
                            </div>
                        )
                    )}
                </div>

                {/* Manual Overtime List */}
                <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-slate-300">Straordinario Manuale</h4>
                        <button onClick={() => onOpenAddOvertimeModal(date)} className="text-sm bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-semibold py-1 px-3 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900 transition-colors">
                            Aggiungi
                        </button>
                    </div>
                    {manualOvertimeEntries.length > 0 ? (
                        <ul className="space-y-2">
                            {manualOvertimeEntries.map(entry => (
                                <li key={entry.id} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{formatDuration(entry.durationMs)}</p>
                                            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold">{overtimeTypeLabels[entry.type] || 'Straordinario'}</p>
                                            {entry.note && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">"{entry.note}"</p>}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onDeleteManualOvertime(dateKey, entry.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Elimina straordinario manuale">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        entries.length > 0 && (
                            <div className="text-center py-4 bg-gray-50/50 dark:bg-slate-700/20 rounded-lg">
                                <p className="text-xs text-gray-400 dark:text-slate-500">Nessuno straordinario manuale aggiunto.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {editingEntry && (
                <EditTimeEntryModal
                    entry={editingEntry.entry}
                    onClose={() => setEditingEntry(null)}
                    onSave={(newTimestamp, newType) => {
                        onEditEntry(dateKey, editingEntry.index, newTimestamp, newType);
                        setEditingEntry(null);
                    }}
                />
            )}
        </div>
    );
};

export default Summary;
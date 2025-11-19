import React, { useRef, useEffect } from 'react';
import { AllTimeLogs, AllDayInfo, TimeEntry, WorkSettings, StatusItem } from '../../types';
import { startOfWeek, addDays, formatDateKey, isSameDay, getShiftDetails } from '../../utils/timeUtils';
import { PhoneIcon } from '../ShiftIcons';
import { getStatusItemDetails } from '../../utils/leaveUtils';

interface WeekViewProps {
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    selectedDate: Date;
    displayDate: Date;
    workSettings: WorkSettings;
    statusItems: StatusItem[];
    onDateSelect: (date: Date) => void;
    activeFilter: string | null;
}

const WeekView: React.FC<WeekViewProps> = ({ allLogs, allDayInfo, selectedDate, displayDate, workSettings, statusItems, onDateSelect, activeFilter }) => {
    const weekStart = startOfWeek(displayDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (timelineContainerRef.current) {
            // Each hour has a height of h-16 (4rem), so 6 AM is at 6 * 4rem
            // Assuming 1rem = 16px for scrollTop. A more robust solution might measure the element.
            timelineContainerRef.current.scrollTop = 6 * 4 * 16;
        }
    }, [displayDate]);

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
                        topRem: (startMinutes / 60) * 4,
                        heightRem: (durationMinutes / 60) * 4,
                        label: `${lastInTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit'})} - ${new Date(entry.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit'})}`
                    });
                }
                lastInTime = null;
            }
        }
        return blocks;
    };

    const timelineHeightRem = hours.length * 4; // 24 hours * 4rem/hour

    return (
        <div ref={timelineContainerRef} className="flex overflow-y-scroll" style={{ height: 'calc(100vh - 150px)' }}>
            <div className="w-16 text-right pr-2 text-sm text-gray-600 dark:text-slate-600 sticky top-0 z-20 bg-white dark:bg-slate-900">
                {/* This is a spacer for the day headers */}
                <div className="h-20"></div>
                {hours.map(hour => (
                    <div key={hour} className="h-16 flex items-start justify-end pt-1 border-t border-gray-200 dark:border-slate-700/50">
                        {`${hour.toString().padStart(2, '0')}:00`}
                    </div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7">
                {weekDays.map(day => {
                    const dateKey = formatDateKey(day);
                    const logs = allLogs[dateKey] || [];
                    const workBlocks = getWorkBlocks(logs);
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    const dayInfo = allDayInfo[dateKey];
                    // FIX: Use getShiftDetails with shifts from workSettings.
                    const shiftDetails = dayInfo?.shift ? getShiftDetails(dayInfo.shift, workSettings.shifts) : null;
                    const isMatch = !activeFilter || (dayInfo?.shift === activeFilter) || (dayInfo?.leave?.type === activeFilter) || (activeFilter === 'onCall' && dayInfo?.onCall);
                    let shiftBlock = null;

                    if (shiftDetails && shiftDetails.startHour !== null && shiftDetails.endHour !== null) {
                        const startMinutes = shiftDetails.startHour * 60;
                        const durationMinutes = (shiftDetails.endHour * 60) - startMinutes;
                        shiftBlock = {
                            topRem: (startMinutes / 60) * 4,
                            heightRem: (durationMinutes / 60) * 4,
                            label: shiftDetails.label,
                            bgColor: shiftDetails.bgColor,
                            borderColor: shiftDetails.borderColor
                        };
                    }

                    return (
                        <div key={dateKey} className={`border-r border-gray-200 dark:border-slate-700/50 relative ${activeFilter && !isMatch ? 'opacity-20' : ''}`} onClick={() => onDateSelect(day)}>
                            <div className={`text-center py-2 border-b border-gray-200 dark:border-slate-700/50 sticky top-0 z-10 transition-colors ${isSelected ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-white dark:bg-slate-900'}`}>
                                <div className="flex flex-col items-center space-y-1">
                                    <div className="flex items-center space-x-2">
                                        {dayInfo?.onCall && <PhoneIcon className="w-4 h-4 text-blue-500" title="Reperibilità" />}
                                        <p className={`text-sm ${isToday ? 'text-teal-500 dark:text-teal-400' : 'text-gray-600 dark:text-slate-600'}`}>{day.toLocaleDateString('it-IT', { weekday: 'short' })}</p>
                                    </div>
                                    {dayInfo?.leave?.type && (
                                        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusItemDetails(dayInfo.leave.type, statusItems).textColor} ${getStatusItemDetails(dayInfo.leave.type, statusItems).bgColor}`}>
                                            {getStatusItemDetails(dayInfo.leave.type, statusItems).label}
                                        </div>
                                    )}
                                    <p className={`text-lg font-semibold ${isToday ? 'text-teal-500 dark:text-teal-400' : 'text-slate-800 dark:text-white'}`}>{day.getDate()}</p>
                                </div>
                            </div>
                            <div className="relative" style={{ height: `${timelineHeightRem}rem` }}>
                                {hours.map(hour => (
                                     <div key={hour} className="h-16 border-t border-gray-200 dark:border-slate-700/50"></div>
                                ))}
                                {shiftBlock && (
                                    <div 
                                        className={`absolute w-[calc(100%-0.5rem)] left-[0.25rem] border-2 border-dashed rounded-lg p-1 text-xs text-slate-800 dark:text-white/80 overflow-hidden ${shiftBlock.bgColor} ${shiftBlock.borderColor}`}
                                        style={{ top: `${shiftBlock.topRem}rem`, height: `${shiftBlock.heightRem}rem` }}>
                                        <div className="font-semibold">{shiftBlock.label}</div>
                                    </div>
                                )}
                                {workBlocks.map((block, i) => (
                                    <div key={i}
                                         className="absolute w-[calc(100%-0.5rem)] left-[0.25rem] bg-teal-500/80 rounded-lg p-1 text-xs text-white overflow-hidden z-10 shadow-md"
                                         style={{ top: `${block.topRem}rem`, height: `${block.heightRem}rem` }}>
                                         <div className="font-mono">{block.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default WeekView;
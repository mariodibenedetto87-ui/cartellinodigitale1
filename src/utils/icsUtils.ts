import { AllTimeLogs, AllDayInfo, WorkSettings, StatusItem } from '../types';
import { formatDateKey, calculateWorkSummary, addDays, formatDuration } from './timeUtils';
import { getStatusItemDetails } from '../../utils/leaveUtils';

// Helper to format date for iCal
const toICSDate = (date: Date, isAllDay: boolean = false): string => {
    if (isAllDay) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    // Format to "YYYYMMDDTHHMMSSZ"
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generates an iCalendar (.ics) string for a single event.
 */
export const generateSingleEventICS = (
    title: string,
    description: string,
    start: Date,
    end: Date,
    isAllDay: boolean = false,
): string => {
    const uid = `${start.toISOString()}-${Math.random().toString(36).substr(2, 9)}@timecardpro.app`;
    const dtStamp = toICSDate(new Date());

    let event: string[];
    if (isAllDay) {
        const nextDay = new Date(start);
        nextDay.setDate(nextDay.getDate() + 1);
        event = [
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART;VALUE=DATE:${toICSDate(start, true)}`,
            `DTEND;VALUE=DATE:${toICSDate(nextDay, true)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
            'END:VEVENT'
        ];
    } else {
        event = [
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART:${toICSDate(start)}`,
            `DTEND:${toICSDate(end)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
            'END:VEVENT'
        ];
    }

    const icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TimecardManagerPro//SingleEvent//EN',
        'CALSCALE:GREGORIAN',
        ...event,
        'END:VCALENDAR'
    ].join('\r\n');

    return icsString;
};

export const generateICS = (
    allLogs: AllTimeLogs,
    allDayInfo: AllDayInfo,
    workSettings: WorkSettings,
    startDate: Date,
    endDate: Date,
    statusItems: StatusItem[]
): string => {
    let icsEvents: string[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const dayInfo = allDayInfo[dateKey];
        const logs = allLogs[dateKey];
        const nextDayInfo = allDayInfo[formatDateKey(addDays(currentDate, 1))];
        const dtStamp = toICSDate(new Date());

        if (dayInfo?.leave || dayInfo?.shift) {
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);

            let summary = '';
            if (dayInfo.leave) {
                const details = getStatusItemDetails(dayInfo.leave.type, statusItems);
                summary = `Assenza: ${details.label}${dayInfo.leave.hours ? ` (${dayInfo.leave.hours}h)` : ''}`;
            } else if (dayInfo.shift) {
                const shiftDetails = workSettings.shifts.find(s => s.id === dayInfo.shift!);
                summary = `Turno: ${shiftDetails?.name}`;
            }
            
            if (summary) {
                 const event = [
                    'BEGIN:VEVENT',
                    `UID:${dateKey}-${dayInfo.leave?.type || dayInfo.shift}@timecardpro.app`,
                    `DTSTAMP:${dtStamp}`,
                    `DTSTART;VALUE=DATE:${toICSDate(currentDate, true)}`,
                    `DTEND;VALUE=DATE:${toICSDate(nextDay, true)}`,
                    `SUMMARY:${summary}`,
                    'END:VEVENT'
                ].join('\r\n');
                icsEvents.push(event);
            }
        }
        else if (logs && logs.length >= 2) {
            const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const firstIn = sortedLogs.find(l => l.type === 'in');
            
            const reversedLogs = [...sortedLogs].reverse();
            const lastOut = reversedLogs.find(l => l.type === 'out');

            if (firstIn && lastOut) {
                const { summary } = calculateWorkSummary(currentDate, logs, workSettings, dayInfo, nextDayInfo);
                const overtimeMs = summary.overtimeDiurnalMs + summary.overtimeNocturnalMs + summary.overtimeHolidayMs + summary.overtimeNocturnalHolidayMs;

                let description = `Ore totali: ${formatDuration(summary.totalWorkMs).slice(0,5)}.`;
                if (summary.excessHoursMs > 0) {
                     description += `\\nOre Eccedenti: ${formatDuration(summary.excessHoursMs).slice(0,5)}.`;
                }
                if (overtimeMs > 0) {
                     description += `\\nStraordinario: ${formatDuration(overtimeMs).slice(0,5)}.`;
                }

                const event = [
                    'BEGIN:VEVENT',
                    `UID:${dateKey}-worklog@timecardpro.app`,
                    `DTSTAMP:${dtStamp}`,
                    `DTSTART:${toICSDate(new Date(firstIn.timestamp))}`,
                    `DTEND:${toICSDate(new Date(lastOut.timestamp))}`,
                    'SUMMARY:Orario di Lavoro',
                    `DESCRIPTION:${description}`,
                    'END:VEVENT'
                ].join('\r\n');
                icsEvents.push(event);
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TimecardManagerPro//App//EN',
        'CALSCALE:GREGORIAN',
        ...icsEvents,
        'END:VCALENDAR'
    ].join('\r\n');

    return icsString;
};

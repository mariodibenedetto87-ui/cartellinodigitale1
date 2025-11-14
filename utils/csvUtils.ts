import { AllTimeLogs, AllDayInfo, WorkSettings, StatusItem, AllManualOvertime } from '../types';
import { formatDateKey, calculateWorkSummary, addDays, formatDuration, parseDateKey } from './timeUtils';
import { getStatusItemDetails } from './leaveUtils';

const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const str = String(field);
    // If the field contains a comma, double quote, or newline, wrap it in double quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Also, double up any existing double quotes
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const generateCSV = (
    allLogs: AllTimeLogs,
    allDayInfo: AllDayInfo,
    workSettings: WorkSettings,
    startDate: Date,
    endDate: Date,
    statusItems: StatusItem[],
    // FIX: Added allManualOvertime to function signature to correctly access overtime data.
    allManualOvertime: AllManualOvertime
): string => {
    const headers = [
        'Data',
        'Giorno',
        'Stato',
        'Ore Totali',
        'Ore Ordinarie',
        'Ore Eccedenti',
        'Straordinario Diurno',
        'Straordinario Notturno',
        'Straordinario Festivo',
        'Straordinario Festivo Notturno',
        'Timbrature'
    ];

    const rows = [headers.join(',')];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const dayInfo = allDayInfo[dateKey];
        const logs = allLogs[dateKey] || [];
        // FIX: manualOvertime was incorrectly sourced. It's now correctly sourced from allManualOvertime.
        const manualOvertime = allManualOvertime[dateKey] || [];
        const nextDayInfo = allDayInfo[formatDateKey(addDays(currentDate, 1))];
        
        const dayOfWeek = currentDate.toLocaleDateString('it-IT', { weekday: 'short' });
        
        let status = 'Lavorato';
        if (dayInfo?.leave) {
            // FIX: Pass the `type` property of the leave object, not the whole object.
            status = getStatusItemDetails(dayInfo.leave.type, statusItems).label;
        } else if (dayInfo?.shift === 'rest') {
            status = 'Riposo';
        } else if (logs.length === 0 && manualOvertime.length === 0) {
            status = 'Non Lavorato';
        }

        // FIX: Pass manualOvertime to calculateWorkSummary for accurate calculations.
        const { summary } = calculateWorkSummary(currentDate, logs, workSettings, dayInfo, nextDayInfo, manualOvertime);
        
        const formatHours = (ms: number) => (ms > 0 ? (ms / 3600000).toFixed(2) : '0.00');

        const timestamps = logs
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(log => `${log.type === 'in' ? 'E' : 'U'}:${new Date(log.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`)
            .join('; ');

        const row = [
            escapeCSV(dateKey),
            escapeCSV(dayOfWeek),
            escapeCSV(status),
            escapeCSV(formatHours(summary.totalWorkMs)),
            escapeCSV(formatHours(summary.standardWorkMs)),
            escapeCSV(formatHours(summary.excessHoursMs)),
            escapeCSV(formatHours(summary.overtimeDiurnalMs)),
            escapeCSV(formatHours(summary.overtimeNocturnalMs)),
            escapeCSV(formatHours(summary.overtimeHolidayMs)),
            escapeCSV(formatHours(summary.overtimeNocturnalHolidayMs)),
            escapeCSV(timestamps)
        ];
        rows.push(row.join(','));

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return rows.join('\r\n');
};

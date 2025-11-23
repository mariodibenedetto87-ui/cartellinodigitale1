import { AllDayInfo, StatusItem, AllManualOvertime } from '../types';
import { parseDateKey } from './timeUtils';

/**
 * Calculates the usage for each status code based on leave entries in allDayInfo and overtime entries for a specific year.
 * @param allDayInfo All the day information records.
 * @param year The year to calculate usage for.
 * @param statusItems The master list of status items to determine category.
 * @param allManualOvertime All manual overtime entries.
 * @returns A record mapping status codes to their usage count (days or hours).
 */
export const calculateStatusUsage = (
    allDayInfo: AllDayInfo,
    year: number,
    statusItems: StatusItem[],
    allManualOvertime?: AllManualOvertime
): Record<number, number> => {
    const usage: Record<number, number> = {};
    const statusMap = new Map(statusItems.map(item => [item.code, item]));

    for (const [dateKey, dayInfo] of Object.entries(allDayInfo)) {
        if (!dayInfo.leave?.type || !dayInfo.leave.type.startsWith('code-')) continue;

        const dayDate = parseDateKey(dateKey);
        const code = parseInt(dayInfo.leave.type.split('-')[1], 10);
        const item = statusMap.get(code);

        // Only count usage for the relevant year
        if (item && dayDate.getFullYear() === year) {
            if (item.category === 'leave-hours') {
                // For hourly leave, sum the hours
                usage[code] = (usage[code] || 0) + (dayInfo.leave.hours || 0);
            } else {
                // For daily leave, count the days (increment by 1)
                usage[code] = (usage[code] || 0) + 1;
            }
        }
    }

    // Calculate overtime usage from allManualOvertime
    if (allManualOvertime) {
        for (const [dateKey, overtimeEntries] of Object.entries(allManualOvertime)) {
            const dayDate = parseDateKey(dateKey);

            if (dayDate.getFullYear() === year) {
                for (const overtime of overtimeEntries) {
                    const overtimeType = (overtime.type || '').trim();

                    // Check if type is in code-XXXX format
                    if (overtimeType.startsWith('code-')) {
                        const code = parseInt(overtimeType.split('-')[1], 10);
                        const item = statusMap.get(code);

                        if (item) {
                            const hours = overtime.durationMs / (1000 * 60 * 60);
                            // Accumula sempre in positivo - il segno viene gestito nel calcolo del balance
                            usage[code] = (usage[code] || 0) + hours;
                        }
                    } else {
                        // Legacy format: match by description
                        const item = statusItems.find(s =>
                            s.category === 'overtime' && s.description.trim() === overtimeType
                        );

                        if (item) {
                            const hours = overtime.durationMs / (1000 * 60 * 60);
                            usage[item.code] = (usage[item.code] || 0) + hours;
                        }
                    }
                }
            }
        }
    }

    return usage;
};

/**
 * Calculates the monthly usage for a specific status code and year.
 * @param allDayInfo All the day information records.
 * @param year The year to calculate usage for.
 * @param statusCode The status code to calculate usage for.
 * @param statusItems The master list of status items to determine category.
 * @param allManualOvertime All manual overtime entries.
 * @returns An array of 12 numbers representing usage for each month (0-11).
 */
export const calculateMonthlyStatusUsage = (
    allDayInfo: AllDayInfo,
    year: number,
    statusCode: number,
    statusItems: StatusItem[],
    allManualOvertime?: AllManualOvertime
): number[] => {
    const monthlyUsage = new Array(12).fill(0);
    const item = statusItems.find(i => i.code === statusCode);

    if (!item) return monthlyUsage;

    // Calculate from daily entries
    for (const [dateKey, dayInfo] of Object.entries(allDayInfo)) {
        if (!dayInfo.leave?.type) continue;

        const dayDate = parseDateKey(dateKey);
        if (dayDate.getFullYear() !== year) continue;

        if (dayInfo.leave.type === `code-${statusCode}`) {
            const month = dayDate.getMonth();
            if (item.category === 'leave-hours') {
                monthlyUsage[month] += (dayInfo.leave.hours || 0);
            } else {
                monthlyUsage[month] += 1;
            }
        }
    }

    // Calculate from overtime entries
    if (allManualOvertime) {
        for (const [dateKey, overtimeEntries] of Object.entries(allManualOvertime)) {
            const dayDate = parseDateKey(dateKey);
            if (dayDate.getFullYear() !== year) continue;

            const month = dayDate.getMonth();

            for (const overtime of overtimeEntries) {
                const overtimeType = (overtime.type || '').trim();
                let match = false;

                if (overtimeType === `code-${statusCode}`) {
                    match = true;
                } else if (item.category === 'overtime' && item.description.trim() === overtimeType) {
                    match = true;
                }

                if (match) {
                    const hours = overtime.durationMs / (1000 * 60 * 60);
                    monthlyUsage[month] += hours;
                }
            }
        }
    }

    return monthlyUsage;
};

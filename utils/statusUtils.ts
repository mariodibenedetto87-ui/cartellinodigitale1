import { AllDayInfo, StatusItem } from '../types';
import { parseDateKey } from './timeUtils';

/**
 * Calculates the usage for each status code based on leave entries in allDayInfo for a specific year.
 * @param allDayInfo All the day information records.
 * @param year The year to calculate usage for.
 * @param statusItems The master list of status items to determine category.
 * @returns A record mapping status codes to their usage count (days or hours).
 */
export const calculateStatusUsage = (
    allDayInfo: AllDayInfo,
    year: number,
    statusItems: StatusItem[]
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
    return usage;
};
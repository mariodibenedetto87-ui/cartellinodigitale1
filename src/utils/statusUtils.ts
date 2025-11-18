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
        console.log('🔍 INIZIO CALCOLO STRAORDINARI');
        console.log('allManualOvertime keys:', Object.keys(allManualOvertime));
        
        for (const [dateKey, overtimeEntries] of Object.entries(allManualOvertime)) {
            const dayDate = parseDateKey(dateKey);
            console.log(`📅 Processando dateKey: ${dateKey}, anno: ${dayDate.getFullYear()}, target year: ${year}`);
            
            if (dayDate.getFullYear() === year) {
                console.log(`✅ Anno match! Entries:`, overtimeEntries);
                
                for (const overtime of overtimeEntries) {
                    console.log('📝 Overtime entry:', overtime);
                    
                    // Trim whitespace and find status item by description
                    const overtimeType = (overtime.type || '').trim();
                    console.log(`🔎 Cercando match per type: "${overtimeType}"`);
                    
                    const item = statusItems.find(s => {
                        const match = s.category === 'overtime' && s.description.trim() === overtimeType;
                        if (s.category === 'overtime') {
                            console.log(`  Confronto con code ${s.code}: "${s.description.trim()}" === "${overtimeType}" ? ${match}`);
                        }
                        return match;
                    });
                    
                    console.log(`Risultato ricerca:`, item);
                    
                    if (item) {
                        const hours = overtime.durationMs / (1000 * 60 * 60);
                        const oldValue = usage[item.code] || 0;
                        usage[item.code] = oldValue + hours;
                        console.log(`✅ Aggiunto ${hours}h al code ${item.code}, era ${oldValue}, ora ${usage[item.code]}`);
                    } else {
                        console.log(`❌ NESSUN MATCH trovato per "${overtimeType}"`);
                    }
                }
            }
        }
        
        console.log('🏁 FINE CALCOLO - usage finale:', usage);
    }

    return usage;
};

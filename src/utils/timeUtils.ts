import { Shift, ShiftType, TimeEntry, WorkSettings, DayInfo, WorkDaySummary, WorkIntervalSummary, ManualOvertimeEntry } from '../types';

/**
 * Formats a Date object into a 'YYYY-MM-DD' string key based on the local timezone.
 * This avoids timezone shift issues that can occur with toISOString().
 */
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Safely parses a 'YYYY-MM-DD' string into a Date object at midnight local time.
 */
export const parseDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    // Creates a date at midnight in the local timezone
    return new Date(year, month - 1, day);
};

/**
 * Adds a specified number of days to a date.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adds a specified number of months to a date.
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Adds a specified number of years to a date.
 */
export const addYears = (date: Date, years: number): Date => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
};

/**
 * Formats milliseconds into a 'HH:MM:SS' string.
 */
export const formatDuration = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Formats a decimal number of hours into an 'HH:MM' string, handling negative values.
 * e.g., 18.5 becomes "18:30", -2.25 becomes "-02:15"
 */
export const formatHoursDecimal = (decimalHours: number): string => {
    if (isNaN(decimalHours)) decimalHours = 0;
    const sign = decimalHours < 0 ? "-" : "";
    const absHours = Math.abs(decimalHours);
    const hours = Math.floor(absHours);
    let minutes = Math.round((absHours % 1) * 60);

    // Handle case where rounding minutes results in 60
    if (minutes === 60) {
        return `${sign}${String(hours + 1).padStart(2, '0')}:00`;
    }
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};


/**
 * Checks if two dates are on the same day.
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Checks if two dates are in the same month and year.
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
};

/**
 * Gets the first day of the month for a given date.
 */
export const startOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Gets the Monday of the week for a given date.
 */
export const startOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

// FIX: Add getShiftDetails function to find a shift by its ID and return an enriched object for UI components.
export const getShiftDetails = (shiftId: ShiftType, shifts: Shift[]): (Shift & { label: string, borderColor: string }) | undefined => {
  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) return undefined;

  // derive borderColor from bgColor
  const colorMatch = /bg-([a-z]+)-(\d+)/.exec(shift.bgColor);
  const borderColor = colorMatch ? `border-${colorMatch[1]}-400` : 'border-gray-400';
  
  return {
    ...shift,
    label: shift.name,
    borderColor
  };
};

/**
 * Calculates a detailed summary of work hours for a given set of time entries.
 * This version robustly handles shifts that cross midnight and correctly categorizes
 * work into standard, overtime, nocturnal, and holiday hours.
 * It now returns both a daily summary and a detailed breakdown per work interval.
 */
export const calculateWorkSummary = (
    dayDate: Date,
    entries: TimeEntry[],
    workSettings: WorkSettings,
    dayInfo?: DayInfo,
    _nextDayInfo?: DayInfo,
    manualOvertimeEntries: ManualOvertimeEntry[] = [],
): { summary: WorkDaySummary, intervals: WorkIntervalSummary[] } => {
    const summary: WorkDaySummary = {
        totalWorkMs: 0, standardWorkMs: 0, overtimeDiurnalMs: 0,
        overtimeNocturnalMs: 0, overtimeHolidayMs: 0, overtimeNocturnalHolidayMs: 0,
        excessHoursMs: 0, nullHoursMs: 0,
    };
    const intervals: WorkIntervalSummary[] = [];

    const processEntries = entries && entries.length > 0;

    if (!processEntries && manualOvertimeEntries.length === 0) {
        return { summary, intervals };
    }
    
    let standardDayMs = workSettings.standardDayHours * 60 * 60 * 1000;
    
    // If there's leave with hours, reduce the standard work day duration
    if (dayInfo?.leave?.hours && dayInfo.leave.hours > 0) {
        standardDayMs -= dayInfo.leave.hours * 60 * 60 * 1000;
    }

    let remainingStandardMs = standardDayMs < 0 ? 0 : standardDayMs;

    // Raccogli gli ID delle timbrature già giustificate manualmente
    const usedEntryIds = new Set<string>();
    manualOvertimeEntries.forEach(entry => {
        if (entry.usedEntryIds) {
            entry.usedEntryIds.forEach(id => usedEntryIds.add(id));
        }
    });
    
    if (processEntries) {
        const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const workIntervals: { start: Date, end: Date, closingEntryId?: string }[] = [];
        for (let i = 0; i < sortedEntries.length - 1; i += 2) {
            if (sortedEntries[i]?.type === 'in' && sortedEntries[i+1]?.type === 'out') {
                // Salta questo intervallo se le timbrature sono già state giustificate manualmente
                const isUsed = usedEntryIds.has(sortedEntries[i].id) || usedEntryIds.has(sortedEntries[i+1].id);
                if (!isUsed) {
                    workIntervals.push({ 
                        start: new Date(sortedEntries[i].timestamp), 
                        end: new Date(sortedEntries[i+1].timestamp), 
                        closingEntryId: sortedEntries[i+1].id 
                    });
                }
            }
        }
        
        const { nightTimeStartHour, nightTimeEndHour } = workSettings;
        const isSunday = dayDate.getDay() === 0;
        const isHoliday = ((dayInfo?.leave?.type === 'holiday' || dayInfo?.leave?.type === 'code-10') && workSettings.treatHolidayAsOvertime) || isSunday;
        const nightPeriodSpansMidnight = nightTimeEndHour < nightTimeStartHour;

        const shiftDetails = dayInfo?.shift ? workSettings.shifts.find(s => s.id === dayInfo.shift) : null;
        
        const shiftStartMs = (shiftDetails && shiftDetails.startHour !== null)
            ? new Date(dayDate).setHours(shiftDetails.startHour, 0, 0, 0)
            : null;

        let shiftEndMs: number | null = null;
        if (shiftDetails && shiftDetails.endHour !== null) {
            const endDate = new Date(dayDate);
            // If end hour is less than start hour, it's an overnight shift, so end date is the next day.
            // Also check that startHour is not null to prevent errors.
            if (shiftDetails.startHour !== null && shiftDetails.endHour < shiftDetails.startHour) {
                endDate.setDate(endDate.getDate() + 1);
            }
            shiftEndMs = endDate.setHours(shiftDetails.endHour, 0, 0, 0);
        }

        const calculatedStandardDayMs = workSettings.standardDayHours * 60 * 60 * 1000;
        const shiftDurationMs = (shiftEndMs && shiftStartMs) ? shiftEndMs - shiftStartMs : 0;
        // If the defined shift is longer than the standard workday, we anchor the "standard" part
        // to the end of the shift. This treats any time worked at the beginning of the shift,
        // before this block starts, as pre-shift "null" time.
        const standardWorkBlockStartMs = (shiftDetails && shiftEndMs && shiftDurationMs > calculatedStandardDayMs)
            ? shiftEndMs - calculatedStandardDayMs
            : shiftStartMs;

        let treatPostShiftAsOvertime = false;
        if (shiftEndMs) {
            const totalPostShiftMs = workIntervals.reduce((total, interval) => {
                const intervalEndMs = interval.end.getTime();
                const postShiftStart = Math.max(interval.start.getTime(), shiftEndMs);
                if (intervalEndMs > postShiftStart) {
                    return total + (intervalEndMs - postShiftStart);
                }
                return total;
            }, 0);
            
            const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
            treatPostShiftAsOvertime = totalPostShiftMs > FIFTEEN_MINUTES_MS;
        }
        
        for (const interval of workIntervals) {
            const intervalSummary: WorkIntervalSummary = {
                start: interval.start, end: interval.end, closingEntryId: interval.closingEntryId,
                totalWorkMs: 0, standardWorkMs: 0, excessHoursMs: 0, 
                overtimeDiurnalMs: 0, overtimeNocturnalMs: 0, overtimeHolidayMs: 0, 
                overtimeNocturnalHolidayMs: 0, nullHoursMs: 0,
            };

            const effectiveStartMs = standardWorkBlockStartMs
                ? Math.max(interval.start.getTime(), standardWorkBlockStartMs)
                : interval.start.getTime();
            const intervalEndMs = interval.end.getTime();

            intervalSummary.nullHoursMs = Math.max(0, effectiveStartMs - interval.start.getTime());

            if (intervalEndMs <= effectiveStartMs) {
                intervals.push(intervalSummary);
                continue;
            };

            const breakpoints = new Set([effectiveStartMs, intervalEndMs]);
            
            const addBreakpoint = (time: number) => {
                if (time > effectiveStartMs && time < intervalEndMs) breakpoints.add(time);
            };

            const nightStartMs = new Date(dayDate).setHours(nightTimeStartHour, 0, 0, 0);
            const nightEndMs = new Date(dayDate).setHours(nightTimeEndHour, 0, 0, 0);
            
            if (nightPeriodSpansMidnight) {
                addBreakpoint(nightStartMs);
                addBreakpoint(addDays(new Date(nightEndMs), 1).getTime());
            } else {
                addBreakpoint(nightStartMs);
                addBreakpoint(nightEndMs);
            }
            if (shiftEndMs) {
                addBreakpoint(shiftEndMs);
            }

            const sortedBreaks = Array.from(breakpoints).sort((a,b) => a - b);
            
            for (let i = 0; i < sortedBreaks.length - 1; i++) {
                const chunkStartMs = sortedBreaks[i];
                const chunkEndMs = sortedBreaks[i+1];
                const chunkDuration = chunkEndMs - chunkStartMs;
                
                if (chunkDuration <= 0) continue;

                const midPoint = new Date(chunkStartMs + chunkDuration / 2);
                const hour = midPoint.getHours();
                const isNight = nightPeriodSpansMidnight
                    ? (hour >= nightTimeStartHour || hour < nightTimeEndHour)
                    : (hour >= nightTimeStartHour && hour < nightTimeEndHour);

                const isPostShift = shiftEndMs ? midPoint.getTime() >= shiftEndMs : false;

                if (isPostShift) {
                    if (treatPostShiftAsOvertime) {
                        if (isHoliday) {
                            isNight ? intervalSummary.overtimeNocturnalHolidayMs += chunkDuration : intervalSummary.overtimeHolidayMs += chunkDuration;
                        } else {
                            isNight ? intervalSummary.overtimeNocturnalMs += chunkDuration : intervalSummary.overtimeDiurnalMs += chunkDuration;
                        }
                    } else {
                        intervalSummary.excessHoursMs += chunkDuration;
                    }
                } else {
                    const standardPartMs = Math.min(chunkDuration, remainingStandardMs);
                    const extraPartMs = chunkDuration - standardPartMs;
                    
                    intervalSummary.standardWorkMs += standardPartMs;
                    remainingStandardMs -= standardPartMs;

                    if (extraPartMs > 0) {
                        if (shiftDetails) {
                            intervalSummary.excessHoursMs += extraPartMs;
                        } else {
                            if (isHoliday) {
                                isNight ? intervalSummary.overtimeNocturnalHolidayMs += extraPartMs : intervalSummary.overtimeHolidayMs += extraPartMs;
                            } else {
                                isNight ? intervalSummary.overtimeNocturnalMs += extraPartMs : intervalSummary.overtimeDiurnalMs += extraPartMs;
                            }
                        }
                    }
                }
            }
            // FIX: totalWorkMs deve includere TUTTE le ore lavorate, anche quelle pre-turno (null hours)
            // Non usare effectiveStartMs che esclude il pre-turno, ma interval.start effettivo
            intervalSummary.totalWorkMs = (intervalEndMs - interval.start.getTime());
            intervals.push(intervalSummary);
        }
        
        intervals.forEach(interval => {
            summary.totalWorkMs += interval.totalWorkMs;
            summary.standardWorkMs += interval.standardWorkMs;
            summary.excessHoursMs += interval.excessHoursMs;
            summary.overtimeDiurnalMs += interval.overtimeDiurnalMs;
            summary.overtimeNocturnalMs += interval.overtimeNocturnalMs;
            summary.overtimeHolidayMs += interval.overtimeHolidayMs;
            summary.overtimeNocturnalHolidayMs += interval.overtimeNocturnalHolidayMs;
            summary.nullHoursMs += interval.nullHoursMs;
        });
    }

    manualOvertimeEntries.forEach(entry => {
        summary.totalWorkMs += entry.durationMs;
        
        // Check if type is in code-XXXX format (e.g., 'code-2041' for a course)
        if (entry.type.startsWith('code-')) {
            // All code-based entries go to excess hours (straordinari/corsi/permessi)
            summary.excessHoursMs += entry.durationMs;
        } else {
            // Legacy format support: specific type strings
            switch (entry.type) {
                case 'diurnal': summary.overtimeDiurnalMs += entry.durationMs; break;
                case 'nocturnal': summary.overtimeNocturnalMs += entry.durationMs; break;
                case 'holiday': summary.overtimeHolidayMs += entry.durationMs; break;
                case 'nocturnal-holiday': summary.overtimeNocturnalHolidayMs += entry.durationMs; break;
                default:
                    // Unknown type, add to excess hours
                    summary.excessHoursMs += entry.durationMs;
                    break;
            }
        }
    });

    if (workSettings.deductAutoBreak && summary.totalWorkMs > workSettings.autoBreakThresholdHours * 3600 * 1000) {
        const breakMs = workSettings.autoBreakMinutes * 60 * 1000;
        const deductedFromStandard = Math.min(summary.standardWorkMs, breakMs);
        
        summary.standardWorkMs -= deductedFromStandard;
        summary.totalWorkMs -= deductedFromStandard;
    }
    
    return { summary, intervals };
};
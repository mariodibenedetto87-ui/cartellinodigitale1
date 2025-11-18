import { AllTimeLogs, AllManualOvertime, WorkSettings } from '../types';
import { formatDateKey } from './timeUtils';

export interface MonthlyStats {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
  totalHours: number;
  workDays: number;
  averageHoursPerDay: number;
  overtimeHours: number;
  productivity: number; // percentage vs standard
}

export interface ComparisonData {
  current: MonthlyStats;
  previous: MonthlyStats;
  delta: {
    totalHours: number;
    workDays: number;
    averageHoursPerDay: number;
    overtimeHours: number;
    productivity: number;
  };
}

export function calculateMonthlyStats(
  year: number,
  month: number, // 1-12
  allLogs: AllTimeLogs,
  allManualOvertime: AllManualOvertime,
  workSettings: WorkSettings
): MonthlyStats {
  const monthEnd = new Date(year, month, 0); // Last day of month
  
  let totalMs = 0;
  let workDays = 0;
  let overtimeMs = 0;

  // Calculate from time logs
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dateKey = formatDateKey(date);
    const entries = allLogs[dateKey] || [];

    if (entries.length > 0) {
      workDays++;
      // Calculate hours from paired entries
      for (let i = 0; i < entries.length; i += 2) {
        if (entries[i + 1]) {
          const duration = entries[i + 1].timestamp.getTime() - entries[i].timestamp.getTime();
          totalMs += duration;
        }
      }
    }

    // Add manual overtime
    const overtime = allManualOvertime[dateKey] || [];
    overtime.forEach(entry => {
      overtimeMs += entry.durationMs;
    });
  }

  const totalHours = totalMs / (1000 * 60 * 60);
  const overtimeHours = overtimeMs / (1000 * 60 * 60);
  const averageHoursPerDay = workDays > 0 ? totalHours / workDays : 0;
  
  // Calculate productivity (% vs standard expected hours)
  const expectedHours = workDays * workSettings.standardDayHours;
  const productivity = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;

  const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    year,
    monthName: monthNames[month - 1],
    totalHours,
    workDays,
    averageHoursPerDay,
    overtimeHours,
    productivity,
  };
}

export function compareMonths(
  currentYear: number,
  currentMonth: number,
  previousYear: number,
  previousMonth: number,
  allLogs: AllTimeLogs,
  allManualOvertime: AllManualOvertime,
  workSettings: WorkSettings
): ComparisonData {
  const current = calculateMonthlyStats(currentYear, currentMonth, allLogs, allManualOvertime, workSettings);
  const previous = calculateMonthlyStats(previousYear, previousMonth, allLogs, allManualOvertime, workSettings);

  return {
    current,
    previous,
    delta: {
      totalHours: current.totalHours - previous.totalHours,
      workDays: current.workDays - previous.workDays,
      averageHoursPerDay: current.averageHoursPerDay - previous.averageHoursPerDay,
      overtimeHours: current.overtimeHours - previous.overtimeHours,
      productivity: current.productivity - previous.productivity,
    },
  };
}

export function calculateYearlyTrend(
  year: number,
  allLogs: AllTimeLogs,
  allManualOvertime: AllManualOvertime,
  workSettings: WorkSettings
): MonthlyStats[] {
  const months: MonthlyStats[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const stats = calculateMonthlyStats(year, month, allLogs, allManualOvertime, workSettings);
    months.push(stats);
  }
  
  return months;
}

export function compareYears(
  currentYear: number,
  previousYear: number,
  allLogs: AllTimeLogs,
  allManualOvertime: AllManualOvertime,
  workSettings: WorkSettings
): {
  current: MonthlyStats[];
  previous: MonthlyStats[];
  yearDelta: {
    totalHours: number;
    totalWorkDays: number;
    totalOvertime: number;
    averageProductivity: number;
  };
} {
  const current = calculateYearlyTrend(currentYear, allLogs, allManualOvertime, workSettings);
  const previous = calculateYearlyTrend(previousYear, allLogs, allManualOvertime, workSettings);

  const currentTotals = current.reduce((acc, month) => ({
    totalHours: acc.totalHours + month.totalHours,
    totalWorkDays: acc.totalWorkDays + month.workDays,
    totalOvertime: acc.totalOvertime + month.overtimeHours,
    totalProductivity: acc.totalProductivity + month.productivity,
  }), { totalHours: 0, totalWorkDays: 0, totalOvertime: 0, totalProductivity: 0 });

  const previousTotals = previous.reduce((acc, month) => ({
    totalHours: acc.totalHours + month.totalHours,
    totalWorkDays: acc.totalWorkDays + month.workDays,
    totalOvertime: acc.totalOvertime + month.overtimeHours,
    totalProductivity: acc.totalProductivity + month.productivity,
  }), { totalHours: 0, totalWorkDays: 0, totalOvertime: 0, totalProductivity: 0 });

  const monthsWithData = current.filter(m => m.workDays > 0).length;
  const previousMonthsWithData = previous.filter(m => m.workDays > 0).length;

  return {
    current,
    previous,
    yearDelta: {
      totalHours: currentTotals.totalHours - previousTotals.totalHours,
      totalWorkDays: currentTotals.totalWorkDays - previousTotals.totalWorkDays,
      totalOvertime: currentTotals.totalOvertime - previousTotals.totalOvertime,
      averageProductivity: (currentTotals.totalProductivity / Math.max(monthsWithData, 1)) - 
                          (previousTotals.totalProductivity / Math.max(previousMonthsWithData, 1)),
    },
  };
}

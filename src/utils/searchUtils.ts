import { AllTimeLogs, AllDayInfo, AllManualOvertime, StatusItem, Shift } from '../types';
import { parseDateKey, formatDuration } from './timeUtils';

export interface SearchFilters {
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  entryType?: 'all' | 'time' | 'leave' | 'overtime';
  shiftType?: string; // shift ID or 'all'
}

export interface SearchResult {
  id: string;
  type: 'timeEntry' | 'leaveEntry' | 'overtimeEntry' | 'shiftEntry';
  date: Date;
  dateKey: string;
  title: string;
  description: string;
  details: string;
  matchedText: string;
  relevanceScore: number;
}

export function searchAllData(
  filters: SearchFilters,
  allLogs: AllTimeLogs,
  allDayInfo: AllDayInfo,
  allManualOvertime: AllManualOvertime,
  statusItems: StatusItem[],
  shifts: Shift[]
): SearchResult[] {
  const results: SearchResult[] = [];
  const query = filters.query.toLowerCase().trim();

  // Helper function to check if date is within range
  const isDateInRange = (date: Date): boolean => {
    if (filters.dateFrom && date < filters.dateFrom) return false;
    if (filters.dateTo && date > filters.dateTo) return false;
    return true;
  };

  // Helper function to highlight matched text
  const highlightMatch = (text: string, query: string): string => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Helper function to calculate relevance score
  const calculateRelevance = (text: string, query: string): number => {
    if (!query) return 0;
    const lowerText = text.toLowerCase();
    const exactMatch = lowerText.includes(query);
    const wordMatch = query.split(' ').some(word => lowerText.includes(word));
    return exactMatch ? 100 : wordMatch ? 50 : 0;
  };

  // Search in time logs
  if (filters.entryType === 'all' || filters.entryType === 'time') {
    Object.entries(allLogs).forEach(([dateKey, entries]) => {
      const date = parseDateKey(dateKey);
      if (!isDateInRange(date)) return;

      entries.forEach((entry, index) => {
        const timeStr = new Date(entry.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const typeStr = entry.type === 'in' ? 'Entrata' : 'Uscita';
        const description = `${typeStr} alle ${timeStr}`;
        const searchText = `${dateKey} ${typeStr} ${timeStr}`;

        if (!query || searchText.toLowerCase().includes(query)) {
          results.push({
            id: `time-${dateKey}-${index}`,
            type: 'timeEntry',
            date,
            dateKey,
            title: `Timbratura ${typeStr}`,
            description,
            details: new Date(entry.timestamp).toLocaleString('it-IT'),
            matchedText: highlightMatch(description, query),
            relevanceScore: calculateRelevance(searchText, query),
          });
        }
      });
    });
  }

  // Search in day info (leaves and shifts)
  if (filters.entryType === 'all' || filters.entryType === 'leave') {
    Object.entries(allDayInfo).forEach(([dateKey, dayInfo]) => {
      const date = parseDateKey(dateKey);
      if (!isDateInRange(date)) return;

      // Check shift filter
      if (filters.shiftType && filters.shiftType !== 'all' && dayInfo.shift !== filters.shiftType) {
        return;
      }

      // Search in leave entries
      if (dayInfo.leave) {
        const statusItem = statusItems.find(s => s.code.toString() === dayInfo.leave?.type);
        const leaveName = statusItem ? statusItem.description : dayInfo.leave.type;
        const hours = dayInfo.leave.hours ? ` (${dayInfo.leave.hours}h)` : '';
        const description = `${leaveName}${hours}`;
        const searchText = `${dateKey} ${leaveName} ferie permessi assenza`;

        if (!query || searchText.toLowerCase().includes(query)) {
          results.push({
            id: `leave-${dateKey}`,
            type: 'leaveEntry',
            date,
            dateKey,
            title: 'Assenza/Permesso',
            description,
            details: `${leaveName} il ${date.toLocaleDateString('it-IT')}`,
            matchedText: highlightMatch(description, query),
            relevanceScore: calculateRelevance(searchText, query),
          });
        }
      }

      // Search in shift entries
      if (dayInfo.shift) {
        const shift = shifts.find(s => s.id === dayInfo.shift);
        const shiftName = shift ? shift.name : dayInfo.shift;
        const shiftTime = shift && shift.startHour !== null && shift.endHour !== null
          ? ` (${shift.startHour}:00 - ${shift.endHour}:00)`
          : '';
        const description = `Turno: ${shiftName}${shiftTime}`;
        const searchText = `${dateKey} turno ${shiftName}`;

        if (!query || searchText.toLowerCase().includes(query)) {
          results.push({
            id: `shift-${dateKey}`,
            type: 'shiftEntry',
            date,
            dateKey,
            title: 'Turno Pianificato',
            description,
            details: `${shiftName} il ${date.toLocaleDateString('it-IT')}`,
            matchedText: highlightMatch(description, query),
            relevanceScore: calculateRelevance(searchText, query),
          });
        }
      }
    });
  }

  // Search in manual overtime
  if (filters.entryType === 'all' || filters.entryType === 'overtime') {
    Object.entries(allManualOvertime).forEach(([dateKey, entries]) => {
      const date = parseDateKey(dateKey);
      if (!isDateInRange(date)) return;

      entries.forEach((entry, index) => {
        const duration = formatDuration(entry.durationMs);
        const statusItem = statusItems.find(s => s.code.toString() === entry.type);
        const typeName = statusItem ? statusItem.description : entry.type;
        const note = entry.note ? ` - ${entry.note}` : '';
        const description = `${typeName}: ${duration}${note}`;
        const searchText = `${dateKey} straordinario ${typeName} ${entry.note || ''} ${duration}`;

        if (!query || searchText.toLowerCase().includes(query)) {
          results.push({
            id: `overtime-${dateKey}-${index}`,
            type: 'overtimeEntry',
            date,
            dateKey,
            title: 'Straordinario Manuale',
            description,
            details: `${duration} il ${date.toLocaleDateString('it-IT')}`,
            matchedText: highlightMatch(description, query),
            relevanceScore: calculateRelevance(searchText, query),
          });
        }
      });
    });
  }

  // Sort by relevance and date (most recent first)
  return results.sort((a, b) => {
    if (a.relevanceScore !== b.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.date.getTime() - a.date.getTime();
  });
}

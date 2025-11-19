import { useState, useEffect, useCallback } from 'react';
import { AllTimeLogs, AllDayInfo, AllManualOvertime, StatusItem, Shift } from '../types';
import { searchAllData, SearchFilters, SearchResult } from '../utils/searchUtils';

interface GlobalSearchProps {
  allLogs: AllTimeLogs;
  allDayInfo: AllDayInfo;
  allManualOvertime: AllManualOvertime;
  statusItems: StatusItem[];
  shifts: Shift[];
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

export default function GlobalSearch({
  allLogs,
  allDayInfo,
  allManualOvertime,
  statusItems,
  shifts,
  onClose,
  onSelectDate,
}: GlobalSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entryType: 'all',
    shiftType: 'all',
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Perform search
  const performSearch = useCallback(() => {
    setIsSearching(true);
    setTimeout(() => {
      const searchResults = searchAllData(
        filters,
        allLogs,
        allDayInfo,
        allManualOvertime,
        statusItems,
        shifts
      );
      setResults(searchResults);
      setIsSearching(false);
    }, 100);
  }, [filters, allLogs, allDayInfo, allManualOvertime, statusItems, shifts]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleResultClick = (result: SearchResult) => {
    onSelectDate(result.date);
    onClose();
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'timeEntry':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'leaveEntry':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'overtimeEntry':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'shiftEntry':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getResultColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'timeEntry':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'leaveEntry':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
      case 'overtimeEntry':
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
      case 'shiftEntry':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-modal-content">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cerca timbrature, ferie, straordinari..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-600 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Da</label>
                <input
                  type="date"
                  value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data A</label>
                <input
                  type="date"
                  value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={filters.entryType}
                  onChange={(e) => setFilters({ ...filters, entryType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="all">Tutti</option>
                  <option value="time">Timbrature</option>
                  <option value="leave">Ferie/Permessi</option>
                  <option value="overtime">Straordinari</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-600 text-center">
                {filters.query ? 'Nessun risultato trovato' : 'Inizia a cercare digitando...'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-600 text-center mt-2">
                Prova a cercare date, turni, ferie o straordinari
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getResultColor(result.type)}`}>
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {result.title}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-600">
                          {result.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p
                        className="text-sm text-gray-600 dark:text-gray-600 break-words"
                        dangerouslySetInnerHTML={{ __html: result.matchedText }}
                      />
                      {result.relevanceScore > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${result.relevanceScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-600">
                            {result.relevanceScore}% match
                          </span>
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-600">
            <span>{results.length} risultati trovati</span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">ESC</kbd>
              per chiudere
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

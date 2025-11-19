import React, { useMemo } from 'react';
import { StatusItem, AllDayInfo, AllManualOvertime } from '../../types';

interface BalanceDetailsModalProps {
  statusItem: StatusItem;
  allDayInfo: AllDayInfo;
  allManualOvertime?: AllManualOvertime;
  selectedYear: number;
  onClose: () => void;
}

interface UsageEntry {
  date: string;
  amount: number;
  month: number;
  monthName: string;
  dayName: string;
}

const monthNames = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const BalanceDetailsModal: React.FC<BalanceDetailsModalProps> = ({
  statusItem,
  allDayInfo,
  allManualOvertime,
  selectedYear,
  onClose,
}) => {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const dayOfWeek = dayNames[date.getDay()];
    return `${dayOfWeek}, ${day} ${month} ${year}`;
  };
  // Calcola tutti gli utilizzi per il tipo di status selezionato
  const usageDetails = useMemo(() => {
    const entries: UsageEntry[] = [];
    const monthlyTotals: { [month: number]: number } = {};

    // Processa allDayInfo (permessi/ferie da calendario)
    Object.entries(allDayInfo).forEach(([dateKey, dayInfo]) => {
      const date = new Date(dateKey);
      const year = date.getFullYear();

      // Verifica se questo giorno ha il tipo di leave che stiamo cercando
      if (year === selectedYear && dayInfo.leave) {
        const leaveTypeStr = `code-${statusItem.code}`;
        
        if (dayInfo.leave.type === leaveTypeStr) {
          const month = date.getMonth();
          const monthName = monthNames[month];
          const dayName = dayNames[date.getDay()];
          
          let amount = 0;
          if (statusItem.category === 'leave-day') {
            amount = 1; // Giorno intero
          } else if (statusItem.category === 'leave-hours' && dayInfo.leave.hours) {
            amount = dayInfo.leave.hours; // Ore parziali
          }

          entries.push({
            date: dateKey,
            amount,
            month,
            monthName,
            dayName,
          });

          // Per GPO le ore/giorni vanno sottratti, per ACC aggiunti
          const multiplier = statusItem.class === 'GPO' ? -1 : 1;
          monthlyTotals[month] = (monthlyTotals[month] || 0) + (amount * multiplier);
        }
      }
    });

    // Processa allManualOvertime (straordinari, corsi, recuperi)
    if (allManualOvertime) {
      Object.entries(allManualOvertime).forEach(([dateKey, overtimeEntries]) => {
        const date = new Date(dateKey);
        const year = date.getFullYear();

        if (year === selectedYear) {
          overtimeEntries.forEach(entry => {
            const entryTypeStr = `code-${statusItem.code}`;
            
            if (entry.type === entryTypeStr) {
              const month = date.getMonth();
              const monthName = monthNames[month];
              const dayName = dayNames[date.getDay()];
              const hours = entry.durationMs / (1000 * 60 * 60);

              entries.push({
                date: dateKey,
                amount: hours,
                month,
                monthName,
                dayName,
              });

              // Per GPO le ore vanno sottratte, per ACC aggiunte
              const multiplier = statusItem.class === 'GPO' ? -1 : 1;
              monthlyTotals[month] = (monthlyTotals[month] || 0) + (hours * multiplier);
            }
          });
        }
      });
    }

    // Ordina per data
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { entries, monthlyTotals };
  }, [allDayInfo, allManualOvertime, selectedYear, statusItem]);

  const totalUsed = useMemo(() => {
    return usageDetails.entries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [usageDetails]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Dettaglio Utilizzo: {statusItem.description}
              </h2>
              <p className="text-sm text-white/80">
                Anno {selectedYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Totale Previsto</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statusItem.entitlement} {statusItem.category === 'leave-hours' ? 'ore' : 'giorni'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {statusItem.class === 'ACC' ? 'Totale Accumulato' : 'Totale Utilizzato'}
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totalUsed} {statusItem.category === 'leave-hours' ? 'ore' : 'giorni'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo {statusItem.class === 'ACC' ? 'Totale' : 'Residuo'}</p>
              <p className={`text-2xl font-bold ${(statusItem.class === 'ACC' ? statusItem.entitlement + totalUsed : statusItem.entitlement - totalUsed) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {statusItem.class === 'ACC' ? statusItem.entitlement + totalUsed : statusItem.entitlement - totalUsed} {statusItem.category === 'leave-hours' ? 'ore' : 'giorni'}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              📊 Riepilogo Mensile
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {monthNames.map((monthName, index) => {
                const total = usageDetails.monthlyTotals[index] || 0;
                const hasActivity = total !== 0;
                const isPositive = total > 0;
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      hasActivity
                        ? isPositive 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {monthName}
                    </p>
                    <p className={`text-lg font-bold ${
                      hasActivity
                        ? isPositive 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {hasActivity ? (isPositive ? '+' : '') + total.toFixed(2) : '-'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed List */}
          {usageDetails.entries.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                📅 Dettaglio Giornaliero
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {usageDetails.entries.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-teal-600 dark:text-teal-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {formatDate(entry.date)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.monthName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-600 dark:text-teal-400">
                        {entry.amount} {statusItem.category === 'leave-hours' ? 'ore' : 'giorno'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                Nessun utilizzo registrato
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Non hai ancora utilizzato questo tipo di permesso nel {selectedYear}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-md"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceDetailsModal;

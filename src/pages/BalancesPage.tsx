import React, { useMemo, useState } from 'react';
import { StatusItem, AllDayInfo, AllTimeLogs, WorkSettings, AllManualOvertime, AllMealVouchers } from '../types';
import { calculateStatusUsage } from '../utils/statusUtils';
import LeaveDonutChart from '../components/charts/LeaveDonutChart';
import { getStatusItemDetails } from '../utils/leaveUtils';
import AnnualSummary from '../components/AnnualSummary';
import ComparativeStats from '../components/ComparativeStats';
import BalanceDetailsModal from '../components/modals/BalanceDetailsModal';

interface BalancesPageProps {
  statusItems: StatusItem[];
  allDayInfo: AllDayInfo;
  allLogs: AllTimeLogs;
  workSettings: WorkSettings;
  allManualOvertime: AllManualOvertime;
  allMealVouchers: AllMealVouchers;
  onOpenAddOvertimeModal: (date: Date) => void;
}

const BalancesPage: React.FC<BalancesPageProps> = ({ statusItems, allDayInfo, allLogs, workSettings, allManualOvertime, allMealVouchers, onOpenAddOvertimeModal }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatusItem, setSelectedStatusItem] = useState<StatusItem | null>(null);
  
  const usageData = useMemo(() => {
    return calculateStatusUsage(allDayInfo, selectedYear, statusItems, allManualOvertime);
  }, [allDayInfo, selectedYear, statusItems, allManualOvertime]);

  const leaveItems = useMemo(() => statusItems.filter(item => item.category === 'leave-day' || item.category === 'leave-hours'), [statusItems]);

  // Calcola buoni pasto maturati nell'anno selezionato
  const mealVouchersEarned = useMemo(() => {
    return Object.entries(allMealVouchers)
      .filter(([dateKey, voucher]) => {
        const year = new Date(dateKey).getFullYear();
        return year === selectedYear && voucher.earned;
      })
      .length;
  }, [allMealVouchers, selectedYear]);

  return (
    <main className="container mx-auto px-4 py-8 md:px-8">
      <AnnualSummary 
        year={selectedYear}
        onYearChange={setSelectedYear}
        allLogs={allLogs}
        allDayInfo={allDayInfo}
        workSettings={workSettings}
        allManualOvertime={allManualOvertime}
      />

      {/* Comparative Statistics Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">📊 Statistiche Comparative</h2>
        <ComparativeStats
          allLogs={allLogs}
          allManualOvertime={allManualOvertime}
          workSettings={workSettings}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <LeaveDonutChart statusItems={leaveItems} usageData={usageData} />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Riepilogo Saldi {selectedYear}</h1>
          </div>

          <div className="space-y-4">
            {/* Card Buoni Pasto */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <span className="font-semibold text-gray-800 dark:text-white">Buoni Pasto</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{mealVouchersEarned}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Maturati</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                Buoni pasto maturati nel {selectedYear}. Un buono viene guadagnato lavorando 7 ore continuative o 6h + pausa ≤2h.
              </p>
            </div>

            {statusItems.map((item) => {
                const used = usageData[item.code] || 0;
                const balance = item.entitlement - used;
                const details = getStatusItemDetails(`code-${item.code}`, statusItems);
                const progress = item.entitlement > 0 ? (used / item.entitlement) * 100 : 0;
                const isOvertime = item.category === 'overtime';
                const isClickable = !isOvertime && (item.category === 'leave-day' || item.category === 'leave-hours');
                
                return (
                    <div 
                        key={item.code} 
                        className={`bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg ${
                            isOvertime 
                              ? 'cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all hover:shadow-md' 
                              : isClickable 
                                ? 'cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all hover:shadow-md'
                                : ''
                        }`}
                        onClick={
                          isOvertime 
                            ? () => onOpenAddOvertimeModal(new Date()) 
                            : isClickable 
                              ? () => setSelectedStatusItem(item)
                              : undefined
                        }
                        title={
                          isOvertime 
                            ? 'Click per aggiungere straordinari' 
                            : isClickable 
                              ? 'Click per vedere i dettagli'
                              : ''
                        }
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-3">
                                <details.Icon className={`w-6 h-6 flex-shrink-0 ${details.textColor}`} />
                                <span className="font-semibold text-gray-800 dark:text-white truncate" title={item.description}>{item.description}</span>
                            </div>
                            <div className="text-right">
                                {isOvertime ? (
                                    <>
                                        <p className="text-lg font-bold text-orange-500">{used.toFixed(1)}h</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Accumulate</p>
                                    </>
                                ) : (
                                    <>
                                        <p className={`text-lg font-bold ${balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{balance}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Saldo</p>
                                    </>
                                )}
                            </div>
                        </div>
                        {item.entitlement > 0 && (
                            <>
                                <div className="bg-gray-200 dark:bg-slate-600 rounded-full h-2 w-full">
                                    <div className={`${details.bgColor} h-2 rounded-full`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    <span>Usati: {used}</span>
                                    <span>Previsti: {item.entitlement}</span>
                                </div>
                            </>
                        )}
                    </div>
                )
            })}
          </div>
        </div>
      </div>

      {/* Balance Details Modal */}
      {selectedStatusItem && (
        <BalanceDetailsModal
          statusItem={selectedStatusItem}
          allDayInfo={allDayInfo}
          selectedYear={selectedYear}
          onClose={() => setSelectedStatusItem(null)}
        />
      )}
    </main>
  );
};

export default BalancesPage;

import React, { useMemo, useState } from 'react';
import { StatusItem, AllDayInfo, AllTimeLogs, WorkSettings, AllManualOvertime } from '../types';
import { calculateStatusUsage } from '../utils/statusUtils';
import LeaveDonutChart from '../components/charts/LeaveDonutChart';
import { getStatusItemDetails } from '../utils/leaveUtils';
import AnnualSummary from '../components/AnnualSummary';

interface BalancesPageProps {
  statusItems: StatusItem[];
  allDayInfo: AllDayInfo;
  allLogs: AllTimeLogs;
  workSettings: WorkSettings;
  allManualOvertime: AllManualOvertime;
}

const BalancesPage: React.FC<BalancesPageProps> = ({ statusItems, allDayInfo, allLogs, workSettings, allManualOvertime }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const usageData = useMemo(() => calculateStatusUsage(allDayInfo, selectedYear, statusItems), [allDayInfo, selectedYear, statusItems]);

  const leaveItems = useMemo(() => statusItems.filter(item => item.category === 'leave-day' || item.category === 'leave-hours'), [statusItems]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <LeaveDonutChart statusItems={leaveItems} usageData={usageData} />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Riepilogo Saldi {selectedYear}</h1>
          </div>

          <div className="space-y-4">
            {statusItems.map((item) => {
                const used = usageData[item.code] || 0;
                const balance = item.entitlement - used;
                const details = getStatusItemDetails(`code-${item.code}`, statusItems);
                const progress = item.entitlement > 0 ? (used / item.entitlement) * 100 : 0;
                
                return (
                    <div key={item.code} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-3">
                                <details.Icon className={`w-6 h-6 flex-shrink-0 ${details.textColor}`} />
                                <span className="font-semibold text-gray-800 dark:text-white truncate" title={item.description}>{item.description}</span>
                            </div>
                            <div className="text-right">
                                <p className={`text-lg font-bold ${balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{balance}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Saldo</p>
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
    </main>
  );
};

export default BalancesPage;
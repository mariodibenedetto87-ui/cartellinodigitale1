import React, { useMemo, memo } from 'react';
import { AllDayInfo, StatusItem, AllManualOvertime } from '../types';
import { calculateStatusUsage } from '../utils/statusUtils';
import { getStatusItemDetails } from '../utils/leaveUtils';

interface BalancesSummaryProps {
  allDayInfo: AllDayInfo;
  statusItems: StatusItem[];
  allManualOvertime?: AllManualOvertime;
}

const BalancesSummary: React.FC<BalancesSummaryProps> = memo(({ allDayInfo, statusItems, allManualOvertime }) => {
  const currentYear = new Date().getFullYear();
  // FIX: Added missing `statusItems` argument to the function call and dependency array.
  const usageData = useMemo(() => calculateStatusUsage(allDayInfo, currentYear, statusItems, allManualOvertime), [allDayInfo, currentYear, statusItems, allManualOvertime]);

  // Select a few key balances to display. E.g., Ferie, Festività, and one with high usage.
  const keyBalanceCodes = useMemo(() => {
    const codes = new Set<number>();
    // Always include Ferie (15) and Festività (10) if they exist
    if (statusItems.some(i => i.code === 15)) codes.add(15);
    if (statusItems.some(i => i.code === 10)) codes.add(10);
    
    // Add other leave types with entitlements, prioritizing those already used.
    const otherLeaveItems = statusItems
      .filter(item => (item.category === 'leave-day' || item.category === 'leave-hours') && !codes.has(item.code) && item.entitlement > 0)
      .sort((a, b) => (usageData[b.code] || 0) - (usageData[a.code] || 0));

    otherLeaveItems.slice(0, 2).forEach(item => codes.add(item.code));
    
    return Array.from(codes);
  }, [statusItems, usageData]);

  const balancesToShow = useMemo(() => {
    return keyBalanceCodes
      .map(code => statusItems.find(item => item.code === code))
      .filter((item): item is StatusItem => !!item);
  }, [keyBalanceCodes, statusItems]);

  if (balancesToShow.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-900/20 rounded-2xl p-6 shadow-lg dark:shadow-black/20 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 border border-emerald-100 dark:border-emerald-900/50">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Saldi Principali</h3>
      </div>
      <div className="space-y-4">
        {balancesToShow.map(item => {
          const used = usageData[item.code] || 0;
          // Per ACC (accredito) sommare, per GPO (consumo) sottrarre
          const balance = item.class === 'ACC' ? item.entitlement + used : item.entitlement - used;
          const details = getStatusItemDetails(`code-${item.code}`, statusItems);
          const progress = item.entitlement > 0 ? (Math.abs(used) / item.entitlement) * 100 : 0;
          
          return (
            <div key={item.code} className="p-3 rounded-xl bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${details.bgColor}/20 dark:${details.bgColor}/10`}>
                      <details.Icon className={`w-4 h-4 ${details.textColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white truncate" title={item.description}>{item.description}</span>
                </div>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${balance < 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {balance}
                </span>
              </div>
              <div className="bg-gray-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden shadow-inner">
                <div className={`${details.bgColor} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`} style={{ width: `${Math.min(100, progress)}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-slate-300 mt-2 font-medium">
                <span>Usati: <strong>{used}</strong></span>
                <span>Previsti: <strong>{item.entitlement}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
BalancesSummary.displayName = 'BalancesSummary';

export default BalancesSummary;

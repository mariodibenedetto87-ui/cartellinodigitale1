
import React, { useMemo } from 'react';
import { AllDayInfo, StatusItem } from '../types';
import { calculateStatusUsage } from '../utils/statusUtils';
import { getStatusItemDetails } from '../utils/leaveUtils';

interface BalancesSummaryProps {
  allDayInfo: AllDayInfo;
  statusItems: StatusItem[];
}

const BalancesSummary: React.FC<BalancesSummaryProps> = ({ allDayInfo, statusItems }) => {
  const currentYear = new Date().getFullYear();
  // FIX: Added missing `statusItems` argument to the function call and dependency array.
  const usageData = useMemo(() => calculateStatusUsage(allDayInfo, currentYear, statusItems), [allDayInfo, currentYear, statusItems]);

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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4">Saldi Principali</h3>
      <div className="space-y-4">
        {balancesToShow.map(item => {
          const used = usageData[item.code] || 0;
          const balance = item.entitlement - used;
          const details = getStatusItemDetails(`code-${item.code}`, statusItems);
          const progress = item.entitlement > 0 ? (used / item.entitlement) * 100 : 0;
          
          return (
            <div key={item.code}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                    <details.Icon className={`w-5 h-5 ${details.textColor}`} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white truncate" title={item.description}>{item.description}</span>
                </div>
                <span className={`text-sm font-bold ${balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {balance}
                </span>
              </div>
              <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className={`${details.bgColor} h-2.5 rounded-full`} style={{ width: `${Math.min(100, progress)}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                <span>Usati: {used}</span>
                <span>Previsti: {item.entitlement}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BalancesSummary;

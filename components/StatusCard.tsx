import React from 'react';
// FIX: Corrected import path to be relative.
import { WorkStatus } from '../types';

interface StatusCardProps {
  status: WorkStatus;
  duration: string;
}

const ClockIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const StatusCard: React.FC<StatusCardProps> = ({ status, duration }) => {
  const isClockedIn = status === WorkStatus.ClockedIn;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4">Stato Attuale</h3>
      <div className="flex items-center space-x-4">
        <div className={`relative flex h-3 w-3`}>
            {isClockedIn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isClockedIn ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
        <span className={`text-xl font-bold ${isClockedIn ? 'text-green-500 dark:text-green-400' : 'text-red-500'}`}>
          {isClockedIn ? 'Timbratura Attiva' : 'Timbratura Non Attiva'}
        </span>
      </div>
      {isClockedIn && (
        <div className="mt-6 border-t border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">Durata Sessione Corrente</p>
            <div className="flex items-center space-x-2 mt-1">
                <ClockIcon className="w-6 h-6 text-teal-500 dark:text-teal-400" />
                <p className="text-3xl font-mono tracking-wider text-slate-800 dark:text-white">{duration}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default StatusCard;

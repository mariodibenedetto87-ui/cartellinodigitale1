import React from 'react';
import { StatusItem } from '../../types';
import { formatHoursDecimal } from '../../utils/timeUtils';

interface StatusUsageModalProps {
    item: StatusItem;
    monthlyUsage: number[];
    onClose: () => void;
}

const StatusUsageModal: React.FC<StatusUsageModalProps> = ({ item, monthlyUsage, onClose }) => {
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    const isHourly = item.category === 'leave-hours' || item.category === 'overtime';
    const unit = isHourly ? 'h' : 'gg';

    const totalUsed = monthlyUsage.reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Dettaglio Utilizzo
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            {item.description}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-1">
                        {months.map((month, index) => {
                            const usage = monthlyUsage[index];
                            const isZero = usage === 0;

                            return (
                                <div
                                    key={month}
                                    className={`flex justify-between items-center p-3 rounded-lg transition-colors ${isZero
                                            ? 'text-gray-400 dark:text-slate-500'
                                            : 'bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium'
                                        }`}
                                >
                                    <span>{month}</span>
                                    <span>
                                        {isHourly ? formatHoursDecimal(usage) : usage} {unit}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-gray-900 dark:text-white">Totale Annuale</span>
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                        {isHourly ? formatHoursDecimal(totalUsed) : totalUsed} {unit}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StatusUsageModal;

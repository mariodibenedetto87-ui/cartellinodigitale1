import React from 'react';
import { formatDuration } from '../utils/timeUtils';

interface WeeklyHoursChartProps {
  totalWorkMs: number;
  totalOvertimeMs: number;
}

const ChartBar: React.FC<{
    percentage: number;
    color: string;
    label: string;
    value: string;
}> = ({ percentage, color, label, value }) => (
    <div className="flex items-center group">
        <div className="w-28 text-sm text-gray-600 dark:text-slate-400 pr-4 text-right">{label}</div>
        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-6 relative">
            <div
                className={`${color} h-6 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-white mix-blend-difference">
                {value}
            </span>
        </div>
    </div>
);


const WeeklyHoursChart: React.FC<WeeklyHoursChartProps> = ({ totalWorkMs, totalOvertimeMs }) => {
    const standardWorkMs = totalWorkMs - totalOvertimeMs;
    
    // Prevent division by zero and handle no-work case
    const maxHours = Math.max(totalWorkMs, 1);

    const standardPercentage = (standardWorkMs / maxHours) * 100;
    const overtimePercentage = (totalOvertimeMs / maxHours) * 100;
    
    const hasData = totalWorkMs > 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4">Grafico Ore Settimanali</h3>
            {hasData ? (
                <div className="space-y-4">
                    <ChartBar
                        percentage={standardPercentage}
                        color="bg-teal-500"
                        label="Ore Ordinarie"
                        value={formatDuration(standardWorkMs)}
                    />
                    {totalOvertimeMs > 0 && (
                        <ChartBar
                            percentage={overtimePercentage}
                            color="bg-orange-500"
                            label="Straordinario"
                            value={formatDuration(totalOvertimeMs)}
                        />
                    )}
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-gray-500 dark:text-slate-400">Nessuna ora lavorata registrata per questa settimana.</p>
                </div>
            )}
        </div>
    );
};

export default WeeklyHoursChart;

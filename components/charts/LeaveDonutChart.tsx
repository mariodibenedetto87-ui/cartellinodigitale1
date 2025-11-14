import React, { useMemo, useState } from 'react';
import { StatusItem } from '../../types';
import { getStatusItemDetails } from '../../utils/leaveUtils';

interface LeaveDonutChartProps {
  statusItems: StatusItem[];
  usageData: Record<number, number>;
}

const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

const LeaveDonutChart: React.FC<LeaveDonutChartProps> = ({ statusItems, usageData }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const data = statusItems
      .map((item, index) => ({
        id: `code-${item.code}`,
        name: item.description,
        value: usageData[item.code] || 0,
        color: COLORS[index % COLORS.length],
        details: getStatusItemDetails(`code-${item.code}`, statusItems),
      }))
      .filter(item => item.value > 0);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let cumulative = 0;
    return {
      segments: data.map(item => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const segment = { ...item, percentage, offset: cumulative };
        cumulative += percentage;
        return segment;
      }),
      total,
    };
  }, [statusItems, usageData]);

  const radius = 85;
  const circumference = 2 * Math.PI * radius;

  if (chartData.total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 flex flex-col items-center justify-center h-full text-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">Utilizzo Permessi</h3>
        <p className="text-gray-500 dark:text-slate-400 mt-4">Nessun giorno di permesso utilizzato quest'anno.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4 text-center">Ripartizione Utilizzo Permessi</h3>
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 200 200" className="transform -rotate-90">
          {chartData.segments.map(segment => (
            <circle
              key={segment.id}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth="30"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (segment.percentage / 100) * circumference}
              transform={`rotate(${(segment.offset / 100) * 360} 100 100)`}
              className="transition-all duration-300"
              style={{
                filter: hoveredSegment && hoveredSegment !== segment.id ? 'grayscale(80%) opacity(0.5)' : 'none'
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{chartData.total}</span>
            <span className="text-sm text-gray-500 dark:text-slate-400">Giorni</span>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {chartData.segments.map(segment => (
          <div 
            key={segment.id} 
            className="flex items-center justify-between text-sm p-2 rounded-md transition-all"
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
            style={{
                backgroundColor: hoveredSegment === segment.id ? `${segment.color}20` : 'transparent'
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-gray-700 dark:text-slate-300 truncate" title={segment.name}>{segment.name}</span>
            </div>
            <div className="font-semibold text-slate-800 dark:text-white">
              {segment.value}
              <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">({segment.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveDonutChart;
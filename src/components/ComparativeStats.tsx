import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { AllTimeLogs, AllManualOvertime, WorkSettings } from '../types';
import { compareMonths, compareYears } from '../utils/statsUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ComparativeStatsProps {
  allLogs: AllTimeLogs;
  allManualOvertime: AllManualOvertime;
  workSettings: WorkSettings;
}

export default function ComparativeStats({
  allLogs,
  allManualOvertime,
  workSettings,
}: ComparativeStatsProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [comparisonType, setComparisonType] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // Calculate stats based on comparison type
  const monthComparison = comparisonType === 'month' ? compareMonths(
    selectedYear,
    selectedMonth,
    selectedMonth === 1 ? selectedYear - 1 : selectedYear,
    selectedMonth === 1 ? 12 : selectedMonth - 1,
    allLogs,
    allManualOvertime,
    workSettings
  ) : null;

  const yearComparison = comparisonType === 'year' ? compareYears(
    selectedYear,
    selectedYear - 1,
    allLogs,
    allManualOvertime,
    workSettings
  ) : null;

  // Chart configurations
  const monthlyTrendChartData = yearComparison ? {
    labels: yearComparison.current.map(m => m.monthName),
    datasets: [
      {
        label: `${selectedYear}`,
        data: yearComparison.current.map(m => m.totalHours),
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: `${selectedYear - 1}`,
        data: yearComparison.previous.map(m => m.totalHours),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const overtimeComparisonData = yearComparison ? {
    labels: yearComparison.current.map(m => m.monthName),
    datasets: [
      {
        label: `Straordinario ${selectedYear}`,
        data: yearComparison.current.map(m => m.overtimeHours),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      },
      {
        label: `Straordinario ${selectedYear - 1}`,
        data: yearComparison.previous.map(m => m.overtimeHours),
        backgroundColor: 'rgba(156, 163, 175, 0.7)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'system-ui',
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}h`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const getDeltaColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getDeltaIcon = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo Confronto
            </label>
            <select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value as 'month' | 'year')}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="month">Confronto Mensile</option>
              <option value="year">Confronto Annuale</option>
            </select>
          </div>
          
          {comparisonType === 'month' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mese
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'].map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anno
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Month Comparison */}
      {comparisonType === 'month' && monthComparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ore Totali</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {monthComparison.current.totalHours.toFixed(1)}h
            </p>
            <p className={`text-sm font-medium ${getDeltaColor(monthComparison.delta.totalHours)}`}>
              {getDeltaIcon(monthComparison.delta.totalHours)} {Math.abs(monthComparison.delta.totalHours).toFixed(1)}h vs mese precedente
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Giorni Lavorati</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {monthComparison.current.workDays}
            </p>
            <p className={`text-sm font-medium ${getDeltaColor(monthComparison.delta.workDays)}`}>
              {getDeltaIcon(monthComparison.delta.workDays)} {Math.abs(monthComparison.delta.workDays)} giorni
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Media Giornaliera</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {monthComparison.current.averageHoursPerDay.toFixed(1)}h
            </p>
            <p className={`text-sm font-medium ${getDeltaColor(monthComparison.delta.averageHoursPerDay)}`}>
              {getDeltaIcon(monthComparison.delta.averageHoursPerDay)} {Math.abs(monthComparison.delta.averageHoursPerDay).toFixed(1)}h/giorno
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Produttività</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {monthComparison.current.productivity.toFixed(0)}%
            </p>
            <p className={`text-sm font-medium ${getDeltaColor(monthComparison.delta.productivity)}`}>
              {getDeltaIcon(monthComparison.delta.productivity)} {Math.abs(monthComparison.delta.productivity).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Year Comparison */}
      {comparisonType === 'year' && yearComparison && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ore Annuali</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {yearComparison.yearDelta.totalHours > 0 ? '+' : ''}
                {yearComparison.yearDelta.totalHours.toFixed(0)}h
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                vs {selectedYear - 1}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Giorni Lavorati</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {yearComparison.yearDelta.totalWorkDays > 0 ? '+' : ''}
                {yearComparison.yearDelta.totalWorkDays}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                giorni in più/meno
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Straordinari</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {yearComparison.yearDelta.totalOvertime > 0 ? '+' : ''}
                {yearComparison.yearDelta.totalOvertime.toFixed(0)}h
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                differenza annuale
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Produttività Media</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {yearComparison.yearDelta.averageProductivity > 0 ? '+' : ''}
                {yearComparison.yearDelta.averageProductivity.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                variazione annuale
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Trend Ore Mensili
              </h3>
              <div className="h-80">
                {monthlyTrendChartData && (
                  <Line data={monthlyTrendChartData} options={chartOptions} />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confronto Straordinari
              </h3>
              <div className="h-80">
                {overtimeComparisonData && (
                  <Bar data={overtimeComparisonData} options={chartOptions} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

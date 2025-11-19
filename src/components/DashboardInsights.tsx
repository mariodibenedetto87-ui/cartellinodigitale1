import React from 'react';
import { AllTimeLogs, AllDayInfo, AllManualOvertime, WorkSettings } from '../types';
import { formatDateKey, addDays, parseDateKey } from '../utils/timeUtils';

interface DashboardInsightsProps {
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    allManualOvertime: AllManualOvertime;
    workSettings: WorkSettings;
}

interface Insight {
    id: string;
    icon: string;
    title: string;
    value: string;
    description: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
}

const TrendUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
);

const TrendDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const DashboardInsights: React.FC<DashboardInsightsProps> = ({
    allLogs,
    allManualOvertime,
    workSettings
}) => {
    const generateInsights = (): Insight[] => {
        const insights: Insight[] = [];
        const now = new Date();

        // 1. Calcola ore settimana corrente
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        let weekHours = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            if (date > now) break;
            const dateKey = formatDateKey(date);
            const entries = allLogs[dateKey] || [];
            
            for (let j = 0; j < entries.length; j += 2) {
                if (entries[j + 1]) {
                    const duration = entries[j + 1].timestamp.getTime() - entries[j].timestamp.getTime();
                    weekHours += duration / (1000 * 60 * 60);
                }
            }
        }

        // 2. Calcola ore settimana precedente per confronto
        const prevWeekStart = addDays(weekStart, -7);
        let prevWeekHours = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = addDays(prevWeekStart, i);
            const dateKey = formatDateKey(date);
            const entries = allLogs[dateKey] || [];
            
            for (let j = 0; j < entries.length; j += 2) {
                if (entries[j + 1]) {
                    const duration = entries[j + 1].timestamp.getTime() - entries[j].timestamp.getTime();
                    prevWeekHours += duration / (1000 * 60 * 60);
                }
            }
        }

        const weekTrend = weekHours > prevWeekHours ? 'up' : weekHours < prevWeekHours ? 'down' : 'neutral';
        const weekChange = Math.abs(weekHours - prevWeekHours).toFixed(1);

        insights.push({
            id: 'weekly-hours',
            icon: '⏱️',
            title: 'Ore Questa Settimana',
            value: `${weekHours.toFixed(1)}h`,
            description: weekTrend === 'up' 
                ? `+${weekChange}h rispetto alla scorsa settimana`
                : weekTrend === 'down'
                ? `-${weekChange}h rispetto alla scorsa settimana`
                : 'Stesso livello della scorsa settimana',
            trend: weekTrend,
            color: 'from-blue-500 to-blue-600'
        });

        // 3. Media giornaliera
        const allDays = Object.keys(allLogs).length;
        const totalHours = Object.values(allLogs).reduce((sum, entries) => {
            let dayHours = 0;
            for (let i = 0; i < entries.length; i += 2) {
                if (entries[i + 1]) {
                    dayHours += (entries[i + 1].timestamp.getTime() - entries[i].timestamp.getTime()) / (1000 * 60 * 60);
                }
            }
            return sum + dayHours;
        }, 0);
        
        const avgDaily = allDays > 0 ? totalHours / allDays : 0;
        const avgTrend = avgDaily > workSettings.standardDayHours ? 'up' : avgDaily < workSettings.standardDayHours ? 'down' : 'neutral';

        insights.push({
            id: 'daily-average',
            icon: '📊',
            title: 'Media Giornaliera',
            value: `${avgDaily.toFixed(1)}h`,
            description: avgDaily > workSettings.standardDayHours
                ? `${(avgDaily - workSettings.standardDayHours).toFixed(1)}h sopra lo standard`
                : avgDaily < workSettings.standardDayHours
                ? `${(workSettings.standardDayHours - avgDaily).toFixed(1)}h sotto lo standard`
                : 'Perfettamente in linea con lo standard',
            trend: avgTrend,
            color: 'from-purple-500 to-purple-600'
        });

        // 4. Straordinario totale
        const totalOvertime = Object.values(allManualOvertime).reduce((sum, entries) => {
            return sum + entries.reduce((entrySum, entry) => entrySum + entry.durationMs, 0);
        }, 0);
        const overtimeHours = totalOvertime / (1000 * 60 * 60);

        // Calcola straordinario mese precedente
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        let lastMonthOvertime = 0;

        Object.entries(allManualOvertime).forEach(([dateKey, entries]) => {
            const date = parseDateKey(dateKey);
            if (date >= lastMonthStart && date <= lastMonthEnd) {
                lastMonthOvertime += entries.reduce((sum, entry) => sum + entry.durationMs, 0);
            }
        });

        const lastMonthOvertimeHours = lastMonthOvertime / (1000 * 60 * 60);
        const overtimeTrend = overtimeHours > lastMonthOvertimeHours ? 'up' : overtimeHours < lastMonthOvertimeHours ? 'down' : 'neutral';

        insights.push({
            id: 'overtime-total',
            icon: '⚡',
            title: 'Straordinario Totale',
            value: `${overtimeHours.toFixed(1)}h`,
            description: overtimeTrend === 'up'
                ? 'In aumento rispetto al mese scorso'
                : overtimeTrend === 'down'
                ? 'In diminuzione rispetto al mese scorso'
                : 'Stabile rispetto al mese scorso',
            trend: overtimeTrend,
            color: 'from-amber-500 to-amber-600'
        });

        // 5. Suggerimento Smart AI
        const daysWorked = Object.entries(allLogs).filter(([key]) => {
            const date = parseDateKey(key);
            return date.getMonth() === now.getMonth();
        }).length;

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const workDaysLeft = daysInMonth - now.getDate();
        
        let aiSuggestion = '';
        if (weekHours < workSettings.standardDayHours * 5 - 5 && now.getDay() >= 4) {
            aiSuggestion = 'Aumenta il ritmo! Sei sotto media questa settimana.';
        } else if (weekHours > workSettings.standardDayHours * 5 + 5) {
            aiSuggestion = 'Ottimo lavoro! Considera di prenderti una pausa.';
        } else if (overtimeHours > 20 && workDaysLeft < 10) {
            aiSuggestion = 'Hai accumulato molto straordinario. Pianifica recuperi.';
        } else if (daysWorked < 10 && now.getDate() > 20) {
            aiSuggestion = 'Pochi giorni lavorati questo mese. Verifica le assenze.';
        } else {
            aiSuggestion = 'Tutto procede bene! Continua così.';
        }

        insights.push({
            id: 'ai-suggestion',
            icon: '🤖',
            title: 'Suggerimento AI',
            value: aiSuggestion,
            description: 'Basato sui tuoi pattern di lavoro',
            color: 'from-teal-500 to-teal-600'
        });

        return insights;
    };

    const insights = generateInsights();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg">
                    <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Dashboard Insights
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-slate-600">
                        Analisi intelligente delle tue performance
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                    <div
                        key={insight.id}
                        className="p-4 rounded-lg bg-gradient-to-br border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-lg animate-fade-in-up"
                        style={{ 
                            animationDelay: `${index * 100}ms`,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-3xl">{insight.icon}</div>
                            {insight.trend && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                    insight.trend === 'up' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : insight.trend === 'down'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                                }`}>
                                    {insight.trend === 'up' ? <TrendUpIcon className="w-3 h-3" /> : insight.trend === 'down' ? <TrendDownIcon className="w-3 h-3" /> : '→'}
                                </div>
                            )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            {insight.title}
                        </h3>
                        <p className={`text-2xl font-bold mb-2 bg-gradient-to-r ${insight.color} bg-clip-text text-transparent`}>
                            {insight.value}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-600 leading-relaxed">
                            {insight.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardInsights;

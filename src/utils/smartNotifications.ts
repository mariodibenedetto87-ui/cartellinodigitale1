import { WorkStatus, AllTimeLogs, AllDayInfo, WorkSettings, AllManualOvertime } from '../types';
import { formatDateKey, addDays, parseDateKey } from './timeUtils';

export interface SmartNotification {
    id: string;
    type: 'reminder' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    actionLabel?: string;
    actionCallback?: () => void;
}

// Calcola ore lavorate in una settimana
const getWeeklyHours = (
    allLogs: AllTimeLogs,
    startDate: Date,
    standardHours: number
): { worked: number; expected: number } => {
    let totalWorked = 0;
    let expectedDays = 0;

    for (let i = 0; i < 7; i++) {
        const date = addDays(startDate, i);
        const dateKey = formatDateKey(date);
        const entries = allLogs[dateKey] || [];
        
        // Skip domenica
        if (date.getDay() === 0) continue;
        expectedDays++;

        for (let j = 0; j < entries.length; j += 2) {
            if (entries[j + 1]) {
                const duration = entries[j + 1].timestamp.getTime() - entries[j].timestamp.getTime();
                totalWorked += duration / (1000 * 60 * 60);
            }
        }
    }

    return {
        worked: totalWorked,
        expected: expectedDays * standardHours
    };
};

// Genera notifiche smart basate sul contesto
export const generateSmartNotifications = (
    workStatus: WorkStatus,
    allLogs: AllTimeLogs,
    allDayInfo: AllDayInfo,
    allManualOvertime: AllManualOvertime,
    workSettings: WorkSettings,
    currentSessionStart: Date | null
): SmartNotification[] => {
    const notifications: SmartNotification[] = [];
    const now = new Date();
    const todayKey = formatDateKey(now);
    const currentHour = now.getHours();

    // 1. REMINDER: Timbratura dimenticata
    if (workStatus === WorkStatus.ClockedOut && currentHour >= 9 && currentHour <= 12) {
        const todayEntries = allLogs[todayKey] || [];
        if (todayEntries.length === 0) {
            const todayInfo = allDayInfo[todayKey];
            const isWorkDay = !todayInfo?.leave && todayInfo?.shift !== 'rest';
            
            if (isWorkDay) {
                notifications.push({
                    id: 'forgot-clock-in',
                    type: 'warning',
                    title: '⏰ Timbratura Mancante',
                    message: 'Non hai ancora timbrato oggi! Ricordati di registrare l\'entrata.',
                    priority: 'high',
                    actionLabel: 'Timbra Ora',
                    actionCallback: () => {} // Handled by parent
                });
            }
        }
    }

    // 2. REMINDER: Fine turno imminente
    if (workStatus === WorkStatus.ClockedIn && currentSessionStart) {
        const sessionHours = (now.getTime() - currentSessionStart.getTime()) / (1000 * 60 * 60);
        const todayInfo = allDayInfo[todayKey];
        const shift = workSettings.shifts.find(s => s.id === todayInfo?.shift);
        
        if (shift && shift.endHour) {
            const endHour = shift.endHour;
            const hoursUntilEnd = endHour - currentHour;
            
            if (hoursUntilEnd <= 0.5 && hoursUntilEnd > 0) {
                notifications.push({
                    id: 'shift-ending-soon',
                    type: 'info',
                    title: '🔔 Fine Turno Imminente',
                    message: `Il tuo turno ${shift.name} termina tra circa ${Math.round(hoursUntilEnd * 60)} minuti.`,
                    priority: 'medium'
                });
            }
        }

        // Alert straordinario in corso
        if (sessionHours > workSettings.standardDayHours + 1) {
            const overtimeHours = sessionHours - workSettings.standardDayHours;
            notifications.push({
                id: 'overtime-alert',
                type: 'warning',
                title: '⚡ Straordinario in Corso',
                message: `Stai lavorando da ${sessionHours.toFixed(1)}h. Straordinario: +${overtimeHours.toFixed(1)}h`,
                priority: 'medium'
            });
        }
    }

    // 3. INSIGHTS: Trend settimanale
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Lunedì
    const weekStats = getWeeklyHours(allLogs, weekStart, workSettings.standardDayHours);
    
    if (now.getDay() >= 4) { // Giovedì o dopo
        const deficit = weekStats.expected - weekStats.worked;
        
        if (deficit > 4) {
            notifications.push({
                id: 'weekly-deficit',
                type: 'warning',
                title: '📉 Ore Settimanali Sotto Media',
                message: `Questa settimana hai lavorato ${Math.round(weekStats.worked)}h su ${Math.round(weekStats.expected)}h previste. Deficit: ${Math.round(deficit)}h`,
                priority: 'low'
            });
        } else if (weekStats.worked > weekStats.expected + 3) {
            notifications.push({
                id: 'weekly-surplus',
                type: 'success',
                title: '🎉 Ottimo Lavoro!',
                message: `Questa settimana hai lavorato ${Math.round(weekStats.worked)}h, superando le ${Math.round(weekStats.expected)}h previste!`,
                priority: 'low'
            });
        }
    }

    // 4. REMINDER: Ferie in scadenza
    const leaveCount = Object.entries(allDayInfo).filter(([dateKey, info]) => {
        const date = parseDateKey(dateKey);
        return info.leave?.type === 'holiday' && date < now;
    }).length;

    const remainingLeave = 26 - leaveCount; // Assumo 26 giorni standard
    const monthsLeft = 12 - now.getMonth();
    
    if (remainingLeave > monthsLeft * 2 && now.getMonth() >= 9) { // Ottobre+
        notifications.push({
            id: 'leave-expiring',
            type: 'info',
            title: '🌴 Ferie in Scadenza',
            message: `Hai ancora ${remainingLeave} giorni di ferie. Pianifica ora per non perderli!`,
            priority: 'medium'
        });
    }

    // 5. PATTERN: Turni irregolari
    const lastWeekLogs = Object.entries(allLogs)
        .filter(([dateKey]) => {
            const date = parseDateKey(dateKey);
            const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7 && daysAgo >= 0;
        });

    let irregularDays = 0;
    lastWeekLogs.forEach(([, entries]) => {
        if (entries.length % 2 !== 0) irregularDays++; // Timbrature dispari
    });

    if (irregularDays >= 2) {
        notifications.push({
            id: 'irregular-pattern',
            type: 'warning',
            title: '⚠️ Timbrature Irregolari',
            message: `Hai ${irregularDays} giorni con timbrature incomplete nell'ultima settimana. Verifica i tuoi log.`,
            priority: 'high'
        });
    }

    // 6. REMINDER: Registra straordinario manuale
    const lastWeekOvertime = Object.entries(allManualOvertime)
        .filter(([dateKey]) => {
            const date = parseDateKey(dateKey);
            const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 30;
        });

    if (lastWeekOvertime.length === 0 && weekStats.worked > weekStats.expected + 5) {
        notifications.push({
            id: 'missing-overtime-entry',
            type: 'info',
            title: '📝 Registra Straordinario',
            message: 'Hai lavorato ore extra questa settimana. Ricordati di registrare lo straordinario!',
            priority: 'medium'
        });
    }

    return notifications.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
};

// Browser notification (se permesso)
export const sendBrowserNotification = (notification: SmartNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.message,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: notification.id,
            requireInteraction: notification.priority === 'high'
        });
    }
};

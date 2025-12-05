import { useState } from 'react';
import { useGeofencing } from './useGeofencing';
import { WorkSettings, WorkLocation, WorkStatus } from '../types';

interface UseSmartNotificationsProps {
    workSettings: WorkSettings;
    workLocation?: WorkLocation | null;
    workStatus: WorkStatus;
    onToggleWorkStatus: () => Promise<void>;
}

export const useSmartNotifications = ({
    workSettings,
    workLocation,
    workStatus,
    onToggleWorkStatus
}: UseSmartNotificationsProps) => {
    const [smartNotifications, setSmartNotifications] = useState<any[]>([]); // Placeholder for future smart notifications
    const [showGeofenceNotification, setShowGeofenceNotification] = useState(false);
    const [showExitNotification, setShowExitNotification] = useState(false);
    const [geofenceDistance, setGeofenceDistance] = useState(0);
    const [lastExitTime, setLastExitTime] = useState<Date | null>(null);

    // Helper function to check if current time is near shift start/end
    const isNearShiftTime = (shiftHour: number | null | undefined, minutesBefore: number = 30): boolean => {
        if (shiftHour === null || shiftHour === undefined) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const shiftTotalMinutes = shiftHour * 60;

        // Check if we're within minutesBefore of the shift time
        const diff = shiftTotalMinutes - currentTotalMinutes;
        return diff >= 0 && diff <= minutesBefore;
    };

    useGeofencing({
        workLocation: workLocation ?? null,
        enabled: !!workLocation,
        onEnterWorkZone: (distance) => {
            console.log('📍 Entrato nella zona di lavoro!', distance);

            const shiftStart = workSettings.shifts.find(s => s.id !== 'rest')?.startHour;

            // Check if we should show the notification
            let shouldShow = false;

            // Rule 1: Always show near shift start time
            if (isNearShiftTime(shiftStart, 30)) {
                shouldShow = true;
                console.log('✅ Mostro notifica: vicino all\'inizio turno');
            }
            // Rule 2: Show if returning within 3 hours of last exit
            else if (lastExitTime) {
                const hoursSinceExit = (new Date().getTime() - lastExitTime.getTime()) / (1000 * 60 * 60);
                if (hoursSinceExit <= 3) {
                    shouldShow = true;
                    console.log(`✅ Mostro notifica: ritorno entro 3h (${hoursSinceExit.toFixed(1)}h fa)`);
                } else {
                    console.log(`❌ Non mostro notifica: troppo tempo dall'uscita (${hoursSinceExit.toFixed(1)}h fa)`);
                }
            }
            // Rule 3: If no previous exit, show only near shift time
            else {
                console.log('❌ Non mostro notifica: nessuna uscita recente e non vicino al turno');
            }

            if (shouldShow) {
                setGeofenceDistance(distance);
                setShowGeofenceNotification(true);
            }
        },
        onExitWorkZone: (distance) => {
            console.log('🚪 Uscito dalla zona di lavoro!', distance);

            const shiftEnd = workSettings.shifts.find(s => s.id !== 'rest')?.endHour;

            // Check if we should show the exit notification
            let shouldShow = false;

            // Rule 1: Always show if near shift end time
            if (isNearShiftTime(shiftEnd, 30)) {
                shouldShow = true;
                console.log('✅ Mostro notifica uscita: vicino alla fine turno');
            }
            // Rule 2: Show if currently clocked in (need to remind to clock out)
            else if (workStatus === WorkStatus.ClockedIn) {
                shouldShow = true;
                console.log('✅ Mostro notifica uscita: sei timbrato (ClockedIn)');
            }
            // Rule 3: Show if it's during work hours (after shift start, before 2h after shift end)
            else if (shiftEnd) {
                const now = new Date();
                const currentHour = now.getHours();
                const shiftStart = workSettings.shifts.find(s => s.id !== 'rest')?.startHour || 8;
                // Mostra se siamo in orario lavorativo (da inizio turno a 2h dopo fine turno)
                if (currentHour >= shiftStart && currentHour <= shiftEnd + 2) {
                    shouldShow = true;
                    console.log('✅ Mostro notifica uscita: in orario lavorativo');
                } else {
                    console.log('ℹ️ Noto uscita ma fuori orario lavorativo');
                }
            } else {
                console.log('ℹ️ Noto uscita ma nessun turno configurato');
            }

            // Track exit time for the 3-hour rule
            setLastExitTime(new Date());

            if (shouldShow) {
                setGeofenceDistance(distance);
                setShowExitNotification(true);
            }
        },
        shiftStartHour: workSettings.shifts.find(s => s.id !== 'rest')?.startHour ?? undefined,
        shiftEndHour: workSettings.shifts.find(s => s.id !== 'rest')?.endHour ?? undefined,
    });

    const handleDismissGeofence = () => setShowGeofenceNotification(false);
    const handleDismissExit = () => setShowExitNotification(false);

    const handleGeofenceAction = async () => {
        await onToggleWorkStatus();
        setShowGeofenceNotification(false);
    };

    const handleExitAction = async () => {
        await onToggleWorkStatus();
        setShowExitNotification(false);
    };

    const handleSmartNotificationAction = (id: string) => {
        const notification = smartNotifications.find(n => n.id === id);
        if (notification?.id === 'forgot-clock-in') {
            onToggleWorkStatus();
        }
        setSmartNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleDismissSmartNotification = (id: string) => {
        setSmartNotifications(prev => prev.filter(n => n.id !== id));
    };


    return {
        smartNotifications,
        showGeofenceNotification,
        showExitNotification,
        geofenceDistance,
        handleDismissGeofence,
        handleDismissExit,
        handleGeofenceAction,
        handleExitAction,
        handleSmartNotificationAction,
        handleDismissSmartNotification
    };
};

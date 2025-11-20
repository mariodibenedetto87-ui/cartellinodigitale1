import { useEffect, useRef, useState } from 'react';
import type { WorkLocation } from '../types';
import { 
  calculateDistance,
  getCurrentPosition, 
  shouldNotifyForShift,
  watchPosition,
  clearWatch
} from '../utils/geolocationUtils';

interface UseGeofencingOptions {
  workLocation: WorkLocation | null;
  enabled: boolean;
  onEnterWorkZone?: (distance: number) => void;
  onExitWorkZone?: (distance: number) => void;
  onShiftStartReminder?: (shiftStartHour: number) => void;
  shiftStartHour?: number;
  notifyMinutesBefore?: number;
}

export function useGeofencing({
  workLocation,
  enabled,
  onEnterWorkZone,
  onExitWorkZone,
  onShiftStartReminder,
  shiftStartHour,
  notifyMinutesBefore = 15,
}: UseGeofencingOptions) {
  const [isWithinZone, setIsWithinZone] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastNotificationRef = useRef<Date | null>(null);
  const wasWithinZoneRef = useRef(false);

  useEffect(() => {
    if (!enabled || !workLocation || !('geolocation' in navigator)) {
      console.log('🚫 Geofencing disabled:', { 
        enabled, 
        hasWorkLocation: !!workLocation, 
        hasGeolocation: 'geolocation' in navigator 
      });
      return;
    }

    console.log('🟢 Geofencing attivato!', { 
      workLocation: workLocation.name,
      radius: workLocation.radius + 'm',
      coords: `${workLocation.latitude.toFixed(4)}, ${workLocation.longitude.toFixed(4)}`
    });

    // Check shift start time notification
    const checkShiftReminder = () => {
      if (!shiftStartHour || !onShiftStartReminder) return;

      const now = new Date();
      const shouldNotify = shouldNotifyForShift(now, shiftStartHour, notifyMinutesBefore);
      
      // Only notify once per hour
      const lastNotification = lastNotificationRef.current;
      const hoursSinceLastNotification = lastNotification 
        ? (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60)
        : 999;

      if (shouldNotify && hoursSinceLastNotification > 1 && isWithinZone) {
        onShiftStartReminder(shiftStartHour);
        lastNotificationRef.current = now;
      }
    };

    // Start watching position
    const startWatching = async () => {
      try {
        // Get initial position
        const position = await getCurrentPosition();
        const distance = calculateDistanceFromWork(position);
        
        setCurrentDistance(distance);
        const withinZone = distance <= workLocation.radius;
        setIsWithinZone(withinZone);
        wasWithinZoneRef.current = withinZone;

        // Set up continuous watching
        const watchId = watchPosition(
          (position) => {
            const newDistance = calculateDistanceFromWork(position);
            setCurrentDistance(newDistance);

            const nowWithinZone = newDistance <= workLocation.radius;
            setIsWithinZone(nowWithinZone);

            console.log('📍 Posizione aggiornata:', {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              distance: newDistance.toFixed(0) + 'm',
              radius: workLocation.radius + 'm',
              withinZone: nowWithinZone,
              wasWithinZone: wasWithinZoneRef.current
            });

            // Detect zone transitions
            if (nowWithinZone && !wasWithinZoneRef.current) {
              // Just entered zone
              console.log('🎉 TRANSIZIONE: Entrato nella zona!');
              onEnterWorkZone?.(newDistance);
              checkShiftReminder();
            } else if (!nowWithinZone && wasWithinZoneRef.current) {
              // Just exited zone
              console.log('🚪 TRANSIZIONE: Uscito dalla zona');
              onExitWorkZone?.(newDistance);
            }

            wasWithinZoneRef.current = nowWithinZone;
          },
          (error) => {
            console.error('Geolocation watch error:', error);
          }
        );

        watchIdRef.current = watchId;

        // Check shift reminder periodically
        const reminderInterval = setInterval(checkShiftReminder, 60000); // Every minute

        return () => {
          clearInterval(reminderInterval);
        };
      } catch (error) {
        console.error('Failed to start geofencing:', error);
      }
    };

    const cleanup = startWatching();

    return () => {
      if (watchIdRef.current !== null) {
        clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, [
    enabled,
    workLocation,
    onEnterWorkZone,
    onExitWorkZone,
    onShiftStartReminder,
    shiftStartHour,
    notifyMinutesBefore,
    isWithinZone,
  ]);

  // Helper function to calculate distance
  const calculateDistanceFromWork = (position: GeolocationPosition): number => {
    if (!workLocation) return Infinity;
    
    return calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      workLocation.latitude,
      workLocation.longitude
    );
  };

  return {
    isWithinZone,
    currentDistance,
    isGeofencingActive: enabled && !!workLocation,
  };
}

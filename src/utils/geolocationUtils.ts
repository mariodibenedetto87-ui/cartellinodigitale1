/**
 * Geolocation utilities for work location tracking and geofencing
 */

export interface WorkLocation {
  latitude: number;
  longitude: number;
  radius: number; // meters
  name: string;
}

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  timestamp: Date;
  distance: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if current position is within work location radius
 */
export function isWithinWorkLocation(
  currentLat: number,
  currentLon: number,
  workLocation: WorkLocation
): boolean {
  const distance = calculateDistance(
    currentLat,
    currentLon,
    workLocation.latitude,
    workLocation.longitude
  );
  return distance <= workLocation.radius;
}

/**
 * Request location permission from user
 */
export async function requestLocationPermission(): Promise<PermissionStatus | null> {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation non supportata dal browser');
  }

  // Check if Permissions API is available
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result;
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
    }
  }

  return null;
}

/**
 * Get current device position
 * @param batterySaveMode If true, uses low-accuracy positioning (WiFi/Cell) to save battery
 */
export function getCurrentPosition(batterySaveMode: boolean = true): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation non supportata'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Permesso di geolocalizzazione negato'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Posizione non disponibile'));
            break;
          case error.TIMEOUT:
            reject(new Error('Timeout richiesta posizione'));
            break;
          default:
            reject(new Error('Errore geolocalizzazione'));
        }
      },
      {
        enableHighAccuracy: !batterySaveMode, // ⚡ BATTERY SAVE: WiFi/Cell invece di GPS se enabled
        timeout: batterySaveMode ? 15000 : 10000,
        maximumAge: batterySaveMode ? 120000 : 30000, // 2 min vs 30 sec
      }
    );
  });
}

/**
 * Watch position changes for geofencing
 * @param callback Callback when position updates
 * @param errorCallback Callback on error
 * @param batterySaveMode If true, uses low-accuracy positioning (WiFi/Cell) to save battery
 * @returns Watch ID to clear later
 */
export function watchPosition(
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  batterySaveMode: boolean = true
): number {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation non supportata');
  }

  return navigator.geolocation.watchPosition(
    callback,
    errorCallback,
    {
      enableHighAccuracy: !batterySaveMode, // ⚡ BATTERY SAVE: WiFi/Cell invece di GPS se enabled
      timeout: batterySaveMode ? 20000 : 5000,
      maximumAge: batterySaveMode ? 300000 : 0, // 5 min vs no cache
    }
  );
}

/**
 * Stop watching position
 */
export function clearWatch(watchId: number): void {
  if ('geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check if it's time for shift notification
 */
export function shouldNotifyForShift(
  currentTime: Date,
  shiftStartHour: number,
  notifyMinutesBefore: number = 15
): boolean {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const shiftStartMinutes = shiftStartHour * 60;
  const notifyAtMinutes = shiftStartMinutes - notifyMinutesBefore;
  
  // Check if current time is within the notification window (15 minutes before shift)
  return (
    currentTotalMinutes >= notifyAtMinutes &&
    currentTotalMinutes < shiftStartMinutes + 30 // Grace period after shift start
  );
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// A global array to hold timeout IDs for scheduled notifications
declare global {
    interface Window {
        // FIX: Replaced NodeJS.Timeout with `number` for browser compatibility.
        scheduledNotificationTimeouts: number[];
    }
}
window.scheduledNotificationTimeouts = window.scheduledNotificationTimeouts || [];


import { DayInfo, WorkSettings } from '../types';

/**
 * Requests permission from the user to send notifications.
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted, false otherwise.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    alert('Questo browser non supporta le notifiche desktop.');
    return false;
  }
  
  if (window.Notification.permission === 'granted') {
    return true;
  }
  
  if (window.Notification.permission !== 'denied') {
    const permission = await window.Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

/**
 * Schedules a single browser notification for a future timestamp.
 * @param {string} title - The title of the notification.
 * @param {NotificationOptions} options - The options for the notification (e.g., body, icon).
 * @param {number} timestamp - The future time (in milliseconds) when the notification should be shown.
 */
const scheduleNotification = (title: string, options: NotificationOptions, timestamp: number) => {
  const now = Date.now();
  const delay = timestamp - now;

  // Only schedule if the time is in the future
  if (delay <= 0) {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    // Re-check permission right before showing, in case it was revoked.
    if (window.Notification && window.Notification.permission === 'granted') {
      new window.Notification(title, options);
    }
  }, delay);

  window.scheduledNotificationTimeouts.push(timeoutId);
};

/**
 * Clears all pending notifications that were scheduled with `scheduleNotification`.
 */
export const clearScheduledNotifications = () => {
  if (window.scheduledNotificationTimeouts) {
    window.scheduledNotificationTimeouts.forEach(clearTimeout);
  }
  window.scheduledNotificationTimeouts = [];
};

/**
 * Schedules clock-in and clock-out reminders for the current day based on user settings and shift schedule.
 * @param {DayInfo | undefined} dayInfo - The shift/leave information for today.
 * @param {WorkSettings} workSettings - The user's work settings, including reminder preferences and shifts definition.
 */
export const scheduleReminders = (dayInfo: DayInfo | undefined, workSettings: WorkSettings) => {
  // Clear any previously scheduled notifications to prevent duplicates
  clearScheduledNotifications();
  
  const shiftDetails = dayInfo?.shift ? workSettings.shifts.find(s => s.id === dayInfo.shift) : null;
  // Exit if no shift is planned for today or notifications are not supported/granted
  if (!shiftDetails || shiftDetails.startHour === null || shiftDetails.endHour === null || !window.Notification || window.Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  
  // Schedule Clock-In Reminder
  if (workSettings.enableClockInReminder) {
    const clockInTime = new Date();
    clockInTime.setHours(shiftDetails.startHour, 0, 0, 0); // Set time for start of shift, e.g., 07:00:00
    
    // Check if the clock-in time is in the future today
    if (clockInTime > now) {
      scheduleNotification(
        "È ora di timbrare l'entrata!",
        {
          body: `Il tuo turno '${shiftDetails.name}' inizia alle ${String(shiftDetails.startHour).padStart(2, '0')}:00. Non dimenticare di registrare la tua presenza.`,
          icon: '/vite.svg',
          tag: 'clock-in-reminder' // Tag to prevent multiple notifications if scheduled again
        },
        clockInTime.getTime()
      );
    }
  }
  
  // Schedule Clock-Out Reminder
  if (workSettings.enableClockOutReminder) {
    const clockOutTime = new Date();
    clockOutTime.setHours(shiftDetails.endHour, 0, 0, 0); // Set time for end of shift, e.g., 14:00:00

     // Check if the clock-out time is in the future today
    if (clockOutTime > now) {
      scheduleNotification(
        "È ora di timbrare l'uscita!",
        {
          body: `Il tuo turno '${shiftDetails.name}' finisce alle ${String(shiftDetails.endHour).padStart(2, '0')}:00. Buona giornata!`,
          icon: '/vite.svg',
          tag: 'clock-out-reminder' // Tag to prevent multiple notifications
        },
        clockOutTime.getTime()
      );
    }
  }
};

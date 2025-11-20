/**
 * Push Notifications Utility
 * Gestisce la registrazione, subscription e invio di push notifications
 */

// Configurazione VAPID (da generare e aggiungere alle env vars)
// Genera con: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

/**
 * Verifica se le notifiche push sono supportate
 */
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Verifica lo stato del permesso notifiche
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

/**
 * Richiede il permesso per le notifiche
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notifiche non supportate in questo browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Converte chiave VAPID in formato Uint8Array
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Sottoscrive l'utente alle push notifications
 */
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) {
    throw new Error('Push notifications non supportate');
  }

  if (!VAPID_PUBLIC_KEY) {
    // VAPID key not configured - push notifications from server are disabled
    // Local notifications will still work
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Verifica se esiste già una subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Crea nuova subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    // Salva la subscription (in produzione inviala al backend)
    localStorage.setItem('push-subscription', JSON.stringify(subscription));

    return subscription;
  } catch (error) {
    console.error('Errore sottoscrizione push:', error);
    throw error;
  }
};

/**
 * Annulla la sottoscrizione alle push notifications
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      localStorage.removeItem('push-subscription');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Errore annullamento sottoscrizione:', error);
    return false;
  }
};

/**
 * Verifica se l'utente è sottoscritto
 */
export const isPushSubscribed = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Mostra una notifica locale (non richiede server)
 */
export const showLocalNotification = async (payload: NotificationPayload): Promise<void> => {
  if (!isPushSupported()) {
    throw new Error('Notifiche non supportate');
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Permesso notifiche non concesso. Abilita le notifiche prima.');
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      tag: payload.tag || 'timecard-notification',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data || {},
    } as NotificationOptions);
  } catch (error) {
    console.error('Errore mostrando notifica:', error);
    throw error;
  }
};

/**
 * Programma un reminder per timbratura
 */
export const scheduleClockReminder = async (
  type: 'in' | 'out',
  time: string, // formato "HH:MM"
  enabled: boolean
): Promise<void> => {
  const key = `reminder-${type}`;

  if (!enabled) {
    localStorage.removeItem(key);
    return;
  }

  const reminder = {
    type,
    time,
    enabled: true,
  };

  localStorage.setItem(key, JSON.stringify(reminder));
};

/**
 * Ottiene i reminder configurati
 */
export const getClockReminders = (): { in?: string; out?: string } => {
  const reminderIn = localStorage.getItem('reminder-in');
  const reminderOut = localStorage.getItem('reminder-out');

  return {
    in: reminderIn ? JSON.parse(reminderIn).time : undefined,
    out: reminderOut ? JSON.parse(reminderOut).time : undefined,
  };
};

/**
 * Invia notifica di test
 */
export const sendTestNotification = async (): Promise<void> => {
  await showLocalNotification({
    title: '✅ Notifiche Attive!',
    body: 'Le notifiche push funzionano correttamente. Riceverai promemoria per le timbrature.',
    tag: 'test-notification',
    requireInteraction: false,
  });
};

/**
 * Invia reminder timbratura entrata
 */
export const sendClockInReminder = async (): Promise<void> => {
  await showLocalNotification({
    title: '⏰ Promemoria Entrata',
    body: 'Ricordati di timbrare l\'entrata! Apri l\'app per registrare la presenza.',
    tag: 'clock-in-reminder',
    requireInteraction: true,
    data: { action: 'clock-in' },
  });
};

/**
 * Invia reminder timbratura uscita
 */
export const sendClockOutReminder = async (): Promise<void> => {
  await showLocalNotification({
    title: '⏰ Promemoria Uscita',
    body: 'Ricordati di timbrare l\'uscita! Apri l\'app per completare la giornata.',
    tag: 'clock-out-reminder',
    requireInteraction: true,
    data: { action: 'clock-out' },
  });
};

/**
 * Verifica e invia reminder schedulati (da chiamare periodicamente)
 */
export const checkScheduledReminders = async (): Promise<void> => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const reminders = getClockReminders();
  const lastChecked = localStorage.getItem('last-reminder-check');

  // Previeni invii multipli nello stesso minuto
  if (lastChecked === currentTime) return;
  localStorage.setItem('last-reminder-check', currentTime);

  if (reminders.in === currentTime) {
    await sendClockInReminder();
  }

  if (reminders.out === currentTime) {
    await sendClockOutReminder();
  }
};

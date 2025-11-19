import { useState, useEffect } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
  sendTestNotification,
  scheduleClockReminder,
  getClockReminders,
} from '../utils/pushNotifications';
import { haptic, HapticType } from '../utils/haptics';

interface PushNotificationsSettingsProps {
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export default function PushNotificationsSettings({ onShowToast }: PushNotificationsSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reminderIn, setReminderIn] = useState('');
  const [reminderOut, setReminderOut] = useState('');
  const [reminderInEnabled, setReminderInEnabled] = useState(false);
  const [reminderOutEnabled, setReminderOutEnabled] = useState(false);

  // Carica stato iniziale
  useEffect(() => {
    const checkPushSupport = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const perm = getNotificationPermission();
        setPermission(perm);

        const subscribed = await isPushSubscribed();
        setIsSubscribed(subscribed);

        const reminders = getClockReminders();
        if (reminders.in) {
          setReminderIn(reminders.in);
          setReminderInEnabled(true);
        }
        if (reminders.out) {
          setReminderOut(reminders.out);
          setReminderOutEnabled(true);
        }
      }
    };

    checkPushSupport();
  }, []);

  const handleRequestPermission = async () => {
    haptic(HapticType.LIGHT);
    try {
      setIsLoading(true);
      
      // Check if already granted
      if (permission === 'granted') {
        onShowToast('✅ Le notifiche sono già abilitate!', 'success');
        setIsLoading(false);
        return;
      }

      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        haptic(HapticType.SUCCESS);
        const subscribed = await subscribeToPushNotifications();
        setIsSubscribed(!!subscribed);
        onShowToast('✅ Notifiche abilitate con successo!', 'success');
      } else if (result === 'denied') {
        haptic(HapticType.ERROR);
        onShowToast('⚠️ Permesso notifiche negato. Controlla le impostazioni del browser.', 'error');
      } else {
        onShowToast('⚠️ Richiesta annullata', 'error');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      haptic(HapticType.ERROR);
      onShowToast('❌ Errore nell\'abilitare le notifiche', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubscription = async () => {
    haptic(HapticType.LIGHT);
    try {
      setIsLoading(true);

      if (isSubscribed) {
        // Disabilita
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          haptic(HapticType.WARNING);
          onShowToast('✅ Notifiche disabilitate', 'success');
        }
      } else {
        // Abilita
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setIsSubscribed(true);
          haptic(HapticType.SUCCESS);
          onShowToast('✅ Notifiche abilitate', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      haptic(HapticType.ERROR);
      onShowToast('❌ Errore nel cambiare le impostazioni', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    haptic(HapticType.LIGHT);
    try {
      setIsLoading(true);
      await sendTestNotification();
      haptic(HapticType.SUCCESS);
      onShowToast('📱 Notifica di test inviata!', 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      haptic(HapticType.ERROR);
      onShowToast('❌ Errore nell\'invio della notifica', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReminders = async () => {
    haptic(HapticType.LIGHT);
    try {
      setIsLoading(true);

      if (reminderInEnabled && reminderIn) {
        await scheduleClockReminder('in', reminderIn, true);
      } else {
        await scheduleClockReminder('in', '', false);
      }

      if (reminderOutEnabled && reminderOut) {
        await scheduleClockReminder('out', reminderOut, true);
      } else {
        await scheduleClockReminder('out', '', false);
      }

      haptic(HapticType.SUCCESS);
      onShowToast('✅ Promemoria salvati con successo!', 'success');
    } catch (error) {
      console.error('Error saving reminders:', error);
      haptic(HapticType.ERROR);
      onShowToast('❌ Errore nel salvataggio dei promemoria', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c.866 1.5 2.926 2.625 5.303 2.625s4.437-1.125 5.303-2.625m0 0a3.75 3.75 0 01-7.5 0m7.5 0a3.75 3.75 0 001.035-3.75A3.75 3.75 0 0021 12a3.75 3.75 0 00-3.75-3.75A3.75 3.75 0 0012 2.25a3.75 3.75 0 00-8.25 3.75A3.75 3.75 0 002.25 12" />
          </svg>
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Notifiche non supportate</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Il tuo browser non supporta le push notifications. Per abilitarle, usa Chrome, Firefox, Edge o Safari su iOS 16+.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📱 Notifiche Push</h2>
      <p className="text-sm text-gray-600 dark:text-slate-600 mb-6">
        Abilita le notifiche push per ricevere promemoria sulle timbrature e altre attività importanti.
      </p>

      {/* Permission Status */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-700 dark:text-slate-300 mb-1">Stato Permessi</p>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {permission === 'granted' && '✅ Notifiche abilitate'}
              {permission === 'denied' && '❌ Permesso negato dal browser'}
              {permission === 'default' && '⚠️ Non ancora concesso'}
            </p>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Attendi...
                </span>
              ) : (
                '🔔 Abilita Notifiche'
              )}
            </button>
          )}
        </div>
        {permission === 'denied' && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              💡 <strong>Come abilitare:</strong> Clicca sull'icona del lucchetto nella barra degli indirizzi → Impostazioni sito → Notifiche → Consenti
            </p>
          </div>
        )}
      </div>

      {/* Subscription Toggle */}
      {permission === 'granted' && (
        <>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Sottoscrizione Notifiche</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {isSubscribed ? '✅ Attive' : '⭕ Non attive'}
                </p>
              </div>
              <button
                onClick={handleToggleSubscription}
                disabled={isLoading}
                className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                  isSubscribed
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-400 text-white`}
              >
                {isLoading ? 'Caricamento...' : isSubscribed ? 'Disabilita' : 'Abilita'}
              </button>
            </div>
          </div>

          {/* Test Notification */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Notifica di Test</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Invia una notifica di test per verificare che funzionino
                </p>
              </div>
              <button
                onClick={handleSendTestNotification}
                disabled={isLoading || !isSubscribed}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {isLoading ? 'Invio...' : 'Invia'}
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 pb-2">
              ⏰ Promemoria Timbrature
            </h3>

            {/* Clock In Reminder */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={reminderInEnabled}
                    onChange={(e) => setReminderInEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Promemoria Entrata</span>
                </label>
                {reminderInEnabled && (
                  <input
                    type="time"
                    value={reminderIn}
                    onChange={(e) => setReminderIn(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300"
                  />
                )}
              </div>
            </div>

            {/* Clock Out Reminder */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={reminderOutEnabled}
                    onChange={(e) => setReminderOutEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Promemoria Uscita</span>
                </label>
                {reminderOutEnabled && (
                  <input
                    type="time"
                    value={reminderOut}
                    onChange={(e) => setReminderOut(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300"
                  />
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveReminders}
              disabled={isLoading}
              className="w-full mt-4 px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Salvataggio...' : '💾 Salva Promemoria'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

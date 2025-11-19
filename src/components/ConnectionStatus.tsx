import { useEffect, useState } from 'react';
import { offlineManager, OfflineStatus } from '../utils/offlineManager';

interface ConnectionStatusProps {
  onSyncRequest: () => Promise<void>;
}

export default function ConnectionStatus({ onSyncRequest }: ConnectionStatusProps) {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    syncInProgress: false,
    lastSync: null,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial status load
    offlineManager.getStatus().then(setStatus);

    // Listen for status changes
    const unsubscribe = offlineManager.onStatusChange(setStatus);

    // Listen for online/offline events
    const handleOnline = () => {
      offlineManager.getStatus().then(setStatus);
      // Auto-sync when coming back online
      if (status.pendingCount > 0) {
        handleManualSync();
      }
    };

    const handleOffline = () => {
      offlineManager.getStatus().then(setStatus);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic status check
    const interval = setInterval(() => {
      offlineManager.getStatus().then(setStatus);
    }, 10000); // Check every 10 seconds

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing || !status.isOnline) return;
    
    setIsSyncing(true);
    try {
      await onSyncRequest();
      const newStatus = await offlineManager.getStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (!status.lastSync) return 'Mai';
    const now = Date.now();
    const diff = now - status.lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}g fa`;
    if (hours > 0) return `${hours}h fa`;
    if (minutes > 0) return `${minutes}m fa`;
    return 'Ora';
  };

  // Don't show if online and no pending actions
  if (status.isOnline && status.pendingCount === 0 && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-40 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-all"
        title="Stato connessione"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {status.isOnline ? (
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {status.isOnline ? 'Online' : 'Offline'}
            </span>
            {status.pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                {status.pendingCount}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            {/* Status Details */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-600">
              <div className="flex justify-between">
                <span>Stato:</span>
                <span className={`font-medium ${status.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {status.isOnline ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Azioni in coda:</span>
                <span className="font-medium">{status.pendingCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Ultima sincronizzazione:</span>
                <span className="font-medium">{formatLastSync()}</span>
              </div>
            </div>

            {/* Pending Actions Warning */}
            {status.pendingCount > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    {status.pendingCount === 1
                      ? 'Hai 1 azione non sincronizzata'
                      : `Hai ${status.pendingCount} azioni non sincronizzate`}
                    . {status.isOnline ? 'Premi sincronizza per caricarle.' : 'Si sincronizzeranno quando tornerai online.'}
                  </div>
                </div>
              </div>
            )}

            {/* Sync Button */}
            {status.isOnline && status.pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing || status.syncInProgress}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSyncing || status.syncInProgress ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sincronizzazione...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sincronizza ora</span>
                  </>
                )}
              </button>
            )}

            {/* Offline Info */}
            {!status.isOnline && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Modalità offline attiva. Le tue azioni verranno salvate e sincronizzate automaticamente quando tornerai online.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

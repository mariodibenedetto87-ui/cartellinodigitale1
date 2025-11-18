// Offline Manager - Gestisce sincronizzazione e IndexedDB per operazioni offline

const DB_NAME = 'TimecardOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingActions';

export interface PendingAction {
  id: string;
  type: 'timeEntry' | 'dayInfo' | 'settings' | 'manualOvertime';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineManager {
  private db: IDBDatabase | null = null;
  private syncInProgress = false;
  private listeners: Array<(status: OfflineStatus) => void> = [];

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pendingAction);

      request.onsuccess = () => {
        this.notifyListeners();
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(): Promise<PendingAction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingAction(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async incrementRetries(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const action = getRequest.result as PendingAction;
        if (action) {
          action.retries += 1;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async syncPendingActions(
    syncCallback: (action: PendingAction) => Promise<boolean>
  ): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: 0, failed: 0, message: 'Sincronizzazione già in corso' };
    }

    this.syncInProgress = true;
    const pendingActions = await this.getPendingActions();
    
    if (pendingActions.length === 0) {
      this.syncInProgress = false;
      return { success: 0, failed: 0, message: 'Nessuna azione pendente' };
    }

    let successCount = 0;
    let failedCount = 0;

    // Sort by timestamp to maintain order
    pendingActions.sort((a, b) => a.timestamp - b.timestamp);

    for (const action of pendingActions) {
      try {
        const success = await syncCallback(action);
        if (success) {
          await this.removePendingAction(action.id);
          successCount++;
        } else {
          // Retry logic: remove after 5 failed attempts
          if (action.retries >= 5) {
            await this.removePendingAction(action.id);
            failedCount++;
          } else {
            await this.incrementRetries(action.id);
            failedCount++;
          }
        }
      } catch (error) {
        console.error('Sync error for action:', action.id, error);
        await this.incrementRetries(action.id);
        failedCount++;
      }
    }

    this.syncInProgress = false;
    this.notifyListeners();

    return {
      success: successCount,
      failed: failedCount,
      message: `Sincronizzate ${successCount} azioni, ${failedCount} fallite`,
    };
  }

  async clearAllPendingActions(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  onStatusChange(callback: (status: OfflineStatus) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  async getStatus(): Promise<OfflineStatus> {
    const pendingActions = await this.getPendingActions();
    return {
      isOnline: navigator.onLine,
      pendingCount: pendingActions.length,
      syncInProgress: this.syncInProgress,
      lastSync: this.getLastSyncTime(),
    };
  }

  private getLastSyncTime(): number | null {
    const lastSync = localStorage.getItem('lastSyncTime');
    return lastSync ? parseInt(lastSync, 10) : null;
  }

  updateLastSyncTime(): void {
    localStorage.setItem('lastSyncTime', Date.now().toString());
  }
}

export interface OfflineStatus {
  isOnline: boolean;
  pendingCount: number;
  syncInProgress: boolean;
  lastSync: number | null;
}

export interface SyncResult {
  success: number;
  failed: number;
  message: string;
}

export const offlineManager = new OfflineManager();

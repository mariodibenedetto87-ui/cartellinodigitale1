import { offlineManager, PendingAction } from './offlineManager';
import { supabase } from '../supabaseClient';

export async function syncWithDatabase(): Promise<{ success: number; failed: number; message: string }> {
  const result = await offlineManager.syncPendingActions(async (action: PendingAction) => {
    try {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) return false;

      switch (action.type) {
        case 'timeEntry':
          return await syncTimeEntry(action, userId);
        case 'dayInfo':
          return await syncDayInfo(action, userId);
        case 'settings':
          return await syncSettings(action, userId);
        case 'manualOvertime':
          return await syncManualOvertime(action, userId);
        default:
          console.warn('Unknown action type:', action.type);
          return false;
      }
    } catch (error) {
      console.error('Sync action failed:', error);
      return false;
    }
  });

  if (result.success > 0) {
    offlineManager.updateLastSyncTime();
  }

  return result;
}

async function syncTimeEntry(action: PendingAction, userId: string): Promise<boolean> {
  const { action: actionType, data } = action;

  if (actionType === 'create') {
    const { error } = await supabase.from('time_logs').insert({
      user_id: userId,
      date: data.date,
      entry: {
        id: data.entry.id,
        timestamp: data.entry.timestamp,
        type: data.entry.type,
      },
    });
    return !error;
  }

  if (actionType === 'delete') {
    const { error } = await supabase.from('time_logs').delete().eq('id', data.id).eq('user_id', userId);
    return !error;
  }

  return false;
}

async function syncDayInfo(action: PendingAction, userId: string): Promise<boolean> {
  const { action: actionType, data } = action;

  if (actionType === 'create' || actionType === 'update') {
    const { error } = await supabase.from('day_info').upsert({
      user_id: userId,
      date: data.date,
      info: data.info,
    });
    return !error;
  }

  if (actionType === 'delete') {
    const { error } = await supabase.from('day_info').delete().eq('date', data.date).eq('user_id', userId);
    return !error;
  }

  return false;
}

async function syncSettings(action: PendingAction, userId: string): Promise<boolean> {
  const { data } = action;

  const { error } = await supabase.from('user_settings').update(data).eq('user_id', userId);
  return !error;
}

async function syncManualOvertime(action: PendingAction, userId: string): Promise<boolean> {
  const { action: actionType, data } = action;

  if (actionType === 'create') {
    const { error } = await supabase.from('manual_overtime').insert({
      user_id: userId,
      date: data.date,
      entry: {
        id: data.entry.id,
        durationMs: data.entry.durationMs,
        type: data.entry.type,
        note: data.entry.note,
      },
    });
    return !error;
  }

  if (actionType === 'delete') {
    const { error } = await supabase.from('manual_overtime').delete().eq('id', data.id).eq('user_id', userId);
    return !error;
  }

  return false;
}

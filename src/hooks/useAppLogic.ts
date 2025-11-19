import { useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../contexts/AppContext';
import { formatDateKey } from '../utils/timeUtils';
import { AllDayInfo, LeaveType, ShiftType, ManualOvertimeType, WorkSettings, OfferSettings, ThemeSettings, DashboardLayout, WidgetVisibility, SavedRotation, StatusItem } from '../types';

/**
 * Hook centralizzato per tutta la logica di business dell'app
 * Elimina duplicazione e fornisce accesso uniforme agli handlers
 */
export const useAppLogic = () => {
  const {
    session,
    // allLogs, // Non usato qui, disponibile via Context
    setAllLogs,
    allDayInfo,
    setAllDayInfo,
    // allManualOvertime, // Non usato qui, disponibile via Context
    setAllManualOvertime,
    allMealVouchers,
    setAllMealVouchers,
    setSettings,
    showToast,
  } = useAppContext();

  // --- EDIT ENTRY ---
  const handleEditEntry = useCallback(async (
    dateKey: string,
    entryId: string,
    newTimestamp: Date,
    newType: 'in' | 'out'
  ) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('time_logs')
        .update({ timestamp: newTimestamp.toISOString(), type: newType })
        .eq('id', entryId);

      if (error) throw error;

      // Aggiorna stato locale
      setAllLogs(prev => {
        const newLogs = { ...prev };
        const oldEntries = newLogs[dateKey] || [];
        const updatedEntries = oldEntries.map(entry =>
          entry.id === entryId ? { ...entry, timestamp: newTimestamp, type: newType } : entry
        );

        // Rimuovi da vecchia data se è cambiata
        const newDateKey = formatDateKey(newTimestamp);
        if (newDateKey !== dateKey) {
          newLogs[dateKey] = oldEntries.filter(e => e.id !== entryId);
          if (newLogs[dateKey].length === 0) delete newLogs[dateKey];
          newLogs[newDateKey] = [...(newLogs[newDateKey] || []), { id: entryId, timestamp: newTimestamp, type: newType }];
        } else {
          newLogs[dateKey] = updatedEntries;
        }

        return newLogs;
      });

      showToast('Timbratura modificata con successo');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, setAllLogs, showToast]);

  // --- DELETE ENTRY ---
  const handleDeleteEntry = useCallback(async (dateKey: string, entryId: string) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      // Aggiorna stato locale
      setAllLogs(prev => {
        const newLogs = { ...prev };
        const entries = newLogs[dateKey] || [];
        newLogs[dateKey] = entries.filter(e => e.id !== entryId);
        if (newLogs[dateKey].length === 0) delete newLogs[dateKey];
        return newLogs;
      });

      showToast('Timbratura eliminata');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, setAllLogs, showToast]);

  // --- ADD ENTRY ---
  const handleAddEntry = useCallback(async (newTimestamp: Date, type: 'in' | 'out') => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert([{ user_id: session.user.id, timestamp: newTimestamp.toISOString(), type }])
        .select()
        .single();

      if (error) throw error;

      const dateKey = formatDateKey(newTimestamp);
      setAllLogs(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { id: data.id, timestamp: newTimestamp, type }].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        ),
      }));

      showToast('Timbratura aggiunta con successo');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, setAllLogs, showToast]);

  // --- DELETE MANUAL OVERTIME ---
  const handleDeleteManualOvertime = useCallback(async (dateKey: string, entryId: string) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('manual_overtime')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      setAllManualOvertime(prev => {
        const newOvertime = { ...prev };
        newOvertime[dateKey] = (newOvertime[dateKey] || []).filter(e => e.id !== entryId);
        if (newOvertime[dateKey].length === 0) delete newOvertime[dateKey];
        return newOvertime;
      });

      showToast('Straordinario eliminato');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, setAllManualOvertime, showToast]);

  // --- ADD OVERTIME ---
  const handleAddOvertime = useCallback(async (
    dateKey: string,
    durationMs: number,
    type: ManualOvertimeType,
    note: string
  ) => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('manual_overtime')
        .insert([{ user_id: session.user.id, date: dateKey, entry: { durationMs, type, note } }])
        .select()
        .single();

      if (error) throw error;

      setAllManualOvertime(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { id: data.id, durationMs, type, note }],
      }));

      showToast('Straordinario aggiunto');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, setAllManualOvertime, showToast]);

  // --- SAVE MEAL VOUCHER ---
  const handleSaveMealVoucher = useCallback(async (dateKey: string, earned: boolean, note: string) => {
    if (!session) return;

    try {
      const existingVoucher = allMealVouchers[dateKey];

      if (existingVoucher) {
        // Update
        const { error } = await supabase
          .from('meal_vouchers')
          .update({ earned, note, manual: true })
          .eq('id', existingVoucher.id);

        if (error) throw error;

        setAllMealVouchers(prev => ({
          ...prev,
          [dateKey]: { ...existingVoucher, earned, note, manual: true },
        }));
      } else {
        // Insert
        const { data, error } = await supabase
          .from('meal_vouchers')
          .insert([{ user_id: session.user.id, date: dateKey, earned, note, manual: true }])
          .select()
          .single();

        if (error) throw error;

        setAllMealVouchers(prev => ({
          ...prev,
          [dateKey]: { id: data.id, date: dateKey, earned, note, manual: true },
        }));
      }

      showToast(earned ? 'Buono pasto guadagnato' : 'Buono pasto rimosso');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, allMealVouchers, setAllMealVouchers, showToast]);

  // --- SET ALL DAY INFO ---
  const handleSetAllDayInfo = useCallback(async (newAllDayInfo: AllDayInfo) => {
    if (!session) return;

    setAllDayInfo(newAllDayInfo);

    try {
      // Batch update to database
      const updates = Object.entries(newAllDayInfo).map(([date, info]) => ({
        user_id: session.user.id,
        date,
        info,
      }));

      const { error } = await supabase.from('day_info').upsert(updates);
      if (error) throw error;
    } catch (error: any) {
      showToast(`Errore salvataggio: ${error.message}`, 'error');
    }
  }, [session, setAllDayInfo, showToast]);

  // --- SET DAY INFO FOR RANGE ---
  const handleSetDayInfoForRange = useCallback(async (
    start: string,
    end: string,
    action: { type: 'shift' | 'leave' | 'clear'; value: ShiftType | LeaveType | null }
  ) => {
    if (!session) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const updates: { user_id: string; date: string; info: any }[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);
      const currentInfo = allDayInfo[dateKey] || {};

      let newInfo: any;
      if (action.type === 'clear') {
        newInfo = null;
      } else if (action.type === 'shift') {
        newInfo = { ...currentInfo, shift: action.value };
      } else {
        newInfo = { ...currentInfo, leave: action.value };
      }

      if (newInfo) {
        updates.push({ user_id: session.user.id, date: dateKey, info: newInfo });
      }
    }

    try {
      if (updates.length > 0) {
        const { error } = await supabase.from('day_info').upsert(updates);
        if (error) throw error;
      }

      // Update local state
      setAllDayInfo(prev => {
        const newAllDayInfo = { ...prev };
        updates.forEach(({ date, info }) => {
          if (info) {
            newAllDayInfo[date] = info;
          } else {
            delete newAllDayInfo[date];
          }
        });
        return newAllDayInfo;
      });

      showToast('Pianificazione aggiornata');
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
    }
  }, [session, allDayInfo, setAllDayInfo, showToast]);

  // --- SETTINGS HANDLERS ---
  const handleSaveWorkSettings = useCallback((newSettings: WorkSettings) => {
    setSettings(prev => ({ ...prev, workSettings: newSettings }));
  }, [setSettings]);

  const handleSaveOfferSettings = useCallback((newSettings: OfferSettings) => {
    setSettings(prev => ({ ...prev, offerSettings: newSettings }));
  }, [setSettings]);

  const handleSaveThemeSettings = useCallback((newSettings: ThemeSettings) => {
    setSettings(prev => ({ ...prev, themeSettings: newSettings }));
  }, [setSettings]);

  const handleSaveDashboardLayout = useCallback((newLayout: DashboardLayout) => {
    setSettings(prev => ({ ...prev, dashboardLayout: newLayout }));
  }, [setSettings]);

  const handleSaveWidgetVisibility = useCallback((newVisibility: WidgetVisibility) => {
    setSettings(prev => ({ ...prev, widgetVisibility: newVisibility }));
  }, [setSettings]);

  const handleSaveSavedRotations = useCallback((newRotations: SavedRotation[]) => {
    setSettings(prev => ({ ...prev, savedRotations: newRotations }));
  }, [setSettings]);

  const handleSetStatusItems = useCallback((newItems: StatusItem[]) => {
    setSettings(prev => ({ ...prev, statusItems: newItems }));
  }, [setSettings]);

  return {
    handleEditEntry,
    handleDeleteEntry,
    handleAddEntry,
    handleDeleteManualOvertime,
    handleAddOvertime,
    handleSaveMealVoucher,
    handleSetAllDayInfo,
    handleSetDayInfoForRange,
    handleSaveWorkSettings,
    handleSaveOfferSettings,
    handleSaveThemeSettings,
    handleSaveDashboardLayout,
    handleSaveWidgetVisibility,
    handleSaveSavedRotations,
    handleSetStatusItems,
  };
};

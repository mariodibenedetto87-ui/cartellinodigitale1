

import React, { useState, useRef, useEffect } from 'react';
import { WorkSettings, OfferSettings, DashboardLayout, WidgetVisibility, SavedRotation, StatusItem, AllDayInfo, Shift, ThemeSettings } from '../types';
import { calculateStatusUsage } from '../utils/statusUtils';
import StatusItemModal from './modals/StatusItemModal';
import ShiftModal from './modals/ShiftModal';
import ThemeColorPicker from './ThemeColorPicker';
import DashboardLayoutEditor from './DashboardLayoutEditor';
import PushNotificationsSettings from './PushNotificationsSettings';
import { formatHoursDecimal } from '../utils/timeUtils';

interface SettingsPageProps {
  workSettings: WorkSettings;
  offerSettings: OfferSettings;
  themeSettings: ThemeSettings;
  dashboardLayout: DashboardLayout;
  widgetVisibility: WidgetVisibility;
  savedRotations: SavedRotation[];
  statusItems: StatusItem[];
  allDayInfo: AllDayInfo;
  onSaveWorkSettings: (settings: WorkSettings) => void;
  onSaveOfferSettings: (settings: OfferSettings) => void;
  onSaveThemeSettings: (settings: ThemeSettings) => void;
  onSaveDashboardLayout: (layout: DashboardLayout) => void;
  onSaveWidgetVisibility: (visibility: WidgetVisibility) => void;
  onSaveSavedRotations: (rotations: SavedRotation[]) => void;
  onSetStatusItems: (items: StatusItem[]) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

const DragHandleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
);

const EditIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
);

const DeleteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

const SettingsPage: React.FC<SettingsPageProps> = ({
  workSettings,
  offerSettings,
  themeSettings,
  dashboardLayout,
  widgetVisibility,
  savedRotations,
  statusItems,
  allDayInfo,
  onSaveWorkSettings,
  onSaveOfferSettings,
  onSaveThemeSettings,
  onSaveDashboardLayout,
  onSaveWidgetVisibility,
  onSaveSavedRotations,
  onSetStatusItems,
  onShowToast,
}) => {
  const [localWorkSettings, setLocalWorkSettings] = useState(workSettings);
  const [localOfferSettings, setLocalOfferSettings] = useState(offerSettings);
  const [localDashboardLayout, setLocalDashboardLayout] = useState(dashboardLayout);
  const [localWidgetVisibility, setLocalWidgetVisibility] = useState(widgetVisibility);

  // State for Status Item management
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatusItem, setEditingStatusItem] = useState<Partial<StatusItem> | null>(null);

  // State for Shift management
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Partial<Shift> | null>(null);

  // State for Dashboard Layout Editor
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);


  const importRotationInputRef = useRef<HTMLInputElement>(null);
  const draggedItem = useRef<{ id: string; column: 'main' | 'sidebar'; index: number } | null>(null);
  const dragOverItem = useRef<{ column: 'main' | 'sidebar'; index: number } | null>(null);
  
  const currentYear = new Date().getFullYear();
  const usageData = React.useMemo(() => calculateStatusUsage(allDayInfo, currentYear, statusItems), [allDayInfo, currentYear, statusItems]);


  // Sync local state with props when they change to reflect saved data
  useEffect(() => { setLocalWorkSettings(workSettings); }, [workSettings]);
  useEffect(() => { setLocalOfferSettings(offerSettings); }, [offerSettings]);
  useEffect(() => { setLocalDashboardLayout(dashboardLayout); }, [dashboardLayout]);
  useEffect(() => { setLocalWidgetVisibility(widgetVisibility); }, [widgetVisibility]);

  const handleWorkSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isChecked = (e.target as HTMLInputElement).checked;
    
    setLocalWorkSettings(prev => ({
      ...prev,
      [name]: isCheckbox ? isChecked : parseFloat(value) || value,
    }));
  };
  
  const handleOfferSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setLocalOfferSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveWorkSettings = () => {
      onSaveWorkSettings(localWorkSettings);
      onShowToast("Impostazioni orario di lavoro salvate!");
  };

  const handleSaveOfferSettings = () => {
      onSaveOfferSettings(localOfferSettings);
      onShowToast("Offerta speciale salvata!");
  };

  const handleWidgetVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setLocalWidgetVisibility(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSaveDashboardSettings = () => {
    onSaveDashboardLayout(localDashboardLayout);
    onSaveWidgetVisibility(localWidgetVisibility);
    onShowToast("Impostazioni dashboard salvate!");
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string, column: 'main' | 'sidebar', index: number) => {
    draggedItem.current = { id, column, index };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget as any); // for Firefox
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, column: 'main' | 'sidebar', index: number) => {
      e.preventDefault();
      dragOverItem.current = { column, index };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggedItem.current || !dragOverItem.current || draggedItem.current.column !== dragOverItem.current.column) {
          return; // Prevent dropping across columns
      }

      const { column } = draggedItem.current;
      const newLayout = { ...localDashboardLayout };
      const items = [...newLayout[column]];
      
      const dragged = items.splice(draggedItem.current.index, 1)[0];
      items.splice(dragOverItem.current.index, 0, dragged);
      
      newLayout[column] = items;
      setLocalDashboardLayout(newLayout);

      draggedItem.current = null;
      dragOverItem.current = null;
  };
  
  const handleExportRotations = () => {
    const shiftsToExport = workSettings.shifts;
    const exportData = {
        rotations: savedRotations,
        shifts: shiftsToExport
    }
    if (savedRotations.length === 0) {
        onShowToast("Nessuna rotazione da esportare.", 'error');
        return;
    }
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "timecard-pro-rotations.json";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportRotationsClick = () => {
    importRotationInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target?.result as string);
            // Basic validation
            if (imported.rotations && Array.isArray(imported.rotations) && imported.rotations.every((item: any) => 'id' in item && 'name' in item && 'pattern' in item)) {
                onSaveSavedRotations(imported.rotations);
                if(imported.shifts && Array.isArray(imported.shifts)){
                    onSaveWorkSettings({...workSettings, shifts: imported.shifts})
                }
                onShowToast("Rotazioni importate con successo!");
            } else {
                throw new Error("Formato del file non valido");
            }
        } catch (error) {
            onShowToast("Errore: Il file non è un file di rotazioni valido.", 'error');
        } finally {
            if (importRotationInputRef.current) {
                importRotationInputRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  };

  const handleDeleteRotation = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questa rotazione?")) {
        const updatedRotations = savedRotations.filter(r => r.id !== id);
        onSaveSavedRotations(updatedRotations);
        onShowToast("Rotazione eliminata.", 'error');
    }
  };
  
    const handleAddNewStatus = () => {
      setEditingStatusItem({});
      setIsStatusModalOpen(true);
  };

  const handleEditStatus = (item: StatusItem) => {
      setEditingStatusItem(item);
      setIsStatusModalOpen(true);
  };
  
  const handleDeleteStatus = (codeToDelete: number) => {
      if (window.confirm("Sei sicuro di voler eliminare questo status? L'azione è irreversibile.")) {
          const updatedItems = statusItems.filter(item => item.code !== codeToDelete);
          onSetStatusItems(updatedItems);
          onShowToast("Status eliminato.", 'error');
      }
  };

  const handleSaveStatus = (itemToSave: StatusItem) => {
    let updatedItems;

    if(editingStatusItem && 'code' in editingStatusItem) { // This is a true edit
        updatedItems = statusItems.map(item => item.code === editingStatusItem.code ? itemToSave : item);
    } else { // This is a new item
        if (statusItems.some(item => item.code === itemToSave.code)) {
            onShowToast(`Il codice ${itemToSave.code} è già in uso.`, 'error');
            return;
        }
        updatedItems = [...statusItems, itemToSave];
    }
    
    onSetStatusItems(updatedItems.sort((a,b) => a.code - b.code));
    onShowToast(`Status ${ 'code' in editingStatusItem! ? 'aggiornato' : 'aggiunto'} con successo.`);
    setIsStatusModalOpen(false);
    setEditingStatusItem(null);
  };

  // Shift Management Handlers
  const handleAddNewShift = () => {
    setEditingShift({});
    setIsShiftModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
      setEditingShift(shift);
      setIsShiftModalOpen(true);
  };

  const handleDeleteShift = (shiftId: string) => {
      if (window.confirm("Sei sicuro di voler eliminare questo turno? L'azione è irreversibile.")) {
          const updatedShifts = localWorkSettings.shifts.filter(s => s.id !== shiftId);
          const newWorkSettings = { ...localWorkSettings, shifts: updatedShifts };
          setLocalWorkSettings(newWorkSettings);
          onSaveWorkSettings(newWorkSettings);
          onShowToast("Turno eliminato.", 'error');
      }
  };

  const handleSaveShift = (shiftToSave: Shift) => {
      const isEditing = localWorkSettings.shifts.some(s => s.id === shiftToSave.id);
      let updatedShifts;

      if (isEditing) {
          updatedShifts = localWorkSettings.shifts.map(s => s.id === shiftToSave.id ? shiftToSave : s);
      } else {
          updatedShifts = [...localWorkSettings.shifts, shiftToSave];
      }
      
      const newWorkSettings = { ...localWorkSettings, shifts: updatedShifts };
      setLocalWorkSettings(newWorkSettings);
      onSaveWorkSettings(newWorkSettings);
      
      onShowToast(`Turno ${isEditing ? 'aggiornato' : 'aggiunto'} con successo.`);
      setIsShiftModalOpen(false);
      setEditingShift(null);
  };


  const widgetNames: Record<string, string> = {
    nfcScanner: 'Controllo Presenze',
    summary: 'Riepilogo del Giorno',
    offerCard: 'Offerta Speciale',
    balancesSummary: 'Saldi Principali',
    monthlySummary: 'Riepilogo Mensile',
    weeklySummary: 'Riepilogo Settimanale',
    weeklyHoursChart: 'Grafico Ore Settimanali',
    plannerCard: 'Pianificazione Rapida',
  };

  const renderWidgetList = (column: 'main' | 'sidebar') => {
    return localDashboardLayout[column].map((widgetId, index) => (
        <div 
            key={widgetId}
            draggable
            onDragStart={(e) => handleDragStart(e, widgetId, column, index)}
            onDragOver={(e) => handleDragOver(e, column, index)}
            onDrop={handleDrop}
            className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-shadow"
        >
            <div className="flex items-center gap-3">
                <DragHandleIcon className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                <span className="font-medium text-slate-800 dark:text-white">{widgetNames[widgetId]}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    name={widgetId}
                    checked={localWidgetVisibility[widgetId] ?? false}
                    onChange={handleWidgetVisibilityChange}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
        </div>
    ));
  };


  return (
    <main className="container mx-auto px-4 py-8 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Theme Color Picker */}
        <ThemeColorPicker
          currentTheme={themeSettings}
          onSave={onSaveThemeSettings}
        />
        
        {/* Dashboard Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestione Widget Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Attiva o disattiva i widget e riordinali trascinandoli per personalizzare la tua dashboard.
                    </p>
                </div>
                <button
                    onClick={() => setIsLayoutEditorOpen(true)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold transition-all shadow-md flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                    </svg>
                    Personalizza Layout
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">Colonna Principale</h3>
                    <div className="space-y-2" onDrop={handleDrop}>
                        {renderWidgetList('main')}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">Barra Laterale</h3>
                    <div className="space-y-2" onDrop={handleDrop}>
                        {renderWidgetList('sidebar')}
                    </div>
                </div>
            </div>
            <div className="mt-6 text-right">
                <button onClick={handleSaveDashboardSettings} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva Dashboard</button>
            </div>
        </div>

        {/* Balances Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestione Saldi e Contatori</h2>
                <button onClick={handleAddNewStatus} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Aggiungi Status
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-slate-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Codice</th>
                            <th scope="col" className="px-6 py-3">Descrizione</th>
                            <th scope="col" className="px-6 py-3 text-center">Previsto</th>
                            <th scope="col" className="px-6 py-3 text-center">Usato</th>
                            <th scope="col" className="px-6 py-3 text-center">Saldo</th>
                            <th scope="col" className="px-6 py-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statusItems.map((item) => {
                            const used = usageData[item.code] || 0;
                            const balance = item.entitlement - used;
                            const isHourly = item.category === 'leave-hours';
                            const unit = ' gg';

                            const entitlementDisplay = isHourly ? formatHoursDecimal(item.entitlement) : item.entitlement;
                            const usedDisplay = isHourly ? formatHoursDecimal(used) : used;
                            const balanceDisplay = isHourly ? formatHoursDecimal(balance) : balance;
                            
                            return (
                                <tr key={item.code} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.code}</td>
                                    <td className="px-6 py-4">{item.description}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-200">{entitlementDisplay}{!isHourly && unit}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">{usedDisplay}{!isHourly && unit}</td>
                                    <td className={`px-6 py-4 text-center font-bold ${balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{balanceDisplay}{!isHourly && unit}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center space-x-2">
                                            <button onClick={() => handleEditStatus(item)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="Modifica">
                                                <EditIcon className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                                            </button>
                                            <button onClick={() => handleDeleteStatus(item.code)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Elimina">
                                                <DeleteIcon className="h-4 w-4 text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* Work & Shift Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Impostazioni Orario di Lavoro e Turni</h2>
            
            {/* Shift Management */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Gestione Turni</h3>
                    <button onClick={handleAddNewShift} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Aggiungi Turno
                    </button>
                </div>
                <div className="space-y-2">
                    {localWorkSettings.shifts.filter(s => s.id !== 'rest').map(shift => (
                        <div key={shift.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${shift.bgColor}`}></div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{shift.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{shift.startHour}:00 - {shift.endHour}:00</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleEditShift(shift)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="Modifica Turno"><EditIcon className="h-4 w-4 text-gray-600 dark:text-slate-300" /></button>
                                <button onClick={() => handleDeleteShift(shift.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Elimina Turno"><DeleteIcon className="h-4 w-4 text-red-500" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* General Work Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <div>
                    <label htmlFor="standardDayHours" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Ore Giornaliere Standard</label>
                    <input type="number" name="standardDayHours" value={localWorkSettings.standardDayHours} onChange={handleWorkSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
                 <div>
                    <label htmlFor="treatHolidayAsOvertime" className="flex items-center cursor-pointer mt-1 md:mt-7">
                        <input type="checkbox" name="treatHolidayAsOvertime" checked={localWorkSettings.treatHolidayAsOvertime} onChange={handleWorkSettingsChange} className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500" />
                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-slate-300">Considera Festivi come Straordinario</span>
                    </label>
                </div>
                <div>
                    <label htmlFor="nightTimeStartHour" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Inizio Orario Notturno</label>
                    <input type="number" name="nightTimeStartHour" value={localWorkSettings.nightTimeStartHour} onChange={handleWorkSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" min="0" max="23" />
                </div>
                 <div>
                    <label htmlFor="nightTimeEndHour" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Fine Orario Notturno</label>
                    <input type="number" name="nightTimeEndHour" value={localWorkSettings.nightTimeEndHour} onChange={handleWorkSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" min="0" max="23" />
                </div>
                
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white">Pausa Automatica</h3>
                    <div>
                        <label htmlFor="deductAutoBreak" className="flex items-center cursor-pointer">
                            <input type="checkbox" name="deductAutoBreak" checked={localWorkSettings.deductAutoBreak} onChange={handleWorkSettingsChange} className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500" />
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-slate-300">Deduci pausa pranzo automaticamente</span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-8">Sottrae la pausa dalle ore standard quando il totale giornaliero supera una soglia.</p>
                    </div>
                    {localWorkSettings.deductAutoBreak && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                             <div>
                                <label htmlFor="autoBreakThresholdHours" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Attiva dopo (ore)</label>
                                <input type="number" name="autoBreakThresholdHours" value={localWorkSettings.autoBreakThresholdHours} onChange={handleWorkSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="autoBreakMinutes" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Durata Pausa (minuti)</label>
                                <input type="number" name="autoBreakMinutes" value={localWorkSettings.autoBreakMinutes} onChange={handleWorkSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                            </div>
                         </div>
                    )}
                </div>

                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white">Promemoria Notifiche</h3>
                    <div>
                        <label htmlFor="enableClockInReminder" className="flex items-center cursor-pointer">
                            <input type="checkbox" name="enableClockInReminder" checked={localWorkSettings.enableClockInReminder} onChange={handleWorkSettingsChange} className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500" />
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-slate-300">Abilita promemoria timbratura in entrata</span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-8">Ricevi una notifica all'orario di inizio del tuo turno.</p>
                    </div>
                     <div>
                        <label htmlFor="enableClockOutReminder" className="flex items-center cursor-pointer">
                            <input type="checkbox" name="enableClockOutReminder" checked={localWorkSettings.enableClockOutReminder} onChange={handleWorkSettingsChange} className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500" />
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-slate-300">Abilita promemoria timbratura in uscita</span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-8">Ricevi una notifica all'orario di fine del tuo turno.</p>
                    </div>
                </div>
            </div>
            <div className="mt-6 text-right">
                <button onClick={handleSaveWorkSettings} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Modifica Impostazioni</button>
            </div>
        </div>


        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Offerta Speciale</h2>
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Titolo Offerta</label>
                    <input type="text" name="title" id="title" value={localOfferSettings.title} onChange={handleOfferSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Descrizione Offerta</label>
                    <input type="text" name="description" id="description" value={localOfferSettings.description} onChange={handleOfferSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300">URL Immagine</label>
                    <input type="text" name="imageUrl" id="imageUrl" value={localOfferSettings.imageUrl} onChange={handleOfferSettingsChange} className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
            </div>
            <div className="mt-6 text-right">
                <button onClick={handleSaveOfferSettings} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva Offerta</button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Gestione Rotazioni Turni</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                Salva, esporta o importa i tuoi pattern di rotazione per una pianificazione più rapida. I pattern possono essere creati nel Pianificatore Turni.
            </p>
            <input type="file" ref={importRotationInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
            <div className="flex flex-wrap gap-4 mb-6">
                <button onClick={handleImportRotationsClick} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">Importa Rotazioni</button>
                <button onClick={handleExportRotations} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">Esporta Rotazioni</button>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">Rotazioni Salvate</h3>
                {savedRotations.length > 0 ? (
                    <ul className="space-y-3">
                        {savedRotations.map(rotation => (
                            <li key={rotation.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{rotation.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {rotation.pattern.map((shiftId, index) => {
                                            const shift = workSettings.shifts.find(s => s.id === shiftId);
                                            if (!shift) return null;
                                            return (
                                                <span key={index} className={`px-2 py-0.5 text-xs font-bold rounded-full ${shift.bgColor} ${shift.textColor}`}>
                                                    {shift.name.charAt(0)}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteRotation(rotation.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Elimina rotazione">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400">Nessuna rotazione salvata. Creane una dal Pianificatore Turni nel Calendario.</p>
                )}
            </div>
        </div>

        {/* Push Notifications Section */}
        <PushNotificationsSettings onShowToast={onShowToast} />

        {isStatusModalOpen && (
            <StatusItemModal 
                item={editingStatusItem}
                onClose={() => setIsStatusModalOpen(false)}
                onSave={handleSaveStatus}
            />
        )}
        {isShiftModalOpen && (
            <ShiftModal
                shift={editingShift}
                onClose={() => setIsShiftModalOpen(false)}
                onSave={handleSaveShift}
            />
        )}
        {isLayoutEditorOpen && (
            <DashboardLayoutEditor
                currentLayout={localDashboardLayout}
                widgetVisibility={localWidgetVisibility}
                onLayoutChange={(newLayout) => {
                    setLocalDashboardLayout(newLayout);
                    onSaveDashboardLayout(newLayout);
                }}
                onVisibilityChange={(widgetId, visible) => {
                    const newVisibility = { ...localWidgetVisibility, [widgetId]: visible };
                    setLocalWidgetVisibility(newVisibility);
                    onSaveWidgetVisibility(newVisibility);
                }}
                onClose={() => setIsLayoutEditorOpen(false)}
            />
        )}
      </div>
    </main>
  );
};

export default SettingsPage;

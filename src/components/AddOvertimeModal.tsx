import React, { useState } from 'react';
import { StatusItem, AllTimeLogs, AllManualOvertime } from '../types';
import { formatDateKey } from '../utils/timeUtils';

interface AddOvertimeModalProps {
  date: Date;
  allLogs: AllTimeLogs;
  allManualOvertime: AllManualOvertime;
  statusItems: StatusItem[];
  onClose: () => void;
  onSave: (dateKey: string, durationMs: number, type: string, note: string) => void;
  onDelete: (dateKey: string, entryId: string) => void;
}

const AddOvertimeModal: React.FC<AddOvertimeModalProps> = ({ date, allLogs, allManualOvertime, statusItems, onClose, onSave, onDelete }) => {
  const [overtimeHours, setOvertimeHours] = useState('');
  const [selectedOvertimeType, setSelectedOvertimeType] = useState<StatusItem | null>(null);
  const [overtimeNote, setOvertimeNote] = useState('');
  const [selectedLogIndices, setSelectedLogIndices] = useState<number[]>([]);

  const dateKey = formatDateKey(date);
  const dayLogs = allLogs[dateKey] || [];
  const dayOvertimes = allManualOvertime[dateKey] || [];
  const overtimeItems = statusItems.filter(item => item.category === 'overtime');

  // Calcola ore lavorate
  const calculateWorkedHours = () => {
    let totalMs = 0;
    const sortedLogs = [...dayLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (let i = 0; i < sortedLogs.length - 1; i += 2) {
      if (sortedLogs[i].type === 'in' && sortedLogs[i + 1]?.type === 'out') {
        const inTime = new Date(sortedLogs[i].timestamp).getTime();
        const outTime = new Date(sortedLogs[i + 1].timestamp).getTime();
        totalMs += outTime - inTime;
      }
    }
    return totalMs / (1000 * 60 * 60);
  };

  // Calcola ore dalle timbrature selezionate
  const calculateSelectedHours = () => {
    if (selectedLogIndices.length < 2) return 0;
    
    const sortedLogs = [...dayLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const selectedLogs = selectedLogIndices.map(idx => sortedLogs[idx]).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const firstIn = selectedLogs.find(log => log.type === 'in');
    const lastOut = [...selectedLogs].reverse().find(log => log.type === 'out');
    
    if (firstIn && lastOut) {
      const inTime = new Date(firstIn.timestamp).getTime();
      const outTime = new Date(lastOut.timestamp).getTime();
      const totalMs = outTime - inTime;
      return totalMs / (1000 * 60 * 60);
    }
    
    return 0;
  };

  const workedHours = calculateWorkedHours();

  const handleToggleLogSelection = (index: number) => {
    setSelectedLogIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const handleSave = () => {
    if (!selectedOvertimeType) {
      alert("Seleziona un tipo di straordinario");
      return;
    }

    const hours = parseFloat(overtimeHours.replace(',', '.'));
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      alert("Inserisci un numero di ore valido (0-24)");
      return;
    }

    const durationMs = hours * 60 * 60 * 1000;
    onSave(dateKey, durationMs, selectedOvertimeType.description, overtimeNote);
    
    // Reset form
    setSelectedOvertimeType(null);
    setOvertimeHours('');
    setOvertimeNote('');
    setSelectedLogIndices([]);
    onClose();
  };

  const handleDelete = (entryId: string) => {
    if (confirm('🗑️ Eliminare questo straordinario?')) {
      onDelete(dateKey, entryId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 py-4 rounded-t-3xl shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-white drop-shadow-lg">⚡ Gestione Straordinari</h2>
              <p className="text-sm text-white/90 font-semibold mt-1">
                {date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl leading-none transition-all transform hover:scale-110 active:scale-95"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Info ore lavorate */}
          {workedHours > 0 && (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-orange-700 dark:text-orange-300">⏱️ Ore lavorate oggi:</span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{workedHours.toFixed(1)}h</span>
              </div>
            </div>
          )}

          {/* Lista straordinari esistenti */}
          {dayOvertimes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-3">📋 Straordinari Registrati</h3>
              <div className="space-y-2">
                {dayOvertimes.map(overtime => (
                  <div key={overtime.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-orange-800 dark:text-orange-200">{overtime.type}</div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center space-x-2">
                        <span>⏱️ {(overtime.durationMs / (1000 * 60 * 60)).toFixed(1)}h</span>
                        {overtime.note && <span>• {overtime.note}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(overtime.id)}
                      className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form aggiunta straordinario */}
          <div className="border-t-2 border-dashed border-orange-200 dark:border-orange-700 pt-6">
            <h3 className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-4">➕ Aggiungi Nuovo Straordinario</h3>
            
            {/* Selezione Timbrature */}
            {dayLogs.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-2">
                  🕐 Seleziona Timbrature (calcolo automatico ore)
                </div>
                <div className="grid grid-cols-1 gap-2 mb-3">
                  {[...dayLogs]
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((log, index) => {
                      const isSelected = selectedLogIndices.includes(index);
                      const time = new Date(log.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <button
                          key={`${log.timestamp}-${index}`}
                          onClick={() => handleToggleLogSelection(index)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'bg-orange-500 border-orange-600 text-white shadow-lg scale-105'
                              : 'bg-white dark:bg-slate-700 border-orange-200 dark:border-orange-700 text-gray-700 dark:text-gray-300 hover:border-orange-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold">
                                {log.type === 'in' ? '🟢 ENTRATA' : '🔴 USCITA'}
                              </span>
                              <span className="ml-2 text-sm">{time}</span>
                            </div>
                            {isSelected && <span className="text-xl">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                </div>
                
                {/* Ore calcolate */}
                {selectedLogIndices.length >= 2 && (() => {
                  const calculatedHours = calculateSelectedHours();
                  return calculatedHours > 0 ? (
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-600 rounded-lg mb-3">
                      <div className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        ⏱️ Ore calcolate: <span className="text-lg font-black">{calculatedHours.toFixed(2)}h</span>
                      </div>
                      <button
                        onClick={() => setOvertimeHours(calculatedHours.toFixed(2))}
                        className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        ✨ Usa queste ore
                      </button>
                    </div>
                  ) : null;
                })()}
                
                <div className="border-t-2 border-orange-200 dark:border-orange-700 my-3"></div>
              </div>
            )}

            {/* Tipo Straordinario */}
            <div className="mb-4">
              <label className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-2 block">📋 Tipo Straordinario</label>
              <div className="grid grid-cols-1 gap-2">
                {overtimeItems.map(item => (
                  <button
                    key={item.code}
                    onClick={() => setSelectedOvertimeType(item)}
                    title={item.description}
                    className={`p-3 rounded-lg text-sm font-bold transition-all text-left ${
                      selectedOvertimeType?.code === item.code
                        ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-400'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200'
                    }`}
                  >
                    {item.description}
                  </button>
                ))}
              </div>
            </div>

            {/* Input ore */}
            <div className="mb-4">
              <label className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-2 block">⏱️ Ore Straordinario</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const val = parseFloat(overtimeHours.replace(',', '.')) || 0;
                    setOvertimeHours(Math.max(0, val - 0.5).toString());
                  }}
                  className="w-12 h-12 bg-orange-200 dark:bg-orange-800 hover:bg-orange-300 rounded-lg font-bold text-xl"
                >
                  −
                </button>
                <input
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  placeholder="0.0"
                  step="0.5"
                  min="0"
                  max="24"
                  className="flex-1 text-center text-2xl font-black bg-white dark:bg-slate-700 border-2 border-orange-300 dark:border-orange-600 rounded-lg px-3 py-3 text-orange-700 dark:text-orange-300"
                />
                <button
                  onClick={() => {
                    const val = parseFloat(overtimeHours.replace(',', '.')) || 0;
                    setOvertimeHours(Math.min(24, val + 0.5).toString());
                  }}
                  className="w-12 h-12 bg-orange-200 dark:bg-orange-800 hover:bg-orange-300 rounded-lg font-bold text-xl"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex justify-center gap-2">
                {[0.5, 1, 2, 3, 4, 8].map(hours => (
                  <button
                    key={hours}
                    onClick={() => setOvertimeHours(hours.toString())}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200"
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Nota */}
            <div className="mb-4">
              <label className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-2 block">📝 Nota (opzionale)</label>
              <textarea
                value={overtimeNote}
                onChange={(e) => setOvertimeNote(e.target.value)}
                placeholder="es. Seggio elettorale, servizio notturno..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-orange-300 dark:border-orange-600 rounded-lg text-sm text-orange-700 dark:text-orange-300"
              />
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 font-bold text-gray-700 dark:text-white transition-colors"
            >
              ✕ Chiudi
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedOvertimeType || !overtimeHours}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              ✓ Salva Straordinario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOvertimeModal;


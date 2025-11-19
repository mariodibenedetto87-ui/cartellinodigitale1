import React, { useState, useMemo } from 'react';
import { StatusItem, AllTimeLogs, AllManualOvertime } from '../types';
import { formatDateKey } from '../utils/timeUtils';

interface AbsenceJustificationModalProps {
  date: Date;
  allLogs: AllTimeLogs;
  allManualOvertime: AllManualOvertime;
  statusItems: StatusItem[];
  onClose: () => void;
  onSave: (dateKey: string, durationMs: number, type: string, note: string, usedEntryIds?: string[]) => void;
  onDelete: (dateKey: string, entryId: string) => void;
}

const AbsenceJustificationModal: React.FC<AbsenceJustificationModalProps> = ({ 
  date, 
  allLogs, 
  allManualOvertime,
  statusItems,
  onClose, 
  onSave, 
  onDelete 
}) => {
  const dateKey = formatDateKey(date);
  const dayLogs = allLogs[dateKey] || [];
  const dayJustifications = allManualOvertime[dateKey] || [];
  
  // Filtra permessi/assenze GPO + corsi ACC (RECUPERO ORE, CORSO AGGIORNAMENTO)
  const filteredItems = statusItems.filter(item => 
    item.category === 'leave-hours' && (item.class === 'GPO' || item.class === 'ACC')
  );

  const [hours, setHours] = useState('');
  const [selectedType, setSelectedType] = useState<StatusItem | null>(null);
  const [note, setNote] = useState('');
  const [selectedLogIndices, setSelectedLogIndices] = useState<number[]>([]);

  // Auto-seleziona timbrature mancanti all'apertura del modal
  React.useEffect(() => {
    if (dayLogs.length >= 2 && selectedLogIndices.length === 0) {
      // Ordina le timbrature per timestamp
      const sortedLogsWithIndices = dayLogs
        .map((log, index) => ({ log, index }))
        .sort((a, b) => new Date(a.log.timestamp).getTime() - new Date(b.log.timestamp).getTime());
      
      // Trova l'ultima USCITA (usando reverse + find invece di findLastIndex)
      let lastOutIndex = -1;
      for (let i = sortedLogsWithIndices.length - 1; i >= 0; i--) {
        if (sortedLogsWithIndices[i].log.type === 'out') {
          lastOutIndex = i;
          break;
        }
      }
      
      if (lastOutIndex !== -1) {
        // Seleziona automaticamente tutte le timbrature successive all'ultima uscita
        // per coprire il resto del turno
        const indicesAfterLastOut = sortedLogsWithIndices
          .slice(lastOutIndex + 1)
          .map(item => item.index);
        
        if (indicesAfterLastOut.length > 0) {
          setSelectedLogIndices(indicesAfterLastOut);
        }
      }
    }
  }, [dayLogs]);

  // Calcola ore lavorate dal log
  const calculateWorkedHours = useMemo(() => {
    if (dayLogs.length < 2) return 0;
    const sortedLogs = [...dayLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    let totalMs = 0;
    for (let i = 0; i < sortedLogs.length - 1; i += 2) {
      if (sortedLogs[i]?.type === 'in' && sortedLogs[i+1]?.type === 'out') {
        const start = new Date(sortedLogs[i].timestamp).getTime();
        const end = new Date(sortedLogs[i+1].timestamp).getTime();
        totalMs += end - start;
      }
    }
    return totalMs / (1000 * 60 * 60);
  }, [dayLogs]);

  // Calcola ore dai log selezionati
  const calculateSelectedHours = useMemo(() => {
    if (selectedLogIndices.length === 0) return 0;
    
    const sortedIndices = [...selectedLogIndices].sort((a, b) => a - b);
    let totalMs = 0;
    
    for (let i = 0; i < sortedIndices.length - 1; i++) {
      const currentIdx = sortedIndices[i];
      const nextIdx = sortedIndices[i + 1];
      
      if (dayLogs[currentIdx]?.type === 'in' && dayLogs[nextIdx]?.type === 'out') {
        const start = new Date(dayLogs[currentIdx].timestamp).getTime();
        const end = new Date(dayLogs[nextIdx].timestamp).getTime();
        totalMs += end - start;
      }
    }
    
    return totalMs / (1000 * 60 * 60);
  }, [selectedLogIndices, dayLogs]);

  const handleToggleLogSelection = (index: number) => {
    setSelectedLogIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const handleUseSelectedHours = () => {
    const calculated = calculateSelectedHours;
    if (calculated > 0) {
      setHours(calculated.toFixed(2));
    }
  };

  const handleSave = () => {
    if (!selectedType) {
      alert("Seleziona un tipo di assenza/permesso");
      return;
    }

    const hrs = parseFloat(hours.replace(',', '.'));
    if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
      alert("Inserisci un numero di ore valido (0-24)");
      return;
    }

    const durationMs = hrs * 60 * 60 * 1000;
    const saveType = `code-${selectedType.code}`;
    
    // Ottieni gli ID delle timbrature selezionate
    const usedEntryIds = selectedLogIndices.length > 0 
      ? selectedLogIndices.map(i => dayLogs[i]?.id).filter(Boolean) as string[]
      : undefined;
    
    onSave(dateKey, durationMs, saveType, note || selectedType.description, usedEntryIds);
    
    // Reset form
    setHours('');
    setSelectedType(null);
    setNote('');
    setSelectedLogIndices([]);
    onClose();
  };

  const handleDelete = (entryId: string) => {
    if (confirm('🗑️ Eliminare questa giustificazione?')) {
      onDelete(dateKey, entryId);
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
              <span className="text-2xl">🏥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Giustifica Ore Mancanti</h2>
              <p className="text-sm text-cyan-100">Permessi, Malattia, Assenze</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 mt-3">
            <p className="text-xs text-cyan-100 mb-1">Data</p>
            <p className="text-sm font-semibold text-white capitalize">{formatDate(date)}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Ore Lavorate */}
          {dayLogs.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <span className="text-gray-300 font-medium">Ore lavorate oggi:</span>
                </div>
                <span className="text-2xl font-bold text-cyan-400">{calculateWorkedHours.toFixed(1)}h</span>
              </div>
            </div>
          )}

          {/* Giustificazioni Esistenti */}
          {dayJustifications.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <span>📋</span> Giustificazioni Esistenti
              </h3>
              {dayJustifications.map((entry) => {
                const statusItem = statusItems.find(s => `code-${s.code}` === entry.type);
                const hours = (entry.durationMs / (1000 * 60 * 60)).toFixed(2);
                
                return (
                  <div key={entry.id} className="bg-slate-800/50 border border-red-500/30 rounded-lg p-3 flex items-center justify-between hover:border-red-500/50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-400 font-bold text-lg">{hours}h</span>
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                          {statusItem?.class || 'GPO'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-200">{entry.note || statusItem?.description || entry.type}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

          {/* Form Nuova Giustificazione */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>➕</span> AGGIUNGI NUOVA GIUSTIFICAZIONE
            </h3>

            {/* Selezione Timbrature */}
            {dayLogs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <span>🕐</span> Seleziona Timbrature (calcolo automatico ore)
                </label>
                <div className="space-y-2">
                  {dayLogs.map((log, index) => {
                    const isSelected = selectedLogIndices.includes(index);
                    const isIn = log.type === 'in';
                    
                    return (
                      <button
                        key={log.id}
                        onClick={() => handleToggleLogSelection(index)}
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                          isSelected
                            ? isIn
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                              : 'bg-red-500/20 border-red-500 text-red-200'
                            : 'bg-slate-800/50 border-slate-600 text-gray-300 hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          isIn ? 'bg-cyan-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-bold text-lg">{isIn ? 'ENTRATA' : 'USCITA'}</span>
                        <span className="font-mono text-base">{formatTime(log.timestamp)}</span>
                        {isSelected && (
                          <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedLogIndices.length > 0 && (
                  <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">⚡</span>
                      <span className="text-sm text-gray-300">Ore calcolate:</span>
                      <span className="font-bold text-lg text-cyan-400">{calculateSelectedHours.toFixed(2)}h</span>
                    </div>
                    <button
                      onClick={handleUseSelectedHours}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-all"
                    >
                      ⚡ Usa queste ore
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tipo Straordinario */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span>🏥</span> Tipo Assenza/Permesso
              </label>
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setSelectedType(item)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      selectedType?.code === item.code
                        ? item.class === 'ACC'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                          : 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                        : 'bg-slate-800/50 border-slate-600 text-gray-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{item.description}</div>
                    <div className={`text-xs px-2 py-0.5 rounded inline-block border ${
                      item.class === 'ACC'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {item.class}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Ore */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span>🕐</span> Ore
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Es: 2.5"
                className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-all"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span>📝</span> Note (opzionale)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aggiungi dettagli..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-900/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedType || !hours}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>🏥</span> Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbsenceJustificationModal;

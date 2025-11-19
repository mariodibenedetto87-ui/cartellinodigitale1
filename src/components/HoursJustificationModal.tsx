import React, { useState } from 'react';
import { StatusItem, AllTimeLogs, AllManualOvertime } from '../types';
import { formatDateKey } from '../utils/timeUtils';

interface HoursJustificationModalProps {
  date: Date;
  allLogs: AllTimeLogs;
  allManualOvertime: AllManualOvertime;
  statusItems: StatusItem[];
  mode: 'extra' | 'missing'; // 'extra' = ore in più (straordinari, corsi), 'missing' = ore in meno (permessi, assenze)
  onClose: () => void;
  onSave: (dateKey: string, durationMs: number, type: string, note: string) => void;
  onDelete: (dateKey: string, entryId: string) => void;
}

const HoursJustificationModal: React.FC<HoursJustificationModalProps> = ({ 
  date, allLogs, allManualOvertime, statusItems, mode, onClose, onSave, onDelete 
}) => {
  const [hours, setHours] = useState('');
  const [selectedType, setSelectedType] = useState<StatusItem | null>(null);
  const [note, setNote] = useState('');
  const [selectedLogIndices, setSelectedLogIndices] = useState<number[]>([]);

  const dateKey = formatDateKey(date);
  const dayLogs = allLogs[dateKey] || [];
  const dayJustifications = allManualOvertime[dateKey] || [];
  
  // Filtra gli item in base alla modalità
  const filteredItems = mode === 'extra'
    ? statusItems.filter(item => item.category === 'overtime') // Straordinari, Corsi, etc.
    : statusItems.filter(item => item.category === 'leave-hours'); // Permessi ore, Malattia ore, etc.

  // Icone e titoli in base alla modalità
  const config = mode === 'extra' 
    ? {
        icon: '⚡',
        title: 'Giustifica Ore Extra',
        subtitle: 'Straordinari, Corsi, Formazione',
        color: 'orange',
        gradient: 'from-orange-500 via-amber-500 to-orange-600',
        bgLight: 'from-orange-50 to-amber-50',
        bgDark: 'from-orange-900/20 to-amber-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        text: 'text-orange-700 dark:text-orange-300',
        button: 'bg-orange-500 hover:bg-orange-600'
      }
    : {
        icon: '🏥',
        title: 'Giustifica Ore Mancanti',
        subtitle: 'Permessi, Malattia, Assenze',
        color: 'blue',
        gradient: 'from-blue-500 via-cyan-500 to-blue-600',
        bgLight: 'from-blue-50 to-cyan-50',
        bgDark: 'from-blue-900/20 to-cyan-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        button: 'bg-blue-500 hover:bg-blue-600'
      };

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
    if (!selectedType) {
      alert(mode === 'extra' ? "Seleziona un tipo di giustificazione" : "Seleziona un tipo di assenza/permesso");
      return;
    }

    const hrs = parseFloat(hours.replace(',', '.'));
    if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
      alert("Inserisci un numero di ore valido (0-24)");
      return;
    }

    const durationMs = hrs * 60 * 60 * 1000;
    onSave(dateKey, durationMs, selectedType.description, note || selectedType.description);
    
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r ${config.gradient} px-6 py-4 rounded-t-3xl shadow-lg`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-white drop-shadow-lg">{config.icon} {config.title}</h2>
              <p className="text-sm text-white/90 font-semibold mt-1">{config.subtitle}</p>
              <p className="text-xs text-white/80 mt-1">
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
            <div className={`p-4 bg-gradient-to-br ${config.bgLight} dark:${config.bgDark} border-2 ${config.border} rounded-xl`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${config.text}`}>⏱️ Ore lavorate oggi:</span>
                <span className={`text-2xl font-black ${config.text}`}>{workedHours.toFixed(1)}h</span>
              </div>
            </div>
          )}

          {/* Lista giustificazioni esistenti */}
          {dayJustifications.length > 0 && (
            <div>
              <h3 className={`text-sm font-bold ${config.text} uppercase tracking-wide mb-3`}>
                📋 Giustificazioni Registrate
              </h3>
              <div className="space-y-2">
                {dayJustifications.map(entry => (
                  <div key={entry.id} className={`p-3 bg-gradient-to-br ${config.bgLight} dark:${config.bgDark} border-2 ${config.border} rounded-xl flex items-center justify-between`}>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${config.text}`}>{entry.type}</div>
                      <div className={`text-xs ${config.text} opacity-80 flex items-center space-x-2`}>
                        <span>⏱️ {(entry.durationMs / (1000 * 60 * 60)).toFixed(1)}h</span>
                        {entry.note && <span>• {entry.note}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form aggiunta giustificazione */}
          <div className={`border-t-2 border-dashed ${config.border} pt-6`}>
            <h3 className={`text-sm font-bold ${config.text} uppercase tracking-wide mb-4`}>
              ➕ Aggiungi Nuova Giustificazione
            </h3>
            
            {/* Selezione Timbrature - solo per mode 'extra' */}
            {mode === 'extra' && dayLogs.length > 0 && (
              <div className="mb-4">
                <div className={`text-xs font-bold ${config.text} mb-2`}>
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
                              ? `${config.button} border-${config.color}-600 text-white shadow-lg scale-105`
                              : `bg-white dark:bg-slate-700 ${config.border} text-gray-700 dark:text-gray-300 hover:border-${config.color}-400`
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
                    <div className={`p-3 bg-gradient-to-br ${config.bgLight} dark:${config.bgDark} border-2 ${config.border} rounded-lg mb-3`}>
                      <div className={`text-sm font-semibold ${config.text} mb-2`}>
                        ⏱️ Ore calcolate: <span className="text-lg font-black">{calculatedHours.toFixed(2)}h</span>
                      </div>
                      <button
                        onClick={() => setHours(calculatedHours.toFixed(2))}
                        className={`w-full px-3 py-2 ${config.button} text-white text-sm font-bold rounded-lg transition-colors`}
                      >
                        ✨ Usa queste ore
                      </button>
                    </div>
                  ) : null;
                })()}
                
                <div className={`border-t-2 ${config.border} my-3`}></div>
              </div>
            )}

            {/* Tipo Giustificazione */}
            <div className="mb-4">
              <label className={`block text-sm font-bold ${config.text} mb-2`}>
                📝 Tipo {mode === 'extra' ? 'Straordinario' : 'Assenza'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map(item => (
                  <button
                    key={item.code}
                    onClick={() => setSelectedType(item)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedType?.code === item.code
                        ? `${config.button} border-${config.color}-600 text-white shadow-lg scale-105`
                        : `bg-white dark:bg-slate-700 ${config.border} text-gray-700 dark:text-gray-300 hover:border-${config.color}-400`
                    }`}
                  >
                    <div className="text-sm font-bold">{item.description}</div>
                    {item.class && (
                      <div className="text-xs mt-1 opacity-80">{item.class}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ore */}
            <div className="mb-4">
              <label className={`block text-sm font-bold ${config.text} mb-2`}>⏱️ Ore</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Es: 2.5"
                className={`w-full px-4 py-3 border-2 ${config.border} rounded-xl text-gray-800 dark:text-white dark:bg-slate-700 focus:ring-2 focus:ring-${config.color}-500 focus:border-transparent text-lg font-bold`}
              />
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className={`block text-sm font-bold ${config.text} mb-2`}>💬 Note (opzionale)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aggiungi dettagli..."
                rows={2}
                className={`w-full px-4 py-3 border-2 ${config.border} rounded-xl text-gray-800 dark:text-white dark:bg-slate-700 focus:ring-2 focus:ring-${config.color}-500 focus:border-transparent resize-none`}
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                className={`flex-1 px-4 py-3 ${config.button} text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
              >
                💾 Salva
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoursJustificationModal;

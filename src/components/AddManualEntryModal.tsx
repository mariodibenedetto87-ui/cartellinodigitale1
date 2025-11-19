import React, { useState, useMemo } from 'react';
import { ManualOvertimeType, StatusItem } from '../types';
import { formatDateKey } from '../utils/timeUtils';

interface AddManualEntryModalProps {
  date: Date;
  statusItems: StatusItem[];
  onClose: () => void;
  onSave: (dateKey: string, durationMs: number, type: ManualOvertimeType, note: string) => void;
}

const AddManualEntryModal: React.FC<AddManualEntryModalProps> = ({ date, statusItems, onClose, onSave }) => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [type, setType] = useState<ManualOvertimeType>('diurnal');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    
  if (h === 0 && m === 0) {
    alert("Per favore, inserisci una durata valida.");
    return;
  }

    const durationMs = (h * 3600 + m * 60) * 1000;
    const dateKey = formatDateKey(date);
    onSave(dateKey, durationMs, type, note);
    onClose();
  };

  const manualEntryOptions = useMemo(() => {
    const overtimeTypes: { value: ManualOvertimeType; label: string }[] = [
        { value: 'diurnal', label: 'Straordinario Diurno' },
        { value: 'nocturnal', label: 'Straordinario Notturno' },
        { value: 'holiday', label: 'Straordinario Festivo' },
        { value: 'nocturnal-holiday', label: 'Straordinario Festivo Notturno' },
    ];

    const workLikeItems = statusItems
        .filter(item => 
            item.category === 'overtime' || 
            // Include specific work-like activities from leave-hours
            [2041, 2054].includes(item.code)
        )
        .map(item => ({ value: `code-${item.code}`, label: item.description }));

    return [...overtimeTypes, ...workLikeItems];
  }, [statusItems]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-md animate-modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Aggiungi Voce Manuale</h2>
          <button onClick={onClose} className="text-gray-600 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Durata</label>
            <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Ore"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                  min="0"
                />
                 <input
                  type="number"
                  placeholder="Minuti"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                  min="0"
                  max="59"
                />
            </div>
          </div>
           <div>
            <label htmlFor="overtimeType" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Tipo di Voce
            </label>
            <select
                id="overtimeType"
                value={type}
                onChange={(e) => setType(e.target.value as ManualOvertimeType)}
                className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
            >
                {manualEntryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Nota (opzionale)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aggiungi una breve descrizione del lavoro svolto..."
              className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva Voce</button>
        </div>
      </div>
    </div>
  );
};

export default AddManualEntryModal;
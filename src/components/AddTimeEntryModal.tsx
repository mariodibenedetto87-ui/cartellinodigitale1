import React, { useState } from 'react';
import { formatDateKey } from '../utils/timeUtils';

interface AddTimeEntryModalProps {
  date: Date;
  onClose: () => void;
  onSave: (newTimestamp: Date, type: 'in' | 'out') => void;
}

const AddTimeEntryModal: React.FC<AddTimeEntryModalProps> = ({ date, onClose, onSave }) => {
  // FIX: Use formatDateKey to prevent timezone issues
  const [dateValue, setDateValue] = useState(formatDateKey(date));
  const [timeValue, setTimeValue] = useState(new Date().toTimeString().slice(0, 5)); // HH:MM
  const [type, setType] = useState<'in' | 'out'>('in');

  const handleSave = () => {
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newTimestamp = new Date(year, month - 1, day, hours, minutes, 0, 0);
    onSave(newTimestamp, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-sm animate-modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Aggiungi Timbratura</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Data
            </label>
            <input
              type="date"
              id="entryDate"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label htmlFor="entryTime" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {type === 'in' ? 'Orario di Entrata' : 'Orario di Uscita'}
            </label>
            <input
              type="time"
              id="entryTime"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className={`w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500 ${type === 'out' ? 'time-input-uscita' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tipo di Timbratura
            </label>
            <div className="flex space-x-4">
                <label className="flex items-center">
                    <input type="radio" name="entryType" value="in" checked={type === 'in'} onChange={() => setType('in')} className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-slate-500 bg-gray-100 dark:bg-slate-700" />
                    <span className="ml-2 text-slate-800 dark:text-white">Entrata</span>
                </label>
                 <label className="flex items-center">
                    <input type="radio" name="entryType" value="out" checked={type === 'out'} onChange={() => setType('out')} className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-slate-500 bg-gray-100 dark:bg-slate-700" />
                    <span className="ml-2 text-slate-800 dark:text-white">Uscita</span>
                </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva Timbratura</button>
        </div>
      </div>
    </div>
  );
};

export default AddTimeEntryModal;
import React, { useState } from 'react';
import { LeaveType, ShiftType, StatusItem, WorkSettings } from '../types';

interface QuickLeaveModalProps {
  date: Date;
  statusItems: StatusItem[];
  workSettings: WorkSettings;
  highlightedLeave?: LeaveType;
  onClose: () => void;
  onSetLeave: (date: Date, leave: LeaveType | null, hours?: number) => void;
  onSetShift: (date: Date, shift: ShiftType | null) => void;
  onOpenAddEntryModal: (date: Date) => void;
}

const QuickLeaveModal: React.FC<QuickLeaveModalProps> = ({ date, statusItems, workSettings, highlightedLeave, onClose, onSetLeave, onSetShift, onOpenAddEntryModal }) => {
  const [editingHoursFor, setEditingHoursFor] = useState<StatusItem | null>(null);
  const [hoursValue, setHoursValue] = useState('');

  const handleSelectLeave = (item: StatusItem) => {
    if (item.category === 'leave-hours') {
        setEditingHoursFor(item);
    } else {
        onSetLeave(date, `code-${item.code}`);
        onClose();
    }
  };

  const handleSaveHours = () => {
    const hours = parseFloat(hoursValue.replace(',', '.'));
    if (editingHoursFor && !isNaN(hours) && hours > 0) {
        onSetLeave(date, `code-${editingHoursFor.code}`, hours);
        onClose();
    } else {
        alert("Inserisci un numero di ore valido.");
    }
  };

  const handleSetShift = (shift: ShiftType | null) => {
    onSetShift(date, shift);
    onClose();
  };

  const handleClear = () => {
    onSetLeave(date, null);
    onSetShift(date, null);
    onClose();
  }

  const getLeaveButtonClasses = (code: number, hoverColor: string) => {
    let classes = 'p-3 bg-gray-100 dark:bg-slate-700 rounded-lg text-center transition-all duration-200 ease-in-out text-sm';
    classes += ` ${hoverColor}`;
    if (`code-${code}` === highlightedLeave) {
      classes += ' ring-4 ring-offset-2 dark:ring-offset-slate-800 ring-emerald-500 scale-105 shadow-lg';
    }
    return classes;
  };
  
  const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
  }

  const leaveDayItems = statusItems.filter(item => item.category === 'leave-day').sort((a,b) => a.code - b.code);
  const leaveHourItems = statusItems.filter(item => item.category === 'leave-hours').sort((a,b) => a.code - b.code);
  const shiftItems = workSettings.shifts;

  const renderSelectionView = () => (
    <>
      {leaveDayItems.length > 0 && (
        <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 text-center">Permessi Giornalieri</h3>
            <div className="grid grid-cols-2 gap-2">
                {leaveDayItems.map(item => (
                    <button key={item.code} onClick={() => handleSelectLeave(item)} className={getLeaveButtonClasses(item.code, 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50')}>
                        {truncateText(item.description, 30)}
                    </button>
                ))}
            </div>
        </div>
      )}

      {leaveHourItems.length > 0 && (
         <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 text-center">Permessi Orari</h3>
            <div className="grid grid-cols-2 gap-2">
                {leaveHourItems.map(item => (
                     <button key={item.code} onClick={() => handleSelectLeave(item)} className={getLeaveButtonClasses(item.code, 'hover:bg-violet-200 dark:hover:bg-violet-900/50')}>
                        {truncateText(item.description, 30)}
                    </button>
                ))}
            </div>
        </div>
      )}

      <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 text-center">Imposta Turno</h3>
          <div className="grid grid-cols-3 gap-3">
              {shiftItems.map(shift => (
                  <button key={shift.id} onClick={() => handleSetShift(shift.id)} className={`p-3 rounded-lg text-center transition-colors text-sm font-semibold ${shift.bgColor} ${shift.textColor} hover:opacity-80`}>
                      {shift.name}
                  </button>
              ))}
          </div>
      </div>
      <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 text-center">Aggiungi Ore</h3>
          <button onClick={() => onOpenAddEntryModal(date)} className="w-full p-3 bg-gray-100 dark:bg-slate-700 hover:bg-teal-500/80 rounded-lg text-center transition-colors font-medium">
              Aggiungi Timbratura
          </button>
      </div>
       <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
          <button onClick={handleClear} className="w-full p-3 bg-gray-200 dark:bg-slate-600 hover:bg-red-500/80 rounded-lg text-center transition-colors">
              Pulisci Giorno
          </button>
      </div>
    </>
  );

  const renderHoursInputView = () => (
    <div>
      <h3 className="text-md font-semibold text-gray-800 dark:text-slate-200 mb-1 text-center">
        {editingHoursFor?.description}
      </h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 text-center">
        Inserisci il numero di ore di permesso da registrare.
      </p>
      <div className="flex items-center space-x-3">
        <input 
          type="number"
          value={hoursValue}
          onChange={(e) => setHoursValue(e.target.value)}
          placeholder="Es. 2,5"
          step="0.5"
          className="w-full text-center text-2xl font-bold bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-4 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
          autoFocus
        />
        <span className="text-xl font-semibold text-gray-600 dark:text-slate-300">ore</span>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button onClick={() => setEditingHoursFor(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">
            Annulla
        </button>
        <button onClick={handleSaveHours} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">
            Conferma
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-black/20 w-full max-w-md animate-modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-500 dark:text-teal-400">
            {editingHoursFor ? `Inserisci Ore` : `Pianifica per ${date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        {editingHoursFor ? renderHoursInputView() : renderSelectionView()}
      </div>
    </div>
  );
};

export default QuickLeaveModal;
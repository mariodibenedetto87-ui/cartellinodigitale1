import React, { useState, useEffect } from 'react';
import { StatusItem, ShiftType, LeaveType } from '../types';
import { formatDateKey } from '../utils/timeUtils';

interface RangePlannerModalProps {
  isOpen: boolean;
  startDate?: Date;
  statusItems: StatusItem[];
  onClose: () => void;
  onApply: (start: string, end: string, action: { type: 'shift' | 'leave' | 'clear', value: ShiftType | LeaveType | null }) => void;
}

const RangePlannerModal: React.FC<RangePlannerModalProps> = ({ isOpen, startDate, statusItems, onClose, onApply }) => {
  const today = new Date();
  const [start, setStart] = useState(formatDateKey(startDate || today));
  const [end, setEnd] = useState(formatDateKey(startDate || today));
  const [actionType, setActionType] = useState<'shift' | 'leave' | 'clear'>('shift');
  const [selectedValue, setSelectedValue] = useState<ShiftType | LeaveType>('morning');

  useEffect(() => {
    if (isOpen && startDate) {
      const formattedDate = formatDateKey(startDate);
      setStart(formattedDate);
      setEnd(formattedDate);
    }
  }, [isOpen, startDate]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!start || !end) {
      alert("Seleziona un intervallo di date valido.");
      return;
    }
    if (new Date(start) > new Date(end)) {
      alert("La data di fine non può precedere la data di inizio.");
      return;
    }
    onApply(start, end, {
      type: actionType,
      value: actionType === 'clear' ? null : selectedValue,
    });
    onClose();
  };
  
  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.target.value as 'shift' | 'leave' | 'clear';
      setActionType(type);
      if (type === 'shift') {
        setSelectedValue('morning');
      } else if (type === 'leave') {
        const firstLeave = statusItems.find(i => i.category === 'leave-day' || i.category === 'leave-hours');
        setSelectedValue(firstLeave ? `code-${firstLeave.code}` : 'code-15');
      }
  }

  const shiftOptions: { value: ShiftType, label: string }[] = [
      { value: 'morning', label: 'Turno Mattina' },
      { value: 'afternoon', label: 'Turno Pomeriggio' },
      { value: 'rest', label: 'Riposo' },
  ];
  
  const leaveOptions = statusItems
      .filter(item => item.category === 'leave-day' || item.category === 'leave-hours')
      .map(item => ({ value: `code-${item.code}` as LeaveType, label: item.description }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-lg animate-modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Pianificazione Rapida Intervallo</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">1. Seleziona l'intervallo di date</label>
            <div className="flex items-center space-x-4">
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
              <span className="text-gray-500 dark:text-slate-400">a</span>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">2. Scegli l'azione da applicare</label>
            <div className="flex gap-4">
                <select onChange={handleActionTypeChange} value={actionType} className="flex-shrink-0 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2">
                    <option value="shift">Imposta Turno</option>
                    <option value="leave">Imposta Assenza</option>
                    <option value="clear">Pulisci Giorni</option>
                </select>
                
                {actionType === 'shift' && (
                    <select value={selectedValue} onChange={e => setSelectedValue(e.target.value as ShiftType)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2">
                        {shiftOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                )}
                {actionType === 'leave' && (
                     <select value={selectedValue} onChange={e => setSelectedValue(e.target.value as LeaveType)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2">
                        {leaveOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                )}
                 {actionType === 'clear' && (
                    <div className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-500 dark:text-slate-400 italic">
                        Verranno rimossi turni e assenze.
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
          <button onClick={handleApply} className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Applica Azione</button>
        </div>
      </div>
    </div>
  );
};

export default RangePlannerModal;

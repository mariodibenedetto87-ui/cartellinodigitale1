import React, { useState, useEffect } from 'react';
import { Shift } from '../../types';

interface ShiftModalProps {
  shift: Partial<Shift> | null;
  onClose: () => void;
  onSave: (shift: Shift) => void;
}

const colorOptions = [
    { name: 'Amber', textColor: 'text-amber-800 dark:text-amber-200', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
    { name: 'Indigo', textColor: 'text-indigo-800 dark:text-indigo-200', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { name: 'Blue', textColor: 'text-blue-800 dark:text-blue-200', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
    { name: 'Cyan', textColor: 'text-cyan-800 dark:text-cyan-200', bgColor: 'bg-cyan-100 dark:bg-cyan-900/50' },
    { name: 'Emerald', textColor: 'text-emerald-800 dark:text-emerald-200', bgColor: 'bg-emerald-100 dark:bg-emerald-900/50' },
    { name: 'Pink', textColor: 'text-pink-800 dark:text-pink-200', bgColor: 'bg-pink-100 dark:bg-pink-900/50' },
    { name: 'Purple', textColor: 'text-purple-800 dark:text-purple-200', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
    { name: 'Gray', textColor: 'text-slate-800 dark:text-slate-200', bgColor: 'bg-slate-200 dark:bg-slate-700/50' },
];

const ShiftModal: React.FC<ShiftModalProps> = ({ shift, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Shift>>({
    id: '',
    name: '',
    startHour: 7,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
    textColor: colorOptions[0].textColor,
    bgColor: colorOptions[0].bgColor,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (shift && Object.keys(shift).length > 0) {
      setFormData({
         id: '',
         name: '',
         startHour: 7,
         startMinute: 0,
         endHour: 14,
         endMinute: 0,
         textColor: colorOptions[0].textColor,
         bgColor: colorOptions[0].bgColor,
         ...shift 
        });
    }
  }, [shift]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleColorChange = (color: { textColor: string, bgColor: string }) => {
      setFormData(prev => ({ ...prev, ...color }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!formData.name || formData.startHour === null || formData.endHour === null || formData.startHour === undefined || formData.endHour === undefined) {
        setError('Per favore, compila tutti i campi.');
        return;
    }

    const startHour = Number(formData.startHour);
    const startMinute = Number(formData.startMinute || 0);
    const endHour = Number(formData.endHour);
    const endMinute = Number(formData.endMinute || 0);

    // Converti in minuti totali per il confronto
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (startTotalMinutes === endTotalMinutes) {
        setError("L'ora di inizio e di fine non possono coincidere.");
        return;
    }
    
    onSave({
        id: formData.id || self.crypto.randomUUID(),
        name: formData.name,
        startHour,
        startMinute,
        endHour,
        endMinute,
        textColor: formData.textColor || colorOptions[0].textColor,
        bgColor: formData.bgColor || colorOptions[0].bgColor,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-md animate-modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">{shift?.id ? 'Modifica Turno' : 'Aggiungi Nuovo Turno'}</h2>
            <button type="button" onClick={onClose} className="text-gray-600 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome Turno</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startHour" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Ora Inizio</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        name="startHour" 
                        value={formData.startHour ?? ''} 
                        onChange={handleChange} 
                        required 
                        min="0" 
                        max="23" 
                        className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" 
                        placeholder="HH"
                      />
                      <span className="mt-1 flex items-center text-gray-700 dark:text-slate-300">:</span>
                      <input 
                        type="number" 
                        name="startMinute" 
                        value={formData.startMinute ?? 0} 
                        onChange={handleChange} 
                        min="0" 
                        max="59" 
                        className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" 
                        placeholder="mm"
                      />
                    </div>
                </div>
                <div>
                    <label htmlFor="endHour" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Ora Fine</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        name="endHour" 
                        value={formData.endHour ?? ''} 
                        onChange={handleChange} 
                        required 
                        min="0" 
                        max="23" 
                        className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" 
                        placeholder="HH"
                      />
                      <span className="mt-1 flex items-center text-gray-700 dark:text-slate-300">:</span>
                      <input 
                        type="number" 
                        name="endMinute" 
                        value={formData.endMinute ?? 0} 
                        onChange={handleChange} 
                        min="0" 
                        max="59" 
                        className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" 
                        placeholder="mm"
                      />
                    </div>
                </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Colore</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {colorOptions.map(color => (
                    <button type="button" key={color.name} onClick={() => handleColorChange(color)} className={`w-8 h-8 rounded-full ${color.bgColor} transition-transform hover:scale-110 ${formData.bgColor === color.bgColor ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-teal-500' : ''}`} aria-label={`Seleziona colore ${color.name}`}></button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 text-center p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-semibold">
                {error}
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftModal;
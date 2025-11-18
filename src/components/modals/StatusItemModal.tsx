import React, { useState, useEffect } from 'react';
import { StatusItem } from '../../types';

interface StatusItemModalProps {
  item: Partial<StatusItem> | null;
  onClose: () => void;
  onSave: (item: StatusItem) => void;
}

const StatusItemModal: React.FC<StatusItemModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<StatusItem>>({
    code: undefined,
    description: '',
    year: new Date().getFullYear(),
    class: '',
    entitlement: 0,
    category: 'leave-day',
  });
  
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');


  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      const fullItemData = {
          category: ('leave-day' as const),
          entitlement: 0,
          ...item,
      };
      setFormData(fullItemData);
      
      if (fullItemData.category === 'leave-hours') {
          const totalHours = fullItemData.entitlement || 0;
          const h = Math.floor(totalHours);
          const m = Math.round((totalHours % 1) * 60);
          setHours(String(h));
          setMinutes(String(m));
      }
    } else {
        // Reset for new item
        setFormData({
            code: undefined,
            description: '',
            year: new Date().getFullYear(),
            class: '',
            entitlement: 0,
            category: 'leave-day',
        });
        setHours('0');
        setMinutes('0');
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? (value ? parseFloat(value) : '') : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalEntitlement = Number(formData.entitlement) || 0;
    if (formData.category === 'leave-hours') {
        const h = parseInt(hours, 10) || 0;
        const m = parseInt(minutes, 10) || 0;
        finalEntitlement = h + (m / 60);
    }
    
    if (formData.code && formData.description && formData.class && formData.category) {
      onSave({
          code: formData.code,
          description: formData.description,
          year: formData.year || new Date().getFullYear(),
          class: formData.class,
          entitlement: finalEntitlement,
          category: formData.category as 'leave-day' | 'leave-hours' | 'overtime' | 'balance' | 'info',
      });
    } else {
      alert('Per favore, compila tutti i campi obbligatori (Codice, Descrizione, Classe, Categoria).');
    }
  };

  const getEntitlementLabel = () => {
    switch (formData.category) {
        case 'leave-day':
            return 'Giorni Previsti';
        default:
            return 'Conteggio / Previsto';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-md animate-modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">{item?.code ? 'Modifica Status' : 'Aggiungi Nuovo Status'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Codice</label>
              <input type="number" name="code" value={formData.code || ''} onChange={handleChange} required className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" disabled={!!item?.code} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Descrizione</label>
              <input type="text" name="description" value={formData.description || ''} onChange={handleChange} required className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Anno</label>
                    <input type="number" name="year" value={formData.year || ''} onChange={handleChange} required className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Classe</label>
                    <input type="text" name="class" value={formData.class || ''} onChange={handleChange} required className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
            </div>
             <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Categoria</label>
              <select 
                name="category" 
                id="category"
                value={formData.category || ''} 
                onChange={handleChange} 
                required 
                className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2"
              >
                <option value="leave-day">Permesso (Giorni)</option>
                <option value="leave-hours">Permesso (Ore)</option>
                <option value="overtime">Straordinario</option>
                <option value="balance">Saldo</option>
                <option value="info">Informativo</option>
              </select>
            </div>
            {formData.category === 'leave-hours' ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Ore Previste</label>
                    <div className="mt-1 grid grid-cols-2 gap-4">
                        <input type="number" name="hours" placeholder="Ore" value={hours} onChange={(e) => setHours(e.target.value)} min="0" className="w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                        <input type="number" name="minutes" placeholder="Minuti" value={minutes} onChange={(e) => setMinutes(e.target.value)} min="0" max="59" className="w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                    </div>
                </div>
            ) : (
                <div>
                    <label htmlFor="entitlement" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{getEntitlementLabel()}</label>
                    <input type="number" name="entitlement" value={formData.entitlement ?? ''} onChange={handleChange} required className="mt-1 w-full bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2" />
                </div>
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusItemModal;
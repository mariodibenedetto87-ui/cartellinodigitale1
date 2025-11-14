import React, { useState } from 'react';
import { formatDateKey } from '../../utils/timeUtils';

interface ExportCalendarModalProps {
    visible: boolean;
    initialDate: Date;
    onClose: () => void;
    onExport: (startDate: string, endDate: string, format: 'ics' | 'csv') => void;
}

const ExportCalendarModal: React.FC<ExportCalendarModalProps> = ({ visible, initialDate, onClose, onExport }) => {
    const getMonthRange = (date: Date) => {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
            start: formatDateKey(start),
            end: formatDateKey(end)
        };
    };

    const [range, setRange] = useState(getMonthRange(initialDate));
    const [format, setFormat] = useState<'ics' | 'csv'>('ics');

    const handleExportClick = () => {
        if (!range.start || !range.end) {
            alert("Per favore, seleziona un intervallo di date valido.");
            return;
        }
        if (new Date(range.start) > new Date(range.end)) {
            alert("La data di fine non può essere precedente alla data di inizio.");
            return;
        }
        onExport(range.start, range.end, format);
    };
    
    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-md animate-modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Esporta Dati</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Formato di Esportazione</label>
                        <div className="flex space-x-2 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button onClick={() => setFormat('ics')} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${format === 'ics' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Calendario (.ics)</button>
                            <button onClick={() => setFormat('csv')} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${format === 'csv' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Report (.csv)</button>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        {format === 'ics' 
                            ? "Verrà generato un file .ics che potrai importare nella tua applicazione di calendario preferita (Google, Outlook, Apple)."
                            : "Verrà generato un file .csv con il riepilogo dettagliato delle ore, apribile con Excel, Fogli Google o altri software."
                        }
                    </p>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Data di Inizio</label>
                        <input
                            type="date"
                            id="startDate"
                            value={range.start}
                            onChange={(e) => setRange(r => ({ ...r, start: e.target.value }))}
                            className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Data di Fine</label>
                        <input
                            type="date"
                            id="endDate"
                            value={range.end}
                            onChange={(e) => setRange(r => ({ ...r, end: e.target.value }))}
                            className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
                    <button onClick={handleExportClick} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Genera e Scarica
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportCalendarModal;
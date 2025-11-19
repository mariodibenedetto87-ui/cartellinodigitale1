import React, { useState, useMemo } from 'react';
import { AllDayInfo, DayInfo } from '../../types';
import { formatDateKey, addMonths, startOfWeek, addDays } from '../../utils/timeUtils';
import { PhoneIcon } from '../ShiftIcons';

interface OnCallModalProps {
  initialDayInfo: AllDayInfo;
  onClose: () => void;
  onSave: (newDayInfo: AllDayInfo) => void;
}

const OnCallModal: React.FC<OnCallModalProps> = ({ initialDayInfo, onClose, onSave }) => {
    const [displayDate, setDisplayDate] = useState(new Date());
    const [draftDayInfo, setDraftDayInfo] = useState<AllDayInfo>(initialDayInfo);

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    
    const monthMatrix = useMemo(() => {
        const monthStart = new Date(year, month, 1);
        const startDate = startOfWeek(monthStart);
        const calendarDays = [];
        let day = startDate;
        while (calendarDays.length < 42) {
            calendarDays.push(new Date(day));
            day = addDays(day, 1);
        }
        return calendarDays;
    }, [year, month]);

    const handleDayClick = (day: Date) => {
        const dateKey = formatDateKey(day);
        setDraftDayInfo(prev => {
            const newDrafts = { ...prev };
            const currentInfo: DayInfo = newDrafts[dateKey] ? { ...newDrafts[dateKey] } : {};

            if (currentInfo.onCall) {
                delete currentInfo.onCall;
            } else {
                currentInfo.onCall = true;
            }

            if (Object.keys(currentInfo).length === 0) {
                delete newDrafts[dateKey];
            } else {
                newDrafts[dateKey] = currentInfo;
            }
            return newDrafts;
        });
    };
    
    const handleSave = () => {
        onSave(draftDayInfo);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl w-full max-w-xl animate-modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Gestione Reperibilità</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                </div>
                
                <p className="text-gray-600 dark:text-slate-600 mb-4 text-sm">Seleziona i giorni del mese per attivare o disattivare la reperibilità (dalle 22:00 alle 07:00 del giorno successivo).</p>

                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-slate-700">
                        <button onClick={() => setDisplayDate(addMonths(displayDate, -1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="Mese precedente"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white capitalize">{displayDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={() => setDisplayDate(addMonths(displayDate, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="Mese successivo"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                    <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-slate-700">
                        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="py-2 text-xs font-bold text-gray-600 dark:text-slate-600">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6">
                        {monthMatrix.map((day, i) => {
                            const isCurrentMonth = day.getMonth() === month;
                            const dateKey = formatDateKey(day);
                            const isOnCall = draftDayInfo[dateKey]?.onCall;
                            
                            let dayClasses = 'relative p-2 h-16 flex items-center justify-center transition-colors text-sm font-semibold border-r border-b border-gray-200 dark:border-slate-700 ';
                            if (!isCurrentMonth) {
                                dayClasses += 'bg-gray-100/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-600';
                            } else {
                                dayClasses += 'cursor-pointer ';
                                dayClasses += isOnCall 
                                    ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' 
                                    : 'bg-white dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300';
                            }
                            
                            return (
                                <div key={i} onClick={() => isCurrentMonth && handleDayClick(day)} className={dayClasses}>
                                     {isCurrentMonth && (
                                         <>
                                            <span>{day.getDate()}</span>
                                            {isOnCall && <PhoneIcon className="w-4 h-4 absolute top-2 right-2 text-blue-600 dark:text-blue-400" />}
                                         </>
                                     )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
                    <button onClick={handleSave} className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva Modifiche</button>
                </div>
            </div>
        </div>
    );
};

export default OnCallModal;
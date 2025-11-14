import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DayInfo, ShiftTool, ShiftType, SavedRotation, WorkSettings } from '../../types';
import { getYearMatrix } from '../../utils/calendarUtils';
import { formatDateKey, addMonths, startOfMonth, startOfWeek, addDays, getShiftDetails } from '../../utils/timeUtils';
import { MorningIcon, AfternoonIcon, RestIcon } from '../ShiftIcons';

interface VisualShiftPlannerModalProps {
  initialDayInfo: Record<string, DayInfo>;
  savedRotations: SavedRotation[];
  workSettings: WorkSettings;
  onClose: () => void;
  onSave: (draftShifts: Record<string, DayInfo>) => void;
  onSetSavedRotations: (rotations: SavedRotation[]) => void;
}

const EraserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.218-.266.425-.546.597-.833l-5.877-5.877a2.652 2.652 0 00-3.75 3.75l5.877 5.877c.287-.172.567-.38.833-.597z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v2.25a8.96 8.96 0 01-8.96 8.96H11.25a8.96 8.96 0 01-8.96-8.96V11.25A8.96 8.96 0 0111.25 2.25H13.5a8.96 8.96 0 018.96 8.96z" />
    </svg>
);


const VisualShiftPlannerModal: React.FC<VisualShiftPlannerModalProps> = ({ initialDayInfo, savedRotations, workSettings, onClose, onSave, onSetSavedRotations }) => {
    const [mode, setMode] = useState<'painter' | 'rotation'>('painter');
    const [displayDate, setDisplayDate] = useState(new Date());
    const [draftShifts, setDraftShifts] = useState<Record<string, DayInfo>>(initialDayInfo);
    const [selectedTool, setSelectedTool] = useState<ShiftTool>('morning');
    const [lastPainted, setLastPainted] = useState<string | null>(null);

    // State for Rotation mode
    const [rotationPattern, setRotationPattern] = useState<ShiftType[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [newRotationName, setNewRotationName] = useState('');

    // State for auto-save status message
    const [autoSaveStatus, setAutoSaveStatus] = useState('');

    // Ref to hold the latest draftShifts for the interval callback, preventing stale state issues
    const draftShiftsRef = useRef(draftShifts);
    useEffect(() => {
        draftShiftsRef.current = draftShifts;
    }, [draftShifts]);

    // Effect for auto-saving logic
    useEffect(() => {
        const intervalId = setInterval(() => {
            // Compare the latest shifts in the ref with the initial state from props to see if there are changes.
            if (JSON.stringify(draftShiftsRef.current) !== JSON.stringify(initialDayInfo)) {
                onSave(draftShiftsRef.current);
                const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setAutoSaveStatus(`Bozza salvata automaticamente alle ${time}`);
                
                // Set a timeout to clear the message after a few seconds
                setTimeout(() => {
                    setAutoSaveStatus('');
                }, 4000);
            }
        }, 30000); // Auto-save every 30 seconds

        // Cleanup: clear the interval when the modal is closed (unmounted)
        return () => {
            clearInterval(intervalId);
        };
    }, [initialDayInfo, onSave]);


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

    const handleDayClick = useCallback((day: Date) => {
        if (mode !== 'painter') return;
        const dateKey = formatDateKey(day);
        const newDrafts = { ...draftShifts };
        const currentInfo = newDrafts[dateKey] || {};

        if (selectedTool === 'eraser') {
            delete currentInfo.shift;
        } else {
            currentInfo.shift = selectedTool as ShiftType;
            delete currentInfo.leave; // Assigning a shift removes any leave
        }
        
        if (Object.keys(currentInfo).length === 0) {
            delete newDrafts[dateKey];
        } else {
            newDrafts[dateKey] = currentInfo;
        }

        setDraftShifts(newDrafts);
        setLastPainted(dateKey);
        setTimeout(() => setLastPainted(null), 400);
    }, [selectedTool, draftShifts, mode]);

    const handleApplyRotation = () => {
        if (rotationPattern.length === 0 || !startDate || !endDate) {
            alert("Per favore, definisci un pattern e seleziona un intervallo di date valido.");
            return;
        }

        const start = new Date(startDate + "T00:00:00");
        const end = new Date(endDate + "T00:00:00");

        if (start > end) {
            alert("La data di fine non può essere precedente alla data di inizio.");
            return;
        }

        const newDrafts = { ...draftShifts };
        let patternIndex = 0;
        let currentDate = start;

        while(currentDate <= end) {
            const shiftToApply = rotationPattern[patternIndex];
            const dateKey = formatDateKey(currentDate);
            const currentInfo = newDrafts[dateKey] || {};
            
            currentInfo.shift = shiftToApply;
            delete currentInfo.leave;

            newDrafts[dateKey] = currentInfo;
            
            currentDate = addDays(currentDate, 1);
            patternIndex = (patternIndex + 1) % rotationPattern.length;
        }

        setDraftShifts(newDrafts);
        alert("Rotazione applicata con successo! Controlla il risultato sul calendario e salva.");
        setMode('painter'); // Switch to painter mode to see the result
    };
    
    const handleSaveCurrentPattern = () => {
        if (!newRotationName.trim()) {
            alert('Per favore, inserisci un nome per la rotazione.');
            return;
        }
        if (rotationPattern.length === 0) {
            alert('Il pattern di rotazione è vuoto.');
            return;
        }

        const newRotation: SavedRotation = {
            id: self.crypto.randomUUID(),
            name: newRotationName.trim(),
            pattern: rotationPattern,
        };

        onSetSavedRotations([...savedRotations, newRotation]);
        setNewRotationName('');
        alert(`Rotazione "${newRotation.name}" salvata!`);
    };
    
    const handleLoadRotation = (rotationId: string) => {
        if (!rotationId) return;
        const rotationToLoad = savedRotations.find(r => r.id === rotationId);
        if (rotationToLoad) {
            setRotationPattern(rotationToLoad.pattern);
        }
    };

    const tools: { id: ShiftTool, label: string, Icon: React.FC<{className?: string}>, color: string }[] = [
        { id: 'morning', label: 'Mattina', Icon: MorningIcon, color: 'text-amber-400' },
        { id: 'afternoon', label: 'Pomeriggio', Icon: AfternoonIcon, color: 'text-sky-400' },
        { id: 'rest', label: 'Riposo', Icon: RestIcon, color: 'text-slate-400' },
        { id: 'eraser', label: 'Gomma', Icon: EraserIcon, color: 'text-red-400' },
    ];
    
    const ShiftChip: React.FC<{shift: ShiftType, onRemove: () => void}> = ({ shift, onRemove }) => {
        // FIX: Use getShiftDetails with shifts from workSettings.
        const details = getShiftDetails(shift, workSettings.shifts);
        return (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${details?.bgColor} ${details?.textColor}`}>
                {details?.label}
                <button onClick={onRemove} className="bg-white/10 rounded-full w-4 h-4 flex items-center justify-center text-xs">&times;</button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl w-full max-w-5xl h-[90vh] flex flex-col animate-modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Pianificatore Turni</h2>
                        <div className="bg-gray-200 dark:bg-slate-800 p-1 rounded-lg flex space-x-1 mt-2 w-fit">
                           <button onClick={() => setMode('painter')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'painter' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Pennello</button>
                           <button onClick={() => setMode('rotation')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'rotation' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Rotazione</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="flex-grow flex gap-6 overflow-hidden">
                    {/* Tools/Rotation Panel */}
                    <div className="w-80 flex-shrink-0 flex flex-col gap-3">
                       {mode === 'painter' ? (
                            <>
                                <p className="text-gray-500 dark:text-slate-400">Seleziona uno strumento e "dipingi" i turni sul calendario.</p>
                                {tools.map(tool => (
                                    <button key={tool.id} onClick={() => setSelectedTool(tool.id)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${selectedTool === tool.id ? 'bg-gray-100 dark:bg-slate-700 border-teal-500 scale-105' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100/50 dark:hover:bg-slate-700/50'}`}>
                                        <tool.Icon className={`w-8 h-8 ${tool.color}`} />
                                        <span className="text-lg font-semibold text-slate-800 dark:text-white">{tool.label}</span>
                                    </button>
                                ))}
                            </>
                       ) : (
                            <div className="flex flex-col gap-4 bg-gray-100 dark:bg-slate-800 p-4 rounded-lg h-full">
                                <div className="flex-grow space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">1. Carica o Crea un Pattern</h3>
                                        <select onChange={(e) => handleLoadRotation(e.target.value)} defaultValue="" className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white mb-2">
                                            <option value="" disabled>Carica una rotazione salvata...</option>
                                            {savedRotations.map(rot => <option key={rot.id} value={rot.id}>{rot.name}</option>)}
                                        </select>
                                        <p className="text-xs text-center text-gray-500 dark:text-slate-400 mb-2">OPPURE</p>
                                        <div className="flex gap-2 mb-2">
                                            {workSettings.shifts.map(shift => (
                                                <button key={shift.id} onClick={() => setRotationPattern([...rotationPattern, shift.id])}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${shift.bgColor} ${shift.textColor} hover:opacity-80`}>
                                                    + {shift.name}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-md min-h-[50px] max-h-28 overflow-y-auto flex flex-wrap gap-2">
                                            {rotationPattern.length > 0 ? rotationPattern.map((shift, index) => (
                                                <ShiftChip key={index} shift={shift} onRemove={() => setRotationPattern(rotationPattern.filter((_, i) => i !== index))} />
                                            )) : <p className="text-xs text-gray-400 dark:text-slate-500 p-2">Aggiungi turni per creare il pattern...</p>}
                                        </div>
                                        {rotationPattern.length > 0 && <button onClick={() => setRotationPattern([])} className="text-xs text-red-500 dark:text-red-400 hover:underline mt-2">Pulisci Pattern</button>}
                                        
                                        <div className="mt-3 flex gap-2">
                                             <input type="text" placeholder="Nome nuova rotazione" value={newRotationName} onChange={e => setNewRotationName(e.target.value)} className="flex-grow bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm" />
                                             <button onClick={handleSaveCurrentPattern} disabled={!newRotationName || rotationPattern.length === 0} className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600">Salva</button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">2. Seleziona l'intervallo di date</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <label htmlFor="startDate" className="text-sm text-gray-500 dark:text-slate-400">Data Inizio</label>
                                                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label htmlFor="endDate" className="text-sm text-gray-500 dark:text-slate-400">Data Fine</label>
                                                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                     <h3 className="font-semibold text-slate-800 dark:text-white mb-2">3. Applica alla pianificazione</h3>
                                     <button onClick={handleApplyRotation} disabled={rotationPattern.length === 0 || !startDate || !endDate} className="w-full p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                                         Applica Rotazione
                                     </button>
                                </div>
                            </div>
                       )}
                    </div>

                    {/* Calendar Panel */}
                    <div className="flex-grow flex flex-col bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                         <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                            <button onClick={() => setDisplayDate(addMonths(displayDate, -1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-white capitalize">{displayDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>
                            <button onClick={() => setDisplayDate(addMonths(displayDate, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                         </div>
                         <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="py-2 text-xs font-bold text-gray-500 dark:text-slate-400">{d}</div>)}
                         </div>
                         <div className="grid grid-cols-7 grid-rows-6 flex-grow bg-gray-300 dark:bg-slate-700 gap-px">
                            {monthMatrix.map((day, i) => {
                                const isCurrentMonth = day.getMonth() === month;
                                const dateKey = formatDateKey(day);
                                const shift = draftShifts[dateKey]?.shift;
                                const shiftDetails = shift ? getShiftDetails(shift, workSettings.shifts) : null;
                                const isLastPainted = lastPainted === dateKey;
                                
                                let dayClasses = 'relative p-2 flex items-center justify-center transition-colors ';
                                if (!isCurrentMonth) {
                                    dayClasses += 'bg-gray-100/50 dark:bg-slate-800/50';
                                } else {
                                    dayClasses += `${shiftDetails?.bgColor || 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`;
                                    dayClasses += mode === 'painter' ? ' cursor-pointer' : ' cursor-default';
                                }
                                
                                return (
                                    <div key={i} onClick={() => isCurrentMonth && handleDayClick(day)} className={dayClasses}>
                                         {isLastPainted && (
                                            <div className={`absolute inset-0.5 rounded-md ring-2 ring-inset ${selectedTool === 'eraser' ? 'ring-red-500' : 'ring-teal-500'} animate-paint-feedback`}></div>
                                         )}
                                         {isCurrentMonth && <span className={`relative z-10 font-semibold ${shiftDetails ? shiftDetails.textColor : 'text-slate-800 dark:text-slate-300'}`}>{day.getDate()}</span>}
                                    </div>
                                )
                            })}
                         </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center flex-shrink-0 border-t border-gray-200 dark:border-slate-700 pt-4">
                    <div className="flex-grow">
                        <p className={`text-sm text-gray-500 dark:text-slate-400 transition-opacity duration-500 ${autoSaveStatus ? 'opacity-100' : 'opacity-0'}`}>
                            {autoSaveStatus || '...'}
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors">Annulla</button>
                        <button onClick={() => onSave(draftShifts)} className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">Salva Pianificazione</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualShiftPlannerModal;

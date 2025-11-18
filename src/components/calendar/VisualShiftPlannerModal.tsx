import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DayInfo, ShiftTool, ShiftType, SavedRotation, WorkSettings } from '../../types';
import { formatDateKey, startOfWeek, addDays, getShiftDetails, addMonths } from '../../utils/timeUtils';
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

const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
);


const VisualShiftPlannerModal: React.FC<VisualShiftPlannerModalProps> = ({ initialDayInfo, savedRotations, workSettings, onClose, onSave, onSetSavedRotations }) => {
    const [mode, setMode] = useState<'painter' | 'rotation'>('painter');
    const [displayDate, setDisplayDate] = useState(new Date());
    const [draftShifts, setDraftShifts] = useState<Record<string, DayInfo>>(initialDayInfo);
    const [selectedTool, setSelectedTool] = useState<ShiftTool>(workSettings.shifts[0]?.id || 'eraser');
    const [lastPainted, setLastPainted] = useState<string | null>(null);

    // State for Rotation mode
    const [rotationPattern, setRotationPattern] = useState<ShiftType[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [newRotationName, setNewRotationName] = useState('');

    // State for status messages
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'success' | 'error' } | null>(null);

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
                setStatusMessage({ text: `Bozza salvata automaticamente alle ${time}`, type: 'info' });
                
                setTimeout(() => {
                    setStatusMessage(null);
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

    const handleSingleDayDelete = (e: React.MouseEvent, day: Date) => {
        e.stopPropagation(); // Prevent triggering the paint action
        const dateKey = formatDateKey(day);
        const newDrafts = { ...draftShifts };
        
        if (newDrafts[dateKey]) {
            delete newDrafts[dateKey].shift;
            if (Object.keys(newDrafts[dateKey]).length === 0) {
                delete newDrafts[dateKey];
            }
            setDraftShifts(newDrafts);
        }
    };

    const handleApplyRotation = () => {
        if (rotationPattern.length === 0 || !startDate || !endDate) {
            setStatusMessage({ text: "Per favore, definisci un pattern e seleziona un intervallo di date valido.", type: 'error' });
            return;
        }

        const start = new Date(startDate + "T00:00:00");
        const end = new Date(endDate + "T00:00:00");

        if (start > end) {
            setStatusMessage({ text: "La data di fine non può essere precedente alla data di inizio.", type: 'error' });
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
        setStatusMessage({ text: "Rotazione applicata con successo! Controlla il calendario.", type: 'success' });
        setMode('painter'); // Switch to painter mode to see the result
    };
    
    const handleSaveCurrentPattern = () => {
        if (!newRotationName.trim()) {
            setStatusMessage({ text: 'Per favore, inserisci un nome per la rotazione.', type: 'error' });
            return;
        }
        if (rotationPattern.length === 0) {
            setStatusMessage({ text: 'Il pattern di rotazione è vuoto.', type: 'error' });
            return;
        }

        const newRotation: SavedRotation = {
            id: self.crypto.randomUUID(),
            name: newRotationName.trim(),
            pattern: rotationPattern,
        };

        onSetSavedRotations([...savedRotations, newRotation]);
        setNewRotationName('');
        setStatusMessage({ text: `Rotazione "${newRotation.name}" salvata!`, type: 'success' });
    };
    
    const handleLoadRotation = (rotationId: string) => {
        if (!rotationId) return;
        const rotationToLoad = savedRotations.find(r => r.id === rotationId);
        if (rotationToLoad) {
            setRotationPattern(rotationToLoad.pattern);
        }
    };

    const tools = useMemo(() => {
        const shiftTools = workSettings.shifts.map(shift => {
            let Icon: React.FC<{ className?: string }>;
            
            // We now rely on default props or style for these icons, 
            // ensuring they maintain their identity if they are standard types.
            switch (shift.id) {
                case 'morning':
                    Icon = MorningIcon;
                    break;
                case 'afternoon':
                    Icon = AfternoonIcon;
                    break;
                case 'rest':
                    Icon = RestIcon;
                    break;
                default: 
                    // Fallback for custom shifts: a colored div acts as the icon.
                    Icon = ({ className }) => <div className={`w-8 h-8 rounded-full ${shift.bgColor} ${className}`} />;
            }
            
            return { id: shift.id as ShiftTool, label: shift.name, Icon, shiftObj: shift };
        });
        
        return [
            ...shiftTools,
            { id: 'eraser' as ShiftTool, label: 'Gomma', Icon: EraserIcon, shiftObj: null },
        ];
    }, [workSettings.shifts]);
    
    const ShiftChip: React.FC<{shift: ShiftType, onRemove: () => void}> = ({ shift, onRemove }) => {
        const details = getShiftDetails(shift, workSettings.shifts);
        return (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${details?.bgColor} ${details?.textColor}`}>
                {details?.label}
                <button onClick={onRemove} className="bg-white/10 rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-white/30">&times;</button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl w-full max-w-5xl h-[90vh] flex flex-col animate-modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-500 dark:text-teal-400">Pianificatore Turni</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="bg-gray-200 dark:bg-slate-800 p-1 rounded-lg flex space-x-1">
                               <button onClick={() => setMode('painter')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'painter' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Pennello</button>
                               <button onClick={() => setMode('rotation')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'rotation' ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>Rotazione</button>
                            </div>
                            {statusMessage && (
                                <span className={`text-sm font-medium px-3 py-1 rounded-full animate-fade-in-up ${
                                    statusMessage.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                                    statusMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                }`}>
                                    {statusMessage.text}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="flex-grow flex gap-6 overflow-hidden">
                    {/* Tools/Rotation Panel */}
                    <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2">
                       {mode === 'painter' ? (
                            <>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Seleziona uno strumento e clicca sui giorni. Usa la "X" sul giorno per cancellare.</p>
                                {tools.map(tool => (
                                    <button key={tool.id} onClick={() => setSelectedTool(tool.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${selectedTool === tool.id ? 'bg-white dark:bg-slate-700 border-teal-500 shadow-md scale-102' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                        <tool.Icon className={`w-8 h-8 ${tool.shiftObj ? '' : 'text-red-400'}`} />
                                        <span className="text-md font-semibold text-slate-800 dark:text-white">{tool.label}</span>
                                        {selectedTool === tool.id && <div className="ml-auto w-2 h-2 bg-teal-500 rounded-full"></div>}
                                    </button>
                                ))}
                            </>
                       ) : (
                            <div className="flex flex-col gap-4 bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-sm uppercase tracking-wider">1. Pattern</h3>
                                        <select onChange={(e) => handleLoadRotation(e.target.value)} defaultValue="" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white mb-3 text-sm">
                                            <option value="" disabled>Carica pattern salvato...</option>
                                            {savedRotations.map(rot => <option key={rot.id} value={rot.id}>{rot.name}</option>)}
                                        </select>
                                        
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {workSettings.shifts.map(shift => (
                                                <button key={shift.id} onClick={() => setRotationPattern([...rotationPattern, shift.id])}
                                                    className={`px-2 py-1.5 rounded-md text-xs font-bold transition-colors border ${shift.bgColor} ${shift.textColor} border-transparent hover:border-current hover:opacity-80`}>
                                                    + {shift.name}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md min-h-[60px] max-h-32 overflow-y-auto flex flex-wrap gap-2 content-start">
                                            {rotationPattern.length > 0 ? rotationPattern.map((shift, index) => (
                                                <ShiftChip key={index} shift={shift} onRemove={() => setRotationPattern(rotationPattern.filter((_, i) => i !== index))} />
                                            )) : <p className="text-xs text-gray-400 dark:text-slate-500 w-full text-center py-2 italic">Il pattern è vuoto...</p>}
                                        </div>
                                        
                                        {rotationPattern.length > 0 && (
                                            <div className="mt-3 flex gap-2 items-center">
                                                 <input type="text" placeholder="Nome pattern..." value={newRotationName} onChange={e => setNewRotationName(e.target.value)} className="flex-grow bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs" />
                                                 <button onClick={handleSaveCurrentPattern} disabled={!newRotationName} className="p-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50" title="Salva Pattern">
                                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                     </svg>
                                                 </button>
                                                 <button onClick={() => setRotationPattern([])} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white" title="Pulisci">
                                                     <TrashIcon className="w-4 h-4" />
                                                 </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-sm uppercase tracking-wider">2. Periodo</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <label htmlFor="startDate" className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Da</label>
                                                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500" />
                                            </div>
                                            <div>
                                                <label htmlFor="endDate" className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">A</label>
                                                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                         <button onClick={handleApplyRotation} disabled={rotationPattern.length === 0 || !startDate || !endDate} className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition-all hover:-translate-y-0.5 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0">
                                             Applica
                                         </button>
                                    </div>
                                </div>
                            </div>
                       )}
                    </div>

                    {/* Calendar Panel */}
                    <div className="flex-grow flex flex-col bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-700">
                         <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                            <button onClick={() => setDisplayDate(addMonths(displayDate, -1))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white capitalize tracking-wide">{displayDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>
                            <button onClick={() => setDisplayDate(addMonths(displayDate, 1))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                         </div>
                         <div className="grid grid-cols-7 text-center bg-gray-100 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{d}</div>)}
                         </div>
                         <div className="grid grid-cols-7 grid-rows-6 flex-grow bg-gray-200 dark:bg-slate-700 gap-px border-b border-gray-200 dark:border-slate-700">
                            {monthMatrix.map((day, i) => {
                                const isCurrentMonth = day.getMonth() === month;
                                const dateKey = formatDateKey(day);
                                const shift = draftShifts[dateKey]?.shift;
                                const shiftDetails = shift ? getShiftDetails(shift, workSettings.shifts) : null;
                                const isLastPainted = lastPainted === dateKey;
                                
                                let dayClasses = 'relative p-1 flex flex-col items-center justify-center transition-all duration-150 group ';
                                if (!isCurrentMonth) {
                                    dayClasses += 'bg-gray-50/50 dark:bg-slate-800/30 text-gray-300 dark:text-slate-600';
                                } else {
                                    dayClasses += `${shiftDetails?.bgColor || 'bg-white dark:bg-slate-800'} text-slate-700 dark:text-slate-300 `;
                                    if (mode === 'painter') {
                                        dayClasses += `cursor-pointer hover:z-10 hover:ring-2 hover:ring-inset ${selectedTool === 'eraser' ? 'hover:ring-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:ring-teal-400'} `;
                                        // Custom cursor based on tool
                                        dayClasses += selectedTool === 'eraser' ? 'cursor-not-allowed' : 'cursor-cell';
                                    } else {
                                        dayClasses += 'cursor-default';
                                    }
                                }
                                
                                return (
                                    <div key={i} onClick={() => isCurrentMonth && handleDayClick(day)} className={dayClasses}>
                                         {isLastPainted && (
                                            <div className={`absolute inset-0 ring-4 ring-inset ${selectedTool === 'eraser' ? 'ring-red-500' : 'ring-teal-500'} animate-paint-feedback z-20 pointer-events-none`}></div>
                                         )}
                                         
                                         {/* Quick Delete Button (Only in Painter Mode, for existing shifts) */}
                                         {mode === 'painter' && isCurrentMonth && shift && (
                                             <button 
                                                onClick={(e) => handleSingleDayDelete(e, day)}
                                                className="absolute top-1 right-1 p-0.5 bg-red-100 dark:bg-red-900/80 text-red-600 dark:text-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:scale-110"
                                                title="Cancella turno"
                                             >
                                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                 </svg>
                                             </button>
                                         )}

                                         <span className={`text-sm font-bold mb-1 ${!isCurrentMonth ? 'opacity-50' : ''}`}>{day.getDate()}</span>
                                         
                                         {isCurrentMonth && shiftDetails && (
                                             <div className={`text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[90%] font-semibold ${shiftDetails.textColor} bg-white/50 dark:bg-black/20`}>
                                                 {shiftDetails.name}
                                             </div>
                                         )}
                                    </div>
                                )
                            })}
                         </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center flex-shrink-0 border-t border-gray-200 dark:border-slate-700 pt-4">
                    <div className="flex-grow">
                        {/* Auto-save message handled in top bar now, this space can be for hints or left empty */}
                    </div>
                    <div className="flex space-x-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold transition-colors">Chiudi</button>
                        <button onClick={() => onSave(draftShifts)} className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5">Salva Tutto</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualShiftPlannerModal;
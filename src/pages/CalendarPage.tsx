import React, { useState, useRef } from 'react';
import { AllTimeLogs, AllDayInfo, WorkSettings, CalendarView, LeaveType, StatusItem, AllManualOvertime, SavedRotation } from '../types';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import YearView from '../components/calendar/YearView';
// FIX: Corrected import path for Summary component.
import Summary from '../components/Summary';
import VisualShiftPlannerModal from '../components/calendar/VisualShiftPlannerModal';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import { formatDateKey, addDays } from '../utils/timeUtils';
import ExportCalendarModal from '../components/calendar/ExportCalendarModal';
import { generateICS } from '../utils/icsUtils';
import { generateCSV } from '../utils/csvUtils';
import { GoogleGenAI, Type } from "@google/genai";
import ImportStatusToast from '../components/ImportStatusToast';
import OnCallModal from '../components/modals/OnCallModal';

// Get Google API Key from environment - direct access to VITE_ prefixed variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

interface CalendarPageProps {
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    allManualOvertime: AllManualOvertime;
    workSettings: WorkSettings;
    statusItems: StatusItem[];
    savedRotations: SavedRotation[];
    onSetAllDayInfo: (allDayInfo: AllDayInfo) => void;
    onEditEntry: (dateKey: string, entryIndex: number, newTimestamp: Date, newType: 'in' | 'out') => void;
    onDeleteEntry: (dateKey: string, entryIndex: number) => void;
    onOpenAddEntryModal: (date: Date) => void;
    onOpenAddOvertimeModal: (date: Date) => void;
    onDeleteManualOvertime: (dateKey: string, entryId: string) => void;
    onImportData: (data: any) => void;
    onOpenQuickLeaveModal: (options: { date: Date; highlightedLeave?: LeaveType }) => void;
    onSetSavedRotations: (rotations: SavedRotation[]) => void;
    onOpenRangePlanner: (options: { startDate: Date }) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ allLogs, allDayInfo, allManualOvertime, workSettings, statusItems, savedRotations, onSetAllDayInfo, onEditEntry, onDeleteEntry, onOpenAddEntryModal, onOpenAddOvertimeModal, onDeleteManualOvertime, onImportData, onOpenQuickLeaveModal, onSetSavedRotations, onOpenRangePlanner }) => {
    const [view, setView] = useState<CalendarView>('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [displayDate, setDisplayDate] = useState(new Date());
    const [yearViewZoom, setYearViewZoom] = useState(3);
    const [isPlannerOpen, setPlannerOpen] = useState(false);
    const [isOnCallModalOpen, setOnCallModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' | '' }>({ message: '', type: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleExport = (startDateStr: string, endDateStr: string, format: 'ics' | 'csv') => {
        const [sY, sM, sD] = startDateStr.split('-').map(Number);
        const startDate = new Date(sY, sM - 1, sD);

        const [eY, eM, eD] = endDateStr.split('-').map(Number);
        const endDate = new Date(eY, eM - 1, eD, 23, 59, 59);

        let content = '';
        let fileExtension = '';
        let mimeType = '';

        if (format === 'ics') {
            content = generateICS(allLogs, allDayInfo, workSettings, startDate, endDate, statusItems);
            fileExtension = 'ics';
            mimeType = 'text/calendar;charset=utf-8';
        } else { // csv
            // FIX: Pass allManualOvertime to generateCSV to provide all required arguments.
            content = generateCSV(allLogs, allDayInfo, workSettings, startDate, endDate, statusItems, allManualOvertime);
            fileExtension = 'csv';
            mimeType = 'text/csv;charset=utf-8';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `TimecardPro_Export_${startDateStr}_${endDateStr}.${fileExtension}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setExportModalOpen(false);
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportStatus({ message: 'Caricamento e analisi del file in corso...', type: 'info' });

        const reader = new FileReader();

        // helper to convert ArrayBuffer to base64 safely for large files
        const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
            const bytes = new Uint8Array(buffer);
            const chunkSize = 0x8000; // 32KB chunks
            let binary = '';
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.subarray(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
            }
            return btoa(binary);
        };

        if (file.type === 'application/pdf') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsDataURL(file);
        }

        reader.onload = async () => {
            let base64Data: string;
            if (file.type === 'application/pdf') {
                const buffer = reader.result as ArrayBuffer;
                base64Data = arrayBufferToBase64(buffer);
            } else {
                base64Data = (reader.result as string).split(',')[1];
            }
            try {
                if (!GOOGLE_API_KEY) {
                    throw new Error("API_KEY_MISSING");
                }
                const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

                const schema = {
                    type: Type.OBJECT,
                    properties: {
                        days: {
                            type: Type.ARRAY,
                            description: 'Un array di oggetti, ciascuno rappresentante un singolo giorno del cartellino.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    date: { type: Type.STRING, description: 'La data in formato AAAA-MM-GG.' },
                                    day_type: { 
                                        type: Type.STRING, 
                                        description: 'Il tipo di giorno: "work" per giornate lavorative con timbrature, "leave" per ferie/permessi/malattia, "rest" per riposi/festivi, "absence" per assenze.' 
                                    },
                                    clock_in: { type: Type.STRING, description: 'Orario della prima timbratura di entrata in formato HH:MM (solo se day_type è "work").' },
                                    clock_out: { type: Type.STRING, description: 'Orario dell\'ultima timbratura di uscita in formato HH:MM (solo se day_type è "work").' },
                                    work_code: { type: Type.STRING, description: 'Codice LAV del turno se presente (es. "11" per mattina, "12" per pomeriggio, "13" per sera, "14" per notte, "1023" per riposo).' },
                                    leave_type: { 
                                        type: Type.STRING, 
                                        description: 'Se day_type è "leave", specifica il tipo: "holiday" (ferie), "sick" (malattia), "permit" (permessi), "parental" (parentale).' 
                                    },
                                    note: { type: Type.STRING, description: 'Note o descrizioni speciali per il giorno.' }
                                },
                                required: ['date', 'day_type']
                            }
                        }
                    },
                    required: ['days']
                };
                
                const prompt = `Dall'immagine del cartellino dettagliato fornita, estrai i dati per ogni giorno del mese. L'output deve essere un oggetto JSON che aderisce strettamente allo schema fornito.

**Istruzioni Imperative per l'Estrazione Corretta:**

1.  **Identifica Mese e Anno:** Trova il mese e l'anno nel documento (es. "OTTOBRE 2025") e usali per costruire una data completa in formato AAAA-MM-GG per ogni giorno.

2.  **Determina il Tipo di Giorno (day_type):**
    *   Se il giorno ha timbrature reali → day_type = "work"
    *   Se il giorno ha descrizioni come "FERIE", "PERMESSI" → day_type = "leave"
    *   Se il giorno ha "RIPOSO", "FESTIVO" → day_type = "rest"
    *   Se il giorno è vuoto/assenza → day_type = "absence"

3.  **Per Giorni Lavorativi (day_type = "work"):**
    *   Cerca colonne con intestazioni **"Timbrature"**, **"Entrata"**, **"Uscita"**, "E/U", "Entrata Effettiva", "Uscita Effettiva".
    *   Estrai la **prima entrata** e mettila in \`clock_in\` (formato HH:MM)
    *   Estrai l'**ultima uscita** e mettila in \`clock_out\` (formato HH:MM)
    *   Se trovi un codice LAV (es. "11", "12", "13", "14", "1023"), mettilo in \`work_code\`

4.  **Per Assenze/Permessi (day_type = "leave"):**
    *   Se trovi "FERIE" → leave_type = "holiday"
    *   Se trovi "MALATTIA" → leave_type = "sick"
    *   Se trovi "PERMESSI" o "PERMESSI LEGGE" → leave_type = "permit"
    *   Se trovi "PARENTALE" → leave_type = "parental"

5.  **Note Aggiuntive:**
    *   Metti nel campo \`note\` qualsiasi informazione extra trovata (es. "BLOCCO DEBITO", "ORDINARIO", "LAVORO AGILE")

6.  **Regole Importanti:**
    *   Ignora righe di riepilogo o totali
    *   Ignora orari programmati/teorici se sono presenti timbrature reali
    *   L'output finale deve essere un oggetto JSON valido con una chiave "days"`;

                // Retry logic for API overload (503 errors)
                const maxRetries = 3;
                const retryDelay = 2000; // 2 seconds
                
                const attemptGeneration = async (retryCount: number): Promise<any> => {
                    try {
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: {
                                parts: [
                                    { inlineData: { mimeType: file.type, data: base64Data } },
                                    { text: prompt }
                                ]
                            },
                            config: {
                                responseMimeType: "application/json",
                                responseSchema: schema,
                            },
                        });
                        return response;
                    } catch (error: any) {
                        const errorMsg = error.message || JSON.stringify(error);
                        const isOverloaded = errorMsg.includes('503') || 
                                           errorMsg.includes('overloaded') || 
                                           errorMsg.includes('UNAVAILABLE') ||
                                           errorMsg.includes('Model is overloaded');
                        
                        if (isOverloaded && retryCount < maxRetries) {
                            setImportStatus({ 
                                message: `Servizio AI temporaneamente sovraccarico. Tentativo ${retryCount + 1}/${maxRetries}... Attendi.`, 
                                type: 'info' 
                            });
                            await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
                            return attemptGeneration(retryCount + 1);
                        }
                        throw error;
                    }
                };

                const response = await attemptGeneration(0);
                
                if (!response.text || response.text.trim() === '') {
                    throw new Error("EmptyApiResponse");
                }

                let parsedData;
                try {
                    parsedData = JSON.parse(response.text);
                } catch (parseError) {
                    throw new Error("InvalidJsonResponse");
                }

                if (!parsedData || !Array.isArray(parsedData.days)) {
                    throw new Error("InvalidDataStructure");
                }

                onImportData(parsedData.days);
                setImportStatus({ message: 'Importazione completata con successo!', type: 'success' });
            } catch (error) {
                console.error("Errore durante l'importazione del cartellino:", error);
                let errorMessage = "Si è verificato un errore imprevisto. Riprova.";

                if (error instanceof SyntaxError) {
                    errorMessage = "L'analisi ha prodotto un risultato non valido. L'immagine potrebbe non essere chiara o il formato non è riconosciuto.";
                } else if (error instanceof Error) {
                    const errorMsg = error.message || '';
                    const isOverloaded = errorMsg.includes('503') || 
                                       errorMsg.includes('overloaded') || 
                                       errorMsg.includes('UNAVAILABLE') ||
                                       errorMsg.includes('Model is overloaded');
                    
                    if (isOverloaded) {
                        errorMessage = "⚠️ Il servizio AI di Google è temporaneamente sovraccarico. Riprova tra qualche minuto. Se il problema persiste, carica il file in un momento di minor traffico.";
                    } else {
                        switch(error.message) {
                            case "EmptyApiResponse":
                                errorMessage = "Il servizio di analisi non ha fornito una risposta. Riprova con un'immagine diversa.";
                                break;
                            case "InvalidJsonResponse":
                                errorMessage = "La risposta del servizio non è valida. Controlla la console (F12) per dettagli e riprova.";
                                break;
                            case "InvalidDataStructure":
                                errorMessage = "I dati estratti dal file non hanno la struttura corretta. Prova un'immagine più chiara.";
                                break;
                            case "API_KEY_MISSING":
                                errorMessage = "Chiave API Google non configurata. Aggiungi VITE_GOOGLE_API_KEY a .env.local";
                                break;
                            default:
                                if (error.message.toLowerCase().includes('fetch')) {
                                    errorMessage = "Errore di rete. Controlla la connessione e riprova.";
                                } else {
                                    errorMessage = `Errore: ${error.message}`;
                                }
                                break;
                        }
                    }
                }
                setImportStatus({ message: errorMessage, type: 'error' });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.onerror = () => {
            setIsImporting(false);
            setImportStatus({ message: 'Impossibile leggere il file.', type: 'error' });
             if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
    };

    const selectedDateKey = formatDateKey(selectedDate);
    const manualOvertimeForSelectedDate = allManualOvertime[selectedDateKey] || [];

    const renderView = () => {
        switch (view) {
            case 'day':
                 return <DayView 
                    allLogs={allLogs} 
                    allDayInfo={allDayInfo} 
                    selectedDate={selectedDate} 
                    statusItems={statusItems} 
                    activeFilter={activeFilter} 
                    workSettings={workSettings}
                    manualOvertimeEntries={manualOvertimeForSelectedDate}
                />;
            case 'week':
                // FIX: Pass workSettings prop to WeekView.
                return <WeekView allLogs={allLogs} allDayInfo={allDayInfo} selectedDate={selectedDate} displayDate={displayDate} workSettings={workSettings} onDateSelect={setSelectedDate} activeFilter={activeFilter} />;
            case 'month':
                return <MonthView 
                            allLogs={allLogs} 
                            allDayInfo={allDayInfo} 
                            selectedDate={selectedDate} 
                            displayDate={displayDate} 
                            statusItems={statusItems} 
                            // FIX: Pass workSettings prop to MonthView.
                            workSettings={workSettings}
                            onDateSelect={setSelectedDate} 
                            onOpenRangePlanner={onOpenRangePlanner}
                            activeFilter={activeFilter}
                            onOpenQuickLeaveModal={onOpenQuickLeaveModal} 
                        />;
            case 'year':
                return <YearView allLogs={allLogs} allDayInfo={allDayInfo} workSettings={workSettings} selectedDate={selectedDate} displayDate={displayDate} zoomLevel={yearViewZoom} onDateSelect={setSelectedDate} onZoomIn={() => setYearViewZoom(z => Math.max(1, z-1))} onZoomOut={() => setYearViewZoom(z => Math.min(4, z+1))} statusItems={statusItems} activeFilter={activeFilter} />;
        }
    };

    const handleDateChange = (date: Date) => {
        setDisplayDate(date);
        setSelectedDate(date);
    }
    
    const handleToday = () => {
        const today = new Date();
        setDisplayDate(today);
        setSelectedDate(today);
    }
    
    const nextDay = addDays(selectedDate, 1);
    const nextDayKey = formatDateKey(nextDay);
    const nextDayInfo = allDayInfo[nextDayKey];

    return (
        <main className="flex flex-col lg:flex-row h-[calc(100vh-65px)] md:h-[calc(100vh-81px)]">
            {/* Allow images and PDFs for import */}
            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
            
            <div className="flex-grow flex flex-col overflow-hidden">
                <CalendarHeader 
                    view={view} 
                    displayDate={displayDate} 
                    onViewChange={setView} 
                    onDateChange={handleDateChange} 
                    onToday={handleToday}
                    onOpenExportModal={() => setExportModalOpen(true)}
                    onOpenImportModal={() => fileInputRef.current?.click()}
                    isImporting={isImporting}
                    statusItems={statusItems}
                    workSettings={workSettings}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                    isSidebarOpen={isSidebarOpen}
                />
                <div className="flex-grow relative overflow-auto">
                    {renderView()}
                    <ImportStatusToast
                        message={importStatus.message}
                        type={importStatus.type}
                        onDismiss={() => setImportStatus({ message: '', type: '' })}
                    />
                </div>
            </div>
            
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-96 flex-shrink-0 border-l border-gray-200 dark:border-slate-700/50 p-4 lg:p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900/50 flex-col">
                <div className="flex justify-end mb-4 gap-2">
                    <button onClick={() => setOnCallModalOpen(true)} className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95">
                      Reperibilità
                    </button>
                    <button onClick={() => setPlannerOpen(true)} className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95">
                      Pianificatore
                    </button>
                </div>
                <Summary
                    date={selectedDate}
                    entries={allLogs[selectedDateKey] || []}
                    dayInfo={allDayInfo[selectedDateKey]}
                    nextDayInfo={nextDayInfo}
                    workSettings={workSettings}
                    statusItems={statusItems}
                    manualOvertimeEntries={manualOvertimeForSelectedDate}
                    onEditEntry={onEditEntry}
                    onDeleteEntry={onDeleteEntry}
                    onOpenAddEntryModal={onOpenAddEntryModal}
                    onOpenAddManualEntryModal={() => {}}
                    onDeleteManualOvertime={onDeleteManualOvertime}
                    onOpenAddOvertimeModal={() => onOpenAddOvertimeModal(selectedDate)}
                    onOpenQuickLeaveModal={(date) => onOpenQuickLeaveModal({ date })}
                />
            </aside>

            {/* Mobile Sidebar Drawer */}
            {isSidebarOpen && (
                <>
                    <div 
                        className="lg:hidden fixed inset-0 bg-black/50 z-40" 
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dettagli Giorno</h3>
                            <button 
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Chiudi"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-col gap-2 mb-4">
                                <button onClick={() => { setOnCallModalOpen(true); setIsSidebarOpen(false); }} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95">
                                  Gestisci Reperibilità
                                </button>
                                <button onClick={() => { setPlannerOpen(true); setIsSidebarOpen(false); }} className="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95">
                                  Apri Pianificatore
                                </button>
                            </div>
                            <Summary
                                date={selectedDate}
                                entries={allLogs[selectedDateKey] || []}
                                dayInfo={allDayInfo[selectedDateKey]}
                                nextDayInfo={nextDayInfo}
                                workSettings={workSettings}
                                statusItems={statusItems}
                                manualOvertimeEntries={manualOvertimeForSelectedDate}
                                onEditEntry={onEditEntry}
                                onDeleteEntry={onDeleteEntry}
                                onOpenAddEntryModal={onOpenAddEntryModal}
                                onOpenAddManualEntryModal={() => {}}
                                onDeleteManualOvertime={onDeleteManualOvertime}
                                onOpenAddOvertimeModal={() => onOpenAddOvertimeModal(selectedDate)}
                                onOpenQuickLeaveModal={(date) => onOpenQuickLeaveModal({ date })}
                            />
                        </div>
                    </aside>
                </>
            )}
            {isPlannerOpen && (
                <VisualShiftPlannerModal 
                    initialDayInfo={allDayInfo}
                    savedRotations={savedRotations}
                    onClose={() => setPlannerOpen(false)}
                    onSave={(newShifts) => {
                        onSetAllDayInfo(newShifts);
                        setPlannerOpen(false);
                    }}
                    onSetSavedRotations={onSetSavedRotations}
                    // FIX: Pass workSettings prop to VisualShiftPlannerModal.
                    workSettings={workSettings}
                />
            )}
            {isOnCallModalOpen && (
                <OnCallModal
                    initialDayInfo={allDayInfo}
                    onClose={() => setOnCallModalOpen(false)}
                    onSave={(newDayInfo) => {
                        onSetAllDayInfo(newDayInfo);
                        setOnCallModalOpen(false);
                    }}
                />
            )}
            <ExportCalendarModal
                visible={isExportModalOpen}
                initialDate={displayDate}
                onClose={() => setExportModalOpen(false)}
                onExport={handleExport}
            />
        </main>
    );
};

export default CalendarPage;

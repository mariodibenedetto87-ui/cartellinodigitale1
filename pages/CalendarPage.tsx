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
    const [isOnCallModalOpen, setOnCallModalOpen] = useState(true);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' | '' }>({ message: '', type: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    
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
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
                                    entries: {
                                        type: Type.ARRAY,
                                        description: 'Una lista di eventi di timbratura per il giorno.',
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                time: { type: Type.STRING, description: 'L\'ora dell\'evento in formato HH:MM.' },
                                                type: { type: Type.STRING, description: 'Il tipo di evento, "in" o "out".' }
                                            },
                                            required: ['time', 'type']
                                        }
                                    },
                                    note: { type: Type.STRING, description: 'Qualsiasi testo speciale o nota associata al giorno.' }
                                },
                                required: ['date', 'entries', 'note']
                            }
                        }
                    },
                    required: ['days']
                };
                
                const prompt = `Dall'immagine del cartellino dettagliato fornita, estrai i dati per ogni giorno del mese. L'output deve essere un oggetto JSON che aderisce strettamente allo schema fornito.

**Istruzioni Imperative per l'Estrazione Corretta:**

1.  **Identifica Mese e Anno:** Trova il mese e l'anno nel documento (es. "OTTOBRE 2025") e usali per costruire una data completa in formato AAAA-MM-GG per ogni giorno.

2.  **PRIORITÀ ASSOLUTA: Distingui tra Orario Programmato e Timbrature Reali.**
    *   **Orario Programmato (DA IGNORARE SE POSSIBILE):** Colonne con intestazioni come "Orario", "Turno", "Dalle", "Alle" contengono l'orario di lavoro *teorico* (es. 08:00-14:00). **NON devi usare questi dati** se sono presenti le timbrature reali.
    *   **Timbrature Reali (DA USARE SEMPRE):** Cerca con la massima priorità colonne con intestazioni come **"Timbrature"**, **"Entrata"**, **"Uscita"**, "E/U", "Ent./Usc.", "Entrata Effettiva", "Uscita Effettiva". Queste contengono gli orari in cui la persona ha effettivamente timbrato.

3.  **Processa le Timbrature Reali per Ogni Giorno:**
    *   Un giorno può avere più coppie di timbrature (es. per la pausa pranzo). Estrai **TUTTE** le timbrature presenti, non solo la prima e l'ultima.
    *   Per ogni orario trovato sotto "Entrata", crea una timbratura di tipo \`'in'\`.
    *   Per ogni orario trovato sotto "Uscita", crea una timbratura di tipo \`'out'\`.
    *   **CASO LIMITE (FALLBACK):** Se, e **SOLO SE**, per un giorno non esistono assolutamente colonne o dati di timbratura reale, allora puoi usare gli orari dalle colonne "Dalle"/"Alle". In questo caso, crea una timbratura \`'in'\` per "Dalle" e una \`'out'\` per "Alle".

4.  **Gestisci Assenze e Note:**
    *   Se per un giorno non ci sono timbrature ma una descrizione come "FERIE", "RIPOSO", "PERMESSI LEGGE", "MALATTIA", "FESTIVO", allora l'array \`entries\` deve rimanere **VUOTO**.
    *   Popola il campo \`note\` con la descrizione trovata (es. "FERIE").
    *   Se un giorno ha sia timbrature che una nota (es. "Lavoro Agile"), estrai entrambe.

5.  **Regole di Formattazione e Esclusione:**
    *   Ignora completamente le righe di riepilogo o totali.
    *   Se trovi un intervallo di tempo come "08-14" in una singola cella nella colonna del turno/orario, **NON** devi interpretarlo come due timbrature separate. Ignoralo se sono presenti timbrature reali.
    *   L'output finale deve essere un oggetto JSON valido con una chiave "days", che contiene l'array di tutti i giorni processati, seguendo scrupolosamente lo schema.`;

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
                
                if (!response.text || response.text.trim() === '') {
                    throw new Error("EmptyApiResponse");
                }

                const parsedData = JSON.parse(response.text);

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
                    switch(error.message) {
                        case "EmptyApiResponse":
                            errorMessage = "Il servizio di analisi non ha fornito una risposta. Riprova con un'immagine diversa.";
                            break;
                        case "InvalidDataStructure":
                            errorMessage = "I dati estratti dal file non hanno la struttura corretta. Prova un'immagine più chiara.";
                            break;
                        default:
                            if (error.message.toLowerCase().includes('fetch')) {
                                errorMessage = "Errore di rete. Controlla la connessione e riprova.";
                            } else {
                                errorMessage = "Errore durante l'analisi del file. Riprova.";
                            }
                            break;
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
        <main className="flex h-[calc(100vh-81px)]">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
            <div className="flex-grow flex flex-col overflow-y-auto">
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
                    // FIX: Pass workSettings prop to CalendarHeader.
                    workSettings={workSettings}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
                <div className="flex-grow relative">
                    {renderView()}
                    <ImportStatusToast
                        message={importStatus.message}
                        type={importStatus.type}
                        onDismiss={() => setImportStatus({ message: '', type: '' })}
                    />
                </div>
            </div>
            <aside className="w-96 flex-shrink-0 border-l border-gray-200 dark:border-slate-700/50 p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
                <div className="flex justify-end mb-4 gap-2">
                    <button onClick={() => setOnCallModalOpen(true)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95">
                      Gestisci Reperibilità
                    </button>
                    <button onClick={() => setPlannerOpen(true)} className="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95">
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
                    onOpenAddOvertimeModal={onOpenAddOvertimeModal}
                    onDeleteManualOvertime={onDeleteManualOvertime}
                    onOpenQuickLeaveModal={(date) => onOpenQuickLeaveModal({ date })}
                />
            </aside>
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
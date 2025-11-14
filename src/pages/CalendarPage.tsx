import React, { useState, useRef } from 'react';
import { AllTimeLogs, AllDayInfo, WorkSettings, CalendarView, LeaveType, StatusItem, AllManualOvertime, SavedRotation } from '../types';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import YearView from '../components/calendar/YearView';
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
    onOpenAddManualEntryModal: (date: Date) => void;
    onDeleteManualOvertime: (dateKey: string, entryId: string) => void;
    onImportData: (data: any[]) => void;
    onOpenQuickLeaveModal: (options: { date: Date; highlightedLeave?: LeaveType }) => void;
    onSetSavedRotations: (rotations: SavedRotation[]) => void;
    onOpenRangePlanner: (options: { startDate: Date }) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ allLogs, allDayInfo, allManualOvertime, workSettings, statusItems, savedRotations, onSetAllDayInfo, onEditEntry, onDeleteEntry, onOpenAddEntryModal, onOpenAddManualEntryModal, onDeleteManualOvertime, onImportData, onOpenQuickLeaveModal, onSetSavedRotations, onOpenRangePlanner }) => {
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
                            description: "Un array di oggetti, ciascuno rappresentante un singolo giorno analizzato dal cartellino.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    date: { type: Type.STRING, description: "La data in formato AAAA-MM-GG." },
                                    day_type: { type: Type.STRING, description: "Il tipo di giorno: 'work' per un giorno lavorativo (anche se non timbrato ma con codice turno), 'absence' per un'assenza." },
                                    
                                    // Workday fields
                                    work_code: { type: Type.STRING, description: "IMPORTANTE: Il codice turno presente nella colonna LAV (es. '11', '12', '13', '14'). Estrai SEMPRE questo valore se presente." },
                                    clock_in: { type: Type.STRING, description: "Orario della prima timbratura di entrata (HH:MM). Null se assenza." },
                                    clock_out: { type: Type.STRING, description: "Orario dell'ultima timbratura di uscita (HH:MM). Null se assenza." },
                                    ordinary_hours: { type: Type.STRING, description: "Ore ordinarie lavorate (HH:MM). Null se assenza." },
                                    overtime_hours: { type: Type.STRING, description: "Ore di straordinario (HH:MM). Null se non presenti." },
                                    overtime_type: { type: Type.STRING, description: "Tipo di straordinario, 'PAG' o 'ACC'. Null se non presenti." },
                                    total_hours: { type: Type.STRING, description: "Ore totali lavorate (T.O.). Null se assenza." },
                                    balance: { type: Type.STRING, description: "Saldo ore giornaliero (+/-HH:MM). Null se assenza." },
                                    notes: { type: Type.STRING, description: "Note aggiuntive, specialmente per straordinari o recuperi. Null se non presenti." },
                                    
                                    // Absence fields
                                    absence_type: { type: Type.STRING, description: "Descrizione dell'assenza, es. 'FERIE ANNO CORRENTE'. Null se giorno lavorativo." },
                                    status_code: { type: Type.STRING, description: "Codice numerico dello status di assenza. Null se giorno lavorativo." },
                                    credited_hours: { type: Type.STRING, description: "Ore accreditate per l'assenza (HH:MM). Null se giorno lavorativo." },
                                }
                            }
                        }
                    },
                    required: ['days']
                };
                
                const prompt = `Sei un assistente AI specializzato nell'analisi di cartellini presenze del settore pubblico italiano. Il tuo compito è estrarre dati da un'immagine di un cartellino e strutturarli in un formato JSON preciso, seguendo scrupolosamente lo schema fornito e le istruzioni dettagliate.

**ISTRUZIONI COMPLETE PER ANALISI CARTELLINO PRESENZE ANNUALE**

**CONTESTO DEL DOCUMENTO**
- Colonne principali: Data | LAV | Dov. | Entr. | Usc. ... | T.O.

**1. STRUTTURA DATI DEL CARTELLINO**
A) Formato Giornaliero
Ogni riga rappresenta un giorno. La colonna "LAV" (Lavoro) è fondamentale.

B) Codici Turno (Colonna LAV) - **DA ESTRARRE SEMPRE**
- 11: Turno Mattutino (08:00-14:00)
- 12: Turno Pomeridiano (14:00-20:00)
- 13: Turno Serale (16:00-22:00)
- 14: Turno Notturno (21:00-03:00)
- 10: Assenza Giustificata
- 1023: Riposo Recupero

**2. LOGICA DI ESTRAZIONE**

**PRIORITÀ ASSOLUTA: COLONNA LAV (work_code)**
Per ogni riga, guarda la colonna "LAV". Se c'è un numero (es. 11, 12, 13, 14), devi estrarlo nel campo \`work_code\`. Questo definisce il turno pianificato, ANCHE SE non ci sono timbrature di entrata/uscita.

- **CASO 1: Giorno Lavorativo (Con Timbrature)**
  Esempio: "11 - 07:59 14:00"
  -> \`day_type: 'work'\`, \`work_code: '11'\`, \`clock_in: '07:59'\`, \`clock_out: '14:00'\`.

- **CASO 2: Turno Pianificato (Senza Timbrature)**
  Se nella colonna LAV c'è "11", "12", "13" o "14" ma le colonne Entr./Usc. sono vuote:
  -> \`day_type: 'work'\` (importante per assegnare il turno), \`work_code: '11'\`, \`clock_in: null\`, \`clock_out: null\`.

- **CASO 3: Assenza**
  Se LAV è "10" o c'è una descrizione di assenza (FERIE, MALATTIA):
  -> \`day_type: 'absence'\`, \`absence_type: '...' \`.

- **CASO 4: Straordinari**
  Se sono presenti ore extra o note come "*Straordinario", estrai \`overtime_hours\` e \`notes\`.

**TASK FINALE:**
Analizza l'immagine. Per ogni giorno, crea un oggetto JSON. Assicurati di catturare il **codice turno (LAV)** in \`work_code\` per tutti i giorni in cui è presente, indipendentemente dalle timbrature. Ritorna un oggetto JSON con chiave 'days'.`;

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
                return <WeekView allLogs={allLogs} allDayInfo={allDayInfo} selectedDate={selectedDate} displayDate={displayDate} workSettings={workSettings} onDateSelect={setSelectedDate} activeFilter={activeFilter} />;
            case 'month':
                return <MonthView 
                            allLogs={allLogs} 
                            allDayInfo={allDayInfo} 
                            selectedDate={selectedDate} 
                            displayDate={displayDate} 
                            statusItems={statusItems} 
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
            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
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
                    onOpenAddManualEntryModal={onOpenAddManualEntryModal}
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
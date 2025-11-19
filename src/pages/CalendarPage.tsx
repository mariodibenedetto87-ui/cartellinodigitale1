import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AllTimeLogs, AllDayInfo, WorkSettings, CalendarView, LeaveType, StatusItem, AllManualOvertime, SavedRotation } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useAppLogic } from '../hooks/useAppLogic';
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
import DayEventsModal from '../components/modals/DayEventsModal';

// Get Google API Key from environment - direct access to VITE_ prefixed variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Props opzionali - retrocompatibile con Context API
interface CalendarPageProps {
    allLogs?: AllTimeLogs;
    allDayInfo?: AllDayInfo;
    allManualOvertime?: AllManualOvertime;
    workSettings?: WorkSettings;
    statusItems?: StatusItem[];
    savedRotations?: SavedRotation[];
    onSetAllDayInfo?: (newAllDayInfo: AllDayInfo) => Promise<void>;
    onEditEntry?: (dateKey: string, entryId: string, newTimestamp: Date, newType: 'in' | 'out') => void;
    onDeleteEntry?: (dateKey: string, entryId: string) => void;
    onOpenAddEntryModal?: (date: Date) => void;
    onOpenAddOvertimeModal?: (date: Date) => void;
    onOpenHoursMissingModal?: (date: Date) => void;
    onDeleteManualOvertime?: (dateKey: string, entryId: string) => void;
    onImportData?: (data: any) => void;
    onOpenQuickLeaveModal?: (options: { date: Date; highlightedLeave?: LeaveType }) => void;
    onSetSavedRotations?: (rotations: SavedRotation[]) => void;
    onOpenRangePlanner?: (options: { startDate: Date }) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = (props) => {
    // Context API fallback
    const context = useAppContext();
    const logic = useAppLogic();
    
    // Usa props se fornite, altrimenti Context
    const allLogs = props.allLogs ?? context.allLogs;
    const allDayInfo = props.allDayInfo ?? context.allDayInfo;
    const allManualOvertime = props.allManualOvertime ?? context.allManualOvertime;
    const workSettings = props.workSettings ?? context.settings.workSettings;
    const statusItems = props.statusItems ?? context.settings.statusItems;
    const savedRotations = props.savedRotations ?? context.settings.savedRotations;
    
    // Handlers: props o logic hook
    const onSetAllDayInfo = props.onSetAllDayInfo ?? logic.handleSetAllDayInfo;
    const onEditEntry = props.onEditEntry ?? logic.handleEditEntry;
    const onDeleteEntry = props.onDeleteEntry ?? logic.handleDeleteEntry;
    const onDeleteManualOvertime = props.onDeleteManualOvertime ?? logic.handleDeleteManualOvertime;
    const onSetSavedRotations = props.onSetSavedRotations ?? ((r: SavedRotation[]) => {
        context.setSettings(s => ({ ...s, savedRotations: r }));
    });
    
    // Modal handlers - restano gestiti da App.tsx per ora
    const onOpenAddEntryModal = props.onOpenAddEntryModal ?? (() => {});
    const onOpenAddOvertimeModal = props.onOpenAddOvertimeModal ?? (() => {});
    const onOpenHoursMissingModal = props.onOpenHoursMissingModal ?? (() => {});
    const onImportData = props.onImportData ?? (() => {});
    const onOpenQuickLeaveModal = props.onOpenQuickLeaveModal ?? (() => {});
    const onOpenRangePlanner = props.onOpenRangePlanner ?? (() => {});
    
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
    const [summaryRenderKey, setSummaryRenderKey] = useState(0);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDayEventsModalOpen, setDayEventsModalOpen] = useState(false);
    const [eventsModalDate, setEventsModalDate] = useState<Date>(new Date());

    // Force Summary re-render when allLogs changes
    useEffect(() => {
        setSummaryRenderKey(prev => prev + 1);
        
        // Alert per debug
        const totalEntries = Object.values(allLogs).reduce((sum, entries) => sum + entries.length, 0);
        console.log('🔔 allLogs changed!', {
            totalDays: Object.keys(allLogs).length,
            totalEntries: totalEntries,
            days: Object.keys(allLogs)
        });
    }, [allLogs]);

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
                                    timestamps: { 
                                        type: Type.ARRAY, 
                                        description: 'Array di TUTTE le timbrature del giorno in ordine cronologico. Ogni elemento è un oggetto con time (HH:MM) e type ("in" o "out"). Esempio: [{"time":"08:15","type":"in"},{"time":"12:30","type":"out"},{"time":"13:15","type":"in"},{"time":"17:45","type":"out"}]',
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                time: { type: Type.STRING, description: 'Orario timbratura formato HH:MM' },
                                                type: { type: Type.STRING, description: '"in" per entrata, "out" per uscita' }
                                            },
                                            required: ['time', 'type']
                                        }
                                    },
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

1.  **Identifica Mese e Anno:** 
    Trova il mese e l'anno nel documento (es. "MARZO 2025", "GENNAIO 2025") e usali per costruire date complete in formato AAAA-MM-GG.
    - Esempio: se trovi "MARZO 2025" e giorno "15" → data = "2025-03-15"
    - Attenzione: usa il mese corretto (01-12) non il nome

2.  **Determina il Tipo di Giorno (day_type):**
    *   Timbrature reali presenti (orari tipo 08:30, 17:15) → day_type = "work"
    *   Scritte "FERIE", "FER", "PERMESSI", "PERM" → day_type = "leave"
    *   Scritte "RIPOSO", "RIP", "FESTIVO", "FEST" → day_type = "rest"
    *   Riga completamente vuota o trattini → day_type = "absence"

3.  **Per Giorni Lavorativi (day_type = "work"):**
    *   **PRIORITÀ TIMBRATURE REALI**: Cerca colonne "Timbrature", "Entrata Effettiva", "Uscita Effettiva", "E/U"
    *   **IGNORA** colonne "Orario Programmato", "Teorico", "Previsto"
    *   **ESTRAI TUTTE LE TIMBRATURE** in ordine cronologico nel campo timestamps
    *   Ogni timbratura deve avere: time (formato HH:MM) e type ("in" o "out")
    *   **Esempio con pausa pranzo**: 
        - Timbrature trovate: 08:15 (E), 12:30 (U), 13:15 (E), 17:45 (U)
        - Output timestamps: [{"time":"08:15","type":"in"},{"time":"12:30","type":"out"},{"time":"13:15","type":"in"},{"time":"17:45","type":"out"}]
    *   **Validazione**: timbrature alternate (in→out→in→out), orari crescenti, tra 00:00 e 23:59
    *   Codici LAV comuni: "11" (mattina), "12" (pomeriggio), "13" (sera), "14" (notte), "1023" (riposo)

4.  **Per Assenze/Permessi (day_type = "leave"):**
    *   "FERIE", "FER" → leave_type = "holiday"
    *   "MALATTIA", "MAL" → leave_type = "sick"
    *   "PERMESSI", "PERM", "PERMESSI LEGGE", "104" → leave_type = "permit"
    *   "PARENTALE", "MATERNITÀ", "PATERNITÀ" → leave_type = "parental"

5.  **Note Aggiuntive:**
    *   Estrai informazioni extra: "BLOCCO DEBITO", "ORDINARIO", "LAVORO AGILE", "SMART WORKING", "STRAORDINARIO"
    *   Se trovi ore lavorate o saldo, aggiungile alle note

6.  **Esempi Concreti:**
    
    Esempio 1 - Giorno lavorativo con pausa:
    Riga cartellino: "15 | Lun | 08:15 | 12:30 | 13:15 | 17:45 | LAV 11 | 8.00h"
    Output: { 
        date: "2025-03-15", 
        day_type: "work", 
        timestamps: [
            {"time":"08:15","type":"in"},
            {"time":"12:30","type":"out"},
            {"time":"13:15","type":"in"},
            {"time":"17:45","type":"out"}
        ],
        work_code: "11",
        note: "L'app calcolerà automaticamente il buono pasto (8.25h con pausa 45min = Eligibile)"
    }
    
    Esempio 2 - Ferie:
    Riga cartellino: "20 | Sab | FERIE | - | - | - |"
    Output: { date: "2025-03-20", day_type: "leave", leave_type: "holiday" }
    
    Esempio 3 - Riposo:
    Riga cartellino: "22 | Lun | RIPOSO | LAV 1023 | - |"
    Output: { date: "2025-03-22", day_type: "rest", work_code: "1023" }

7.  **Regole Critiche:**
    *   ❌ IGNORA righe "TOTALE", "SALDO", "RIEPILOGO"
    *   ❌ IGNORA orari teorici/programmati se ci sono timbrature reali
    *   ❌ NON inventare dati mancanti
    *   ✅ Estrai SOLO giorni con almeno una data valida
    *   ✅ Formato orario SEMPRE HH:MM (es. "08:00" non "8:00")
    *   ✅ Timbrature in ordine cronologico crescente
    *   ✅ Se incerti, day_type = "absence" e aggiungi nota con dubbio`;

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

                // Validazione e correzione automatica dei dati
                const validatedDays = parsedData.days
                    .filter((day: any) => {
                        // Rimuovi righe senza data valida
                        if (!day.date || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
                            console.warn('Data non valida ignorata:', day);
                            return false;
                        }
                        return true;
                    })
                    .map((day: any) => {
                        const validated = { ...day };

                        // Valida e correggi timestamps array
                        if (validated.timestamps && Array.isArray(validated.timestamps)) {
                            validated.timestamps = validated.timestamps
                                .map((ts: any) => {
                                    if (!ts.time || !ts.type) return null;
                                    
                                    // Correggi formato orario (es. "8:30" → "08:30")
                                    let time = ts.time;
                                    if (/^\d{1}:\d{2}$/.test(time)) {
                                        time = '0' + time;
                                    }
                                    
                                    return { time, type: ts.type };
                                })
                                .filter((ts: any) => ts !== null);
                            
                            // Valida ordine cronologico
                            let lastMinutes = -1;
                            let hasError = false;
                            for (const ts of validated.timestamps) {
                                const [h, m] = ts.time.split(':').map(Number);
                                const minutes = h * 60 + m;
                                if (minutes <= lastMinutes) {
                                    hasError = true;
                                    break;
                                }
                                lastMinutes = minutes;
                            }
                            
                            if (hasError) {
                                console.warn(`Timbrature non in ordine cronologico per ${validated.date}`);
                                validated.note = (validated.note || '') + ' [Verifica ordine timbrature]';
                            }
                        }

                        // Normalizza work_code (rimuovi spazi)
                        if (validated.work_code) {
                            validated.work_code = validated.work_code.toString().trim();
                        }

                        // Normalizza leave_type
                        if (validated.leave_type) {
                            const leaveMap: Record<string, string> = {
                                'ferie': 'holiday',
                                'fer': 'holiday',
                                'malattia': 'sick',
                                'mal': 'sick',
                                'permesso': 'permit',
                                'permessi': 'permit',
                                'perm': 'permit',
                                '104': 'permit'
                            };
                            const normalized = leaveMap[validated.leave_type.toLowerCase()];
                            if (normalized) validated.leave_type = normalized;
                        }

                        return validated;
                    });

                const skippedCount = parsedData.days.length - validatedDays.length;
                const warningMsg = skippedCount > 0 
                    ? ` (${skippedCount} righe ignorate per dati non validi)` 
                    : '';

                onImportData(validatedDays);
                setImportStatus({ 
                    message: `Importazione completata! ${validatedDays.length} giorni importati${warningMsg}`, 
                    type: 'success' 
                });
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
    
    // Forza un nuovo array reference per far rilevare il cambio a React
    const entriesForSelectedDate = useMemo(() => {
        const entries = [...(allLogs[selectedDateKey] || [])];
        console.log('📅 CalendarPage - entriesForSelectedDate:', {
            selectedDateKey,
            allLogsKeys: Object.keys(allLogs),
            entriesCount: entries.length,
            entries: entries.map(e => ({ id: e.id, type: e.type, time: new Date(e.timestamp).toLocaleTimeString() }))
        });
        return entries;
    }, [allLogs, selectedDateKey]);

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
                return <WeekView allLogs={allLogs} allDayInfo={allDayInfo} selectedDate={selectedDate} displayDate={displayDate} workSettings={workSettings} statusItems={statusItems} onDateSelect={setSelectedDate} activeFilter={activeFilter} />;
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
                <div className="flex justify-end mb-4 gap-2 flex-wrap">
                    <button 
                        onClick={() => {
                            setEventsModalDate(selectedDate);
                            setDayEventsModalOpen(true);
                        }} 
                        className="text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95 flex items-center gap-1"
                        title="Gestisci eventi multipli"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Eventi
                    </button>
                    <button onClick={() => setOnCallModalOpen(true)} className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95">
                      Reperibilità
                    </button>
                    <button onClick={() => setPlannerOpen(true)} className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95">
                      Pianificatore
                    </button>
                </div>
                <Summary
                    key={`summary-desktop-${selectedDateKey}-${summaryRenderKey}`}
                    date={selectedDate}
                    entries={entriesForSelectedDate}
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
                    onOpenHoursMissingModal={() => onOpenHoursMissingModal(selectedDate)}
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
                                <button 
                                    onClick={() => { 
                                        setEventsModalDate(selectedDate);
                                        setDayEventsModalOpen(true); 
                                        setIsSidebarOpen(false); 
                                    }} 
                                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Gestisci Eventi
                                </button>
                                <button onClick={() => { setOnCallModalOpen(true); setIsSidebarOpen(false); }} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95">
                                  Gestisci Reperibilità
                                </button>
                                <button onClick={() => { setPlannerOpen(true); setIsSidebarOpen(false); }} className="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95">
                                  Apri Pianificatore
                                </button>
                            </div>
                            <Summary
                                key={`summary-mobile-${selectedDateKey}-${summaryRenderKey}`}
                                date={selectedDate}
                                entries={entriesForSelectedDate}
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
                            onOpenHoursMissingModal={() => onOpenHoursMissingModal(selectedDate)}
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
            {isDayEventsModalOpen && (
                <DayEventsModal
                    date={eventsModalDate}
                    dayInfo={allDayInfo[formatDateKey(eventsModalDate)]}
                    statusItems={statusItems}
                    shifts={workSettings.shifts}
                    onSave={(date, events) => {
                        const dateKey = formatDateKey(date);
                        const updatedDayInfo = {
                            ...allDayInfo,
                            [dateKey]: {
                                ...allDayInfo[dateKey],
                                events: events,
                            }
                        };
                        onSetAllDayInfo(updatedDayInfo);
                        setDayEventsModalOpen(false);
                    }}
                    onClose={() => setDayEventsModalOpen(false)}
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

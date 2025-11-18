import React, { useState, useEffect, useRef } from 'react';
import { CalendarView, StatusItem, WorkSettings } from '../../types';
import { addDays, addMonths, addYears } from '../../utils/timeUtils';
import CalendarFilter from './CalendarFilter';

interface CalendarHeaderProps {
  view: CalendarView;
  displayDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  isImporting: boolean;
  statusItems: StatusItem[];
  // FIX: Added workSettings to props to pass down to CalendarFilter.
  workSettings: WorkSettings;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const FilterIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ view, displayDate, onViewChange, onDateChange, onToday, onOpenExportModal, onOpenImportModal, isImporting, statusItems, workSettings, activeFilter, onFilterChange, onToggleSidebar, isSidebarOpen }) => {
    const [animationKey, setAnimationKey] = useState(0);
    const [sliderStyle, setSliderStyle] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const filterPopupRef = useRef<HTMLDivElement>(null);

    const viewRefs = {
        day: useRef<HTMLButtonElement>(null),
        week: useRef<HTMLButtonElement>(null),
        month: useRef<HTMLButtonElement>(null),
        year: useRef<HTMLButtonElement>(null),
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node) &&
                filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)
            ) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getTitle = () => {
        switch (view) {
            case 'day':
                return displayDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            case 'week':
                const weekStart = new Date(displayDate);
                const dayOfWeek = weekStart.getDay();
                const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                weekStart.setDate(diff);

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const startMonth = weekStart.toLocaleDateString('it-IT', { month: 'long'});
                const endMonth = weekEnd.toLocaleDateString('it-IT', { month: 'long'});

                if (startMonth === endMonth) {
                    return `${weekStart.getDate()} - ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
                }
                return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
            case 'month':
                return displayDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
            case 'year':
                return displayDate.getFullYear().toString();
        }
    };

    useEffect(() => {
        const activeRef = viewRefs[view];
        if (activeRef.current) {
            setSliderStyle({
                left: `${activeRef.current.offsetLeft}px`,
                width: `${activeRef.current.offsetWidth}px`,
            });
        }
    }, [view]);
    
    const handleNavigation = (action: () => void) => {
        setAnimationKey(prev => prev + 1);
        action();
    };

    const handlePrev = () => handleNavigation(() => {
        switch (view) {
            case 'day': onDateChange(addDays(displayDate, -1)); break;
            case 'week': onDateChange(addDays(displayDate, -7)); break;
            case 'month': onDateChange(addMonths(displayDate, -1)); break;
            case 'year': onDateChange(addYears(displayDate, -1)); break;
        }
    });
    
    const handleNext = () => handleNavigation(() => {
        switch (view) {
            case 'day': onDateChange(addDays(displayDate, 1)); break;
            case 'week': onDateChange(addDays(displayDate, 7)); break;
            case 'month': onDateChange(addMonths(displayDate, 1)); break;
            case 'year': onDateChange(addYears(displayDate, 1)); break;
        }
    });

    const handleTodayClick = () => handleNavigation(onToday);

    const viewOptions: { value: CalendarView; label: string }[] = [
        { value: 'day', label: 'Giorno' },
        { value: 'week', label: 'Settimana' },
        { value: 'month', label: 'Mese' },
        { value: 'year', label: 'Anno' },
    ];

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-4">
                <button onClick={handleTodayClick} className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg bg-white dark:bg-slate-800 shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95">Oggi</button>
                <div className="flex items-center">
                    <button onClick={handlePrev} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Periodo precedente"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <button onClick={handleNext} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95" aria-label="Periodo successivo"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                </div>
                <h2 key={animationKey} className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white capitalize text-center flex-1 sm:w-auto sm:min-w-[200px] animate-fade-in-up truncate">{getTitle()}</h2>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-1.5 sm:space-x-2">
                <div className="relative bg-gray-200 dark:bg-slate-800 p-0.5 sm:p-1 rounded-lg flex space-x-0.5 sm:space-x-1">
                    <div 
                        className="absolute top-0.5 sm:top-1 bottom-0.5 sm:bottom-1 bg-teal-500 rounded-md shadow-md transition-all duration-300 ease-in-out"
                        style={sliderStyle}
                    />
                    {viewOptions.map(option => (
                        <button 
                            key={option.value} 
                            ref={viewRefs[option.value]}
                            onClick={() => onViewChange(option.value)} 
                            className={`relative z-10 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-300 ${view === option.value ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-300/50 dark:hover:bg-slate-700/50'}`}>
                            {option.label}
                        </button>
                    ))}
                </div>
                 <div className="relative">
                    <button
                        ref={filterButtonRef}
                        onClick={() => setIsFilterOpen(prev => !prev)}
                        className={`p-1.5 sm:p-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${activeFilter ? 'bg-teal-500 text-white' : 'bg-white dark:bg-slate-800 shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white'}`}
                        aria-label="Filtra calendario"
                        title="Filtra per tipo di evento"
                    >
                        <FilterIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                    </button>
                    {isFilterOpen && (
                        <div ref={filterPopupRef}>
                            <CalendarFilter
                                statusItems={statusItems}
                                workSettings={workSettings}
                                activeFilter={activeFilter}
                                onFilterChange={onFilterChange}
                                onClose={() => setIsFilterOpen(false)}
                            />
                        </div>
                    )}
                </div>
                <button 
                    onClick={onOpenImportModal}
                    disabled={isImporting}
                    className="p-1.5 sm:p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-wait"
                    aria-label="Importa cartellino"
                    title="Importa da immagine cartellino"
                >
                    {isImporting ? (
                         <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                        </svg>
                    )}
                </button>
                 <button 
                    onClick={onOpenExportModal} 
                    className="p-1.5 sm:p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    aria-label="Esporta calendario"
                    title="Esporta calendario (.ics)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
                {onToggleSidebar && (
                    <button 
                        onClick={onToggleSidebar}
                        className={`lg:hidden p-1.5 sm:p-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                            isSidebarOpen 
                                ? 'bg-teal-500 text-white' 
                                : 'bg-white dark:bg-slate-800 shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white'
                        }`}
                        aria-label="Dettagli giorno"
                        title="Visualizza dettagli giorno selezionato"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CalendarHeader;
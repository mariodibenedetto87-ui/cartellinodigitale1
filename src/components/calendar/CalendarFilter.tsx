import React from 'react';
import { StatusItem, WorkSettings } from '../../types';
import { getShiftDetails } from '../../utils/timeUtils';
import { getStatusItemDetails } from '../../utils/leaveUtils';
import { MorningIcon, AfternoonIcon, RestIcon, PhoneIcon } from '../ShiftIcons';

interface CalendarFilterProps {
  statusItems: StatusItem[];
  workSettings: WorkSettings;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  onClose: () => void;
}

const CalendarFilter: React.FC<CalendarFilterProps> = ({ statusItems, workSettings, activeFilter, onFilterChange, onClose }) => {
    const shiftTypes = workSettings.shifts;
    const leaveItems = statusItems.filter(item => item.category === 'leave-day' || item.category === 'leave-hours').sort((a,b) => a.description.localeCompare(b.description));

    const handleFilterClick = (filter: string | null) => {
        onFilterChange(filter);
        onClose();
    };
    
    return (
      <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-30 animate-fade-in-up py-2">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Filtra Calendario</h3>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
            <button
                onClick={() => handleFilterClick(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold mb-2 ${!activeFilter ? 'bg-teal-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
                Mostra Tutto
            </button>

            <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-slate-600 px-3 mt-3 mb-1">Stati</h4>
             <button
                onClick={() => handleFilterClick('onCall')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${activeFilter === 'onCall' ? 'bg-gray-200 dark:bg-slate-600 font-bold' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
                <PhoneIcon className="w-5 h-5 text-blue-500"/>
                <span>Reperibilità</span>
            </button>


            <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-slate-600 px-3 mt-3 mb-1">Turni</h4>
            {shiftTypes.map(shift => {
                const details = getShiftDetails(shift.id, workSettings.shifts);
                const Icon = {
                    morning: MorningIcon,
                    afternoon: AfternoonIcon,
                    rest: RestIcon,
                }[shift.id] || (() => <div className={`w-4 h-4 rounded-full ${shift.bgColor}`} />);
                return (
                    <button
                        key={shift.id}
                        onClick={() => handleFilterClick(shift.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${activeFilter === shift.id ? 'bg-gray-200 dark:bg-slate-600 font-bold' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        <Icon className="w-5 h-5"/>
                        <span>{details?.label}</span>
                    </button>
                )
            })}
            
            {leaveItems.length > 0 && (
                <>
                    <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-slate-600 px-3 mt-3 mb-1">Permessi</h4>
                    {leaveItems.map(item => {
                        const leaveId = `code-${item.code}`;
                        const details = getStatusItemDetails(leaveId, statusItems);
                        return (
                             <button
                                key={leaveId}
                                onClick={() => handleFilterClick(leaveId)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${activeFilter === leaveId ? 'bg-gray-200 dark:bg-slate-600 font-bold' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            >
                               <details.Icon className={`w-5 h-5 flex-shrink-0`} />
                                <span className="truncate">{details.label}</span>
                            </button>
                        )
                    })}
                </>
            )}
        </div>
      </div>
    );
}

export default CalendarFilter;
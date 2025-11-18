import React, { useMemo } from 'react';
import { AllTimeLogs, AllDayInfo, LeaveType, StatusItem, WorkSettings } from '../../types';
import { formatDateKey, startOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, getShiftDetails } from '../../utils/timeUtils';
import { getStatusItemDetails } from '../../utils/leaveUtils';
import { PhoneIcon } from '../ShiftIcons';


interface MonthViewProps {
  allLogs: AllTimeLogs;
  allDayInfo: AllDayInfo;
  selectedDate: Date;
  displayDate: Date;
  statusItems: StatusItem[];
  workSettings: WorkSettings;
  onDateSelect: (date: Date) => void;
  onOpenRangePlanner: (options: { startDate: Date }) => void;
  onOpenQuickLeaveModal: (options: { date: Date; highlightedLeave?: LeaveType }) => void;
  activeFilter: string | null;
}

const MonthView: React.FC<MonthViewProps> = ({ allLogs, allDayInfo, selectedDate, displayDate, statusItems, workSettings, onDateSelect, onOpenQuickLeaveModal, activeFilter }) => {
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(displayDate);
    const startDate = startOfWeek(monthStart);
    const calendarDays = [];
    let day = startDate;
    while (calendarDays.length < 42) {
      calendarDays.push(day);
      day = addDays(day, 1);
    }
    return calendarDays;
  }, [displayDate]);

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const getDayIcon = (info: AllDayInfo[string]) => {
    if (info?.leave?.type) {
        const details = getStatusItemDetails(info.leave.type, statusItems);
        return <details.Icon className="w-5 h-5" title={details.label} />;
    }
    return null;
  };

  const getShiftBadge = (info: AllDayInfo[string]) => {
    if (!info?.shift) return null;
    
    const details = getShiftDetails(info.shift, workSettings.shifts);
    if (!details) return null;

    // Abbreviazioni per i turni
    const shiftLabels: Record<string, string> = {
      'morning': 'MAT',
      'afternoon': 'POM',
      'evening': 'SER',
      'night': 'NOT',
      'rest': 'RIP'
    };

    const label = shiftLabels[info.shift] || details.label.substring(0, 3).toUpperCase();

    return (
      <div 
        className={`px-2 py-0.5 rounded text-xs font-semibold ${details.textColor} ${details.bgColor} shadow-sm`}
        title={details.label}
      >
        {label}
      </div>
    );
  };

  const handleDayOptionsClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    const info = allDayInfo[formatDateKey(date)];
    onOpenQuickLeaveModal({ date, highlightedLeave: info?.leave?.type });
  };
  
  return (
    <div className="p-2 sm:p-4 relative">
       <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center border-b border-gray-200 dark:border-slate-700">
        {weekDays.map(day => <div key={day} className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase py-1 sm:py-2">{day}</div>)}
       </div>
       <div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-300 dark:bg-slate-700 border-l border-t border-gray-300 dark:border-slate-700" style={{ minHeight: '75vh' }}>
        {daysInMonth.map((day, index) => {
          const dayKey = formatDateKey(day);
          const hasLog = allLogs[dayKey] && allLogs[dayKey].length > 0;
          const info = allDayInfo[dayKey];
          const isCurrentMonth = isSameMonth(day, displayDate);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isMatch = !activeFilter || (info?.shift === activeFilter) || (info?.leave?.type === activeFilter) || (activeFilter === 'onCall' && info?.onCall);

          let dayClasses = `w-full h-full p-2 flex flex-col group transition-all duration-200 border-r border-b border-gray-300 dark:border-slate-700 relative`;
          let dateNumberClasses = `text-sm relative z-10`;

          if (isSelected) {
            dayClasses += ` bg-teal-200 dark:bg-teal-800/50 ring-2 ring-inset ring-teal-500`; 
            dateNumberClasses += ` font-bold text-teal-800 dark:text-teal-200`;
          } else {
             if (isCurrentMonth) {
                dayClasses += ` bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/50`;
             } else {
                dayClasses += ` bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-600`;
             }
            
             if (isToday) {
                dateNumberClasses += ` bg-teal-500 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center`;
             } else {
                dateNumberClasses += ` text-slate-700 dark:text-slate-300`;
             }
          }

          if (activeFilter && !isMatch) {
            dayClasses += ` opacity-30 hover:opacity-100`;
          }
          
          const iconToShow = getDayIcon(info);

          return (
            <button key={index} className={dayClasses} onClick={() => isCurrentMonth && onDateSelect(day)} disabled={!isCurrentMonth} aria-label={`Seleziona ${day.toLocaleDateString('it-IT')}`}>
              <div className="flex justify-between items-start">
                <span className={dateNumberClasses}>{day.getDate()}</span>
                <div className="flex-grow flex justify-end items-start relative z-20">
                    {info?.onCall && <PhoneIcon className="w-4 h-4 text-blue-500 mt-0.5 mr-1" title="Reperibilità" />}
                    {hasLog && <div className="w-2 h-2 bg-teal-400 rounded-full mt-1.5 mr-1.5"></div>}
                     {isCurrentMonth && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div onClick={(e) => handleDayOptionsClick(e, day)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 -mr-1 -mt-1 cursor-pointer" aria-label="Opzioni giorno">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-500 dark:text-slate-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                </svg>
                            </div>
                        </div>
                     )}
                </div>
              </div>
              <div className="flex-grow flex flex-col items-center justify-center gap-1 mt-1">
                 {iconToShow && <div className="p-1 rounded-full">{iconToShow}</div>}
                 {getShiftBadge(info)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
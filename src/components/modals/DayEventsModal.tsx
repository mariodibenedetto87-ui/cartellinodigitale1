import React, { useState } from 'react';
import { DayInfo, CalendarEvent, ShiftType, LeaveType, StatusItem, Shift } from '../../types';
import { getShiftDetails } from '../../utils/timeUtils';
import { getStatusItemDetails } from '../../utils/leaveUtils';

interface DayEventsModalProps {
  date: Date;
  dayInfo: DayInfo | undefined;
  statusItems: StatusItem[];
  shifts: Shift[];
  onSave: (date: Date, events: CalendarEvent[]) => void;
  onClose: () => void;
}

const DayEventsModal: React.FC<DayEventsModalProps> = ({
  date,
  dayInfo,
  statusItems,
  shifts,
  onSave,
  onClose,
}) => {
  // Inizializza gli eventi esistenti
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (dayInfo?.events && dayInfo.events.length > 0) {
      return dayInfo.events;
    }
    
    // Migrazione da vecchia struttura
    const migratedEvents: CalendarEvent[] = [];
    if (dayInfo?.shift) {
      migratedEvents.push({
        id: `shift-${Date.now()}`,
        type: 'shift',
        shift: dayInfo.shift,
      });
    }
    if (dayInfo?.leave) {
      migratedEvents.push({
        id: `leave-${Date.now()}`,
        type: 'leave',
        leave: dayInfo.leave,
      });
    }
    if (dayInfo?.onCall) {
      migratedEvents.push({
        id: `oncall-${Date.now()}`,
        type: 'onCall',
        onCall: true,
      });
    }
    return migratedEvents;
  });

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newEventType, setNewEventType] = useState<'shift' | 'leave' | 'onCall' | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftType | ''>('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | ''>('');
  const [leaveHours, setLeaveHours] = useState<number | undefined>(undefined);

  const handleAddEvent = () => {
    if (!newEventType) return;

    const newEvent: CalendarEvent = {
      id: `${newEventType}-${Date.now()}-${Math.random()}`,
      type: newEventType,
    };

    if (newEventType === 'shift' && selectedShift) {
      newEvent.shift = selectedShift as ShiftType;
    } else if (newEventType === 'leave' && selectedLeaveType) {
      newEvent.leave = {
        type: selectedLeaveType as LeaveType,
        hours: leaveHours,
      };
    } else if (newEventType === 'onCall') {
      newEvent.onCall = true;
    }

    setEvents([...events, newEvent]);
    
    // Reset form
    setNewEventType(null);
    setSelectedShift('');
    setSelectedLeaveType('');
    setLeaveHours(undefined);
    setShowAddMenu(false);
  };

  const handleRemoveEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleSave = () => {
    onSave(date, events);
    onClose();
  };

  const getEventLabel = (event: CalendarEvent): { label: string; icon: JSX.Element; color: string } => {
    if (event.type === 'shift' && event.shift) {
      const details = getShiftDetails(event.shift, shifts);
      return {
        label: details?.label || 'Turno',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        color: details?.bgColor || 'bg-gray-100 dark:bg-gray-700',
      };
    }
    if (event.type === 'leave' && event.leave) {
      const details = getStatusItemDetails(event.leave.type, statusItems);
      return {
        label: details.label + (event.leave.hours ? ` (${event.leave.hours}h)` : ''),
        icon: <details.Icon className="w-5 h-5" />,
        color: details.bgColor,
      };
    }
    if (event.type === 'onCall') {
      return {
        label: 'Reperibilità',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        ),
        color: 'bg-blue-100 dark:bg-blue-900/30',
      };
    }
    return { label: 'Evento sconosciuto', icon: <></>, color: 'bg-gray-100 dark:bg-gray-700' };
  };

  const leaveItems = statusItems.filter(item => 
    item.category === 'leave-day' || item.category === 'leave-hours'
  );

  const formatDate = (date: Date): string => {
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Eventi del Giorno</h2>
              <p className="text-sm text-white/80">{formatDate(date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Events */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Eventi Programmati ({events.length})
            </h3>
            
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Nessun evento programmato</p>
                <p className="text-sm mt-1">Aggiungi un turno, permesso o reperibilità</p>
              </div>
            ) : (
              events.map((event) => {
                const { label, icon, color } = getEventLabel(event);
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 ${color} rounded-lg border-2 border-gray-200 dark:border-gray-600`}
                  >
                    <div className="flex items-center gap-3">
                      {icon}
                      <span className="font-medium text-gray-800 dark:text-white">{label}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveEvent(event.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Rimuovi evento"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add New Event */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {!showAddMenu ? (
              <button
                onClick={() => setShowAddMenu(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Aggiungi Evento
              </button>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Nuovo Evento</h4>
                
                {/* Event Type Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo Evento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setNewEventType('shift')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        newEventType === 'shift'
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                    >
                      Turno
                    </button>
                    <button
                      onClick={() => setNewEventType('leave')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        newEventType === 'leave'
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                    >
                      Permesso
                    </button>
                    <button
                      onClick={() => setNewEventType('onCall')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        newEventType === 'onCall'
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                    >
                      Reperibilità
                    </button>
                  </div>
                </div>

                {/* Shift Selection */}
                {newEventType === 'shift' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Seleziona Turno
                    </label>
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="">-- Seleziona --</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Leave Selection */}
                {newEventType === 'leave' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tipo Permesso/Ferie
                      </label>
                      <select
                        value={selectedLeaveType}
                        onChange={(e) => setSelectedLeaveType(e.target.value as LeaveType)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="">-- Seleziona --</option>
                        {leaveItems.map((item) => (
                          <option key={item.code} value={`code-${item.code}`}>
                            {item.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedLeaveType && leaveItems.find(item => `code-${item.code}` === selectedLeaveType)?.category === 'leave-hours' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Ore
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          step="0.5"
                          value={leaveHours || ''}
                          onChange={(e) => setLeaveHours(parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white"
                          placeholder="Es: 4"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* OnCall info */}
                {newEventType === 'onCall' && (
                  <div className="text-sm text-gray-600 dark:text-gray-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p>⚠️ La reperibilità verrà aggiunta al giorno selezionato</p>
                  </div>
                )}

                {/* Add Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEvent}
                    disabled={
                      !newEventType ||
                      (newEventType === 'shift' && !selectedShift) ||
                      (newEventType === 'leave' && !selectedLeaveType)
                    }
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aggiungi
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setNewEventType(null);
                      setSelectedShift('');
                      setSelectedLeaveType('');
                      setLeaveHours(undefined);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg font-medium transition-all"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-md"
          >
            Salva Eventi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEventsModal;

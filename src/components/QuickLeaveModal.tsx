import React, { useState, useMemo } from 'react';
import { LeaveType, ShiftType, StatusItem, WorkSettings, AllDayInfo } from '../types';
import { calculateStatusUsage } from '../utils/statusUtils';

interface QuickLeaveModalProps {
  date: Date;
  statusItems: StatusItem[];
  workSettings: WorkSettings;
  allDayInfo: AllDayInfo;
  highlightedLeave?: string;
  onClose: () => void;
  onSetLeave: (date: Date, leave: LeaveType | null, hours?: number) => void;
  onSetShift: (date: Date, shift: ShiftType | null) => void;
  onOpenAddEntryModal: (date: Date) => void;
}

const QuickLeaveModal: React.FC<QuickLeaveModalProps> = ({ date, statusItems, workSettings, allDayInfo, highlightedLeave, onClose, onSetLeave, onSetShift, onOpenAddEntryModal }) => {
  const [editingHoursFor, setEditingHoursFor] = useState<StatusItem | null>(null);
  const [hoursValue, setHoursValue] = useState('');
  const [validationMessage, setValidationMessage] = useState<{text: string, type: 'error' | 'warning' | 'info'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calcola i saldi disponibili
  const currentYear = date.getFullYear();
  const usageData = useMemo(() => calculateStatusUsage(allDayInfo, currentYear, statusItems), [allDayInfo, currentYear, statusItems]);

  const getBalance = (item: StatusItem) => {
    const used = usageData[item.code] || 0;
    return item.entitlement - used;
  };

  const handleSelectLeave = (item: StatusItem) => {
    const balance = getBalance(item);
    
    // Avvisa se il saldo è insufficiente
    if (balance <= 0 && item.entitlement > 0) {
      if (!confirm(`⚠️ ATTENZIONE: Il saldo per "${item.description}" è esaurito (${balance}).\n\nVuoi comunque procedere? Questo porterà il saldo in negativo.`)) {
        return;
      }
    } else if (balance > 0 && balance <= 2 && item.entitlement > 0 && item.category === 'leave-day') {
      if (!confirm(`⚠️ AVVISO: Restano solo ${balance} giorni di "${item.description}".\n\nVuoi procedere?`)) {
        return;
      }
    }

    if (item.category === 'leave-hours') {
        setEditingHoursFor(item);
    } else {
        onSetLeave(date, `code-${item.code}`);
        onClose();
    }
  };

  const handleSaveHours = () => {
    const hours = parseFloat(hoursValue.replace(',', '.'));
    
    if (!editingHoursFor) return;
    
    // Validazione input
    if (isNaN(hours) || hours <= 0) {
        setValidationMessage({text: '⚠️ Inserisci un numero di ore valido maggiore di 0', type: 'error'});
        return;
    }
    
    if (hours > 24) {
        setValidationMessage({text: '⚠️ Non puoi inserire più di 24 ore', type: 'error'});
        return;
    }
    
    const balance = getBalance(editingHoursFor);
    
    // Controlla se le ore richieste superano il saldo
    if (hours > balance && editingHoursFor.entitlement > 0) {
      const deficit = (hours - balance).toFixed(1);
      if (!confirm(`⚠️ ATTENZIONE: Hai richiesto ${hours} ore ma il saldo disponibile è solo ${balance.toFixed(1)} ore.\n\nProcedendo, il saldo andrà in negativo di ${deficit} ore.\n\nVuoi continuare?`)) {
        return;
      }
    }
    
    onSetLeave(date, `code-${editingHoursFor.code}`, hours);
    onClose();
  };
  
  // Funzione per impostare rapidamente le ore
  const handleQuickSetHours = (hours: number) => {
    setHoursValue(hours.toString());
    setValidationMessage(null);
  };
  
  // Funzione per incrementare/decrementare le ore
  const adjustHours = (delta: number) => {
    const current = parseFloat(hoursValue.replace(',', '.')) || 0;
    const newValue = Math.max(0, Math.min(24, current + delta));
    setHoursValue(newValue.toString());
    setValidationMessage(null);
  };

  const handleSetShift = (shift: ShiftType | null) => {
    onSetShift(date, shift);
    onClose();
  };

  const handleClear = () => {
    onSetLeave(date, null);
    onSetShift(date, null);
    onClose();
  }
  
  const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
  }

  // Filtra items in base alla ricerca
  const leaveDayItems = statusItems
    .filter(item => item.category === 'leave-day')
    .filter(item => !searchTerm || item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a,b) => a.code - b.code);
  
  const leaveHourItems = statusItems
    .filter(item => item.category === 'leave-hours')
    .filter(item => !searchTerm || item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a,b) => a.code - b.code);
  
  const shiftItems = workSettings.shifts;

  const renderSelectionView = () => (
    <>
      {/* Barra di ricerca */}
      {(statusItems.length > 6) && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Cerca permesso..."
              className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 dark:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Riepilogo saldi in evidenza */}
      {statusItems.filter(item => item.entitlement > 0).length > 0 && !searchTerm && (
        <div className="mb-4 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-teal-200 dark:border-teal-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">📊 Riepilogo Saldi</h4>
            <span className="text-xs text-teal-600 dark:text-teal-400">{date.getFullYear()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {statusItems
              .filter(item => item.entitlement > 0)
              .slice(0, 4)
              .map(item => {
                const balance = getBalance(item);
                const isLow = balance > 0 && balance <= 2 && item.category === 'leave-day';
                const isExhausted = balance <= 0;
                
                return (
                  <div key={item.code} className="text-center">
                    <div className={`text-xl font-black ${
                      isExhausted ? 'text-red-600 dark:text-red-400' :
                      isLow ? 'text-amber-600 dark:text-amber-400' :
                      'text-teal-600 dark:text-teal-400'
                    }`}>
                      {item.category === 'leave-hours' ? `${balance.toFixed(1)}h` : balance}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-600 truncate">{truncateText(item.description, 15)}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {leaveDayItems.length > 0 && (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">📅 Permessi Giornalieri</h3>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-semibold">{leaveDayItems.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {leaveDayItems.map(item => {
                    const balance = getBalance(item);
                    const isLow = balance > 0 && balance <= 2 && item.entitlement > 0;
                    const isExhausted = balance <= 0 && item.entitlement > 0;
                    
                    return (
                        <button 
                            key={item.code} 
                            onClick={() => handleSelectLeave(item)} 
                            className={`group relative p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                                isExhausted ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 hover:from-red-200 hover:to-red-300 dark:hover:from-red-800/60 dark:hover:to-red-700/60 border-2 border-red-400 dark:border-red-600' : 
                                isLow ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 hover:from-amber-200 hover:to-amber-300 dark:hover:from-amber-800/60 dark:hover:to-amber-700/60 border-2 border-amber-400 dark:border-amber-600' : 
                                'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-800/30 hover:from-emerald-100 hover:to-teal-200 dark:hover:from-emerald-800/50 dark:hover:to-teal-700/50 border-2 border-emerald-300 dark:border-emerald-600'
                            } ${`code-${item.code}` === highlightedLeave ? 'ring-4 ring-offset-2 dark:ring-offset-slate-800 ring-teal-500 scale-105 shadow-2xl' : ''}`}
                        >
                            {/* Icona categoria */}
                            <div className="absolute top-2 right-2 text-lg opacity-50 group-hover:opacity-100 transition-opacity">
                              {isExhausted ? '⚠️' : isLow ? '⏰' : '✅'}
                            </div>
                            
                            <div className="font-bold text-sm mb-2 text-gray-800 dark:text-slate-100">{truncateText(item.description, 20)}</div>
                            {item.entitlement > 0 && (
                                <div className="flex items-center justify-center space-x-1">
                                  <span className={`text-2xl font-black ${
                                      isExhausted ? 'text-red-600 dark:text-red-400' : 
                                      isLow ? 'text-amber-600 dark:text-amber-400' : 
                                      'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                      {balance}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-slate-600 font-semibold">gg</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
      )}

      {leaveHourItems.length > 0 && (
         <div className="mb-4 border-t-2 border-dashed border-gray-200 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">⏱️ Permessi Orari</h3>
              <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full font-semibold">{leaveHourItems.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {leaveHourItems.map(item => {
                    const balance = getBalance(item);
                    const isLow = balance > 0 && balance <= 4 && item.entitlement > 0;
                    const isExhausted = balance <= 0 && item.entitlement > 0;
                    
                    return (
                        <button 
                            key={item.code} 
                            onClick={() => handleSelectLeave(item)} 
                            className={`group relative p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                                isExhausted ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 hover:from-red-200 hover:to-red-300 dark:hover:from-red-800/60 dark:hover:to-red-700/60 border-2 border-red-400 dark:border-red-600' : 
                                isLow ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 hover:from-amber-200 hover:to-amber-300 dark:hover:from-amber-800/60 dark:hover:to-amber-700/60 border-2 border-amber-400 dark:border-amber-600' : 
                                'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/30 dark:to-purple-800/30 hover:from-violet-100 hover:to-purple-200 dark:hover:from-violet-800/50 dark:hover:to-purple-700/50 border-2 border-violet-300 dark:border-violet-600'
                            } ${`code-${item.code}` === highlightedLeave ? 'ring-4 ring-offset-2 dark:ring-offset-slate-800 ring-violet-500 scale-105 shadow-2xl' : ''}`}
                        >
                            {/* Icona categoria */}
                            <div className="absolute top-2 right-2 text-lg opacity-50 group-hover:opacity-100 transition-opacity">
                              {isExhausted ? '⚠️' : isLow ? '⏰' : '🕐'}
                            </div>
                            
                            <div className="font-bold text-sm mb-2 text-gray-800 dark:text-slate-100">{truncateText(item.description, 20)}</div>
                            {item.entitlement > 0 && (
                                <div className="flex items-center justify-center space-x-1">
                                  <span className={`text-2xl font-black ${
                                      isExhausted ? 'text-red-600 dark:text-red-400' : 
                                      isLow ? 'text-amber-600 dark:text-amber-400' : 
                                      'text-violet-600 dark:text-violet-400'
                                  }`}>
                                      {balance.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-slate-600 font-semibold">h</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
      )}

      {!searchTerm && (
        <>
          
          <div className="mb-4 border-t-2 border-dashed border-gray-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">🔄 Imposta Turno</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  {shiftItems.map(shift => (
                      <button 
                        key={shift.id} 
                        onClick={() => handleSetShift(shift.id)} 
                        className={`group relative p-3 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm font-bold ${shift.bgColor} ${shift.textColor} hover:brightness-110`}
                      >
                          <div className="opacity-70 group-hover:opacity-100 transition-opacity">{shift.name}</div>
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onOpenAddEntryModal(date)} 
              className="p-4 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-800/30 hover:from-teal-200 hover:to-cyan-200 dark:hover:from-teal-800/50 dark:hover:to-cyan-700/50 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 border-teal-300 dark:border-teal-600 font-bold text-teal-700 dark:text-teal-300"
            >
              <div className="text-2xl mb-1">⏰</div>
              <div className="text-xs">Timbratura</div>
            </button>
            
            <button 
              onClick={handleClear} 
              className="p-4 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-800/30 hover:from-red-200 hover:to-rose-200 dark:hover:from-red-800/50 dark:hover:to-rose-700/50 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 border-red-300 dark:border-red-600 font-bold text-red-700 dark:text-red-300"
            >
              <div className="text-2xl mb-1">🗑️</div>
              <div className="text-xs">Pulisci</div>
            </button>
          </div>
        </>
      )}
      
      {searchTerm && (leaveDayItems.length === 0 && leaveHourItems.length === 0) && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-600 dark:text-slate-600 font-semibold">Nessun permesso trovato</p>
          <p className="text-xs text-gray-600 dark:text-slate-600 mt-1">Prova con un'altra ricerca</p>
        </div>
      )}
    </>
  );

  const renderHoursInputView = () => {
    const balance = editingHoursFor ? getBalance(editingHoursFor) : 0;
    const isLow = balance > 0 && balance <= 4;
    const isExhausted = balance <= 0;
    const currentHours = parseFloat(hoursValue.replace(',', '.')) || 0;
    const remainingAfter = balance - currentHours;
    
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-3 text-center">
          {editingHoursFor?.description}
        </h3>
        
        {/* Mostra il saldo disponibile con grafico circolare */}
        {editingHoursFor && editingHoursFor.entitlement > 0 && (
          <div className="mb-4">
            <div className={`p-4 rounded-xl text-center shadow-lg ${
              isExhausted ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 border-2 border-red-400' :
              isLow ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border-2 border-amber-400' :
              'bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/40 dark:to-teal-800/40 border-2 border-emerald-400'
            }`}>
              <p className="text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-1">Saldo Disponibile</p>
              <div className="flex items-center justify-center space-x-4">
                <div>
                  <p className={`text-4xl font-black ${
                    isExhausted ? 'text-red-600 dark:text-red-300' :
                    isLow ? 'text-amber-600 dark:text-amber-300' :
                    'text-emerald-600 dark:text-emerald-300'
                  }`}>
                    {balance.toFixed(1)}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">ore totali</p>
                </div>
                {currentHours > 0 && (
                  <>
                    <div className="text-2xl font-bold text-gray-600 dark:text-slate-600">→</div>
                    <div>
                      <p className={`text-4xl font-black ${
                        remainingAfter < 0 ? 'text-red-600 dark:text-red-300' :
                        remainingAfter <= 2 ? 'text-amber-600 dark:text-amber-300' :
                        'text-emerald-600 dark:text-emerald-300'
                      }`}>
                        {remainingAfter.toFixed(1)}
                      </p>
                      <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">dopo richiesta</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Pulsanti rapidi */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-600 mb-2 text-center uppercase tracking-wide">⚡ Selezione Rapida</p>
          <div className="grid grid-cols-5 gap-2">
            {[0.5, 1, 2, 4, 8].map(hours => (
              <button
                key={hours}
                onClick={() => handleQuickSetHours(hours)}
                className={`py-3 px-2 rounded-lg font-bold text-sm transition-all transform hover:scale-105 active:scale-95 ${
                  parseFloat(hoursValue) === hours
                    ? 'bg-violet-500 text-white shadow-lg ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-800'
                    : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>
        
        {/* Input con controlli +/- */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-600 mb-2 text-center uppercase tracking-wide">✏️ Personalizza Ore</p>
          <div className="flex items-stretch space-x-2">
            <button
              onClick={() => adjustHours(-0.5)}
              className="flex-shrink-0 w-14 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-700 dark:text-white rounded-lg font-bold text-2xl transition-colors active:scale-95"
            >
              −
            </button>
            <div className="flex-1 relative">
              <input 
                type="number"
                value={hoursValue}
                onChange={(e) => {
                  setHoursValue(e.target.value);
                  setValidationMessage(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSaveHours();
                }}
                placeholder="0.0"
                step="0.5"
                min="0"
                max="24"
                className="w-full text-center text-3xl font-black bg-white dark:bg-slate-700 border-2 border-violet-300 dark:border-violet-600 rounded-lg px-3 py-4 text-violet-700 dark:text-violet-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-600 dark:text-slate-600">ore</span>
            </div>
            <button
              onClick={() => adjustHours(0.5)}
              className="flex-shrink-0 w-14 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-700 dark:text-white rounded-lg font-bold text-2xl transition-colors active:scale-95"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Messaggio di validazione */}
        {validationMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-semibold text-center animate-fade-in-up ${
            validationMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-400' :
            validationMessage.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-2 border-amber-400' :
            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400'
          }`}>
            {validationMessage.text}
          </div>
        )}
        
        {/* Pulsanti azione */}
        <div className="mt-6 flex space-x-3">
          <button 
            onClick={() => {
              setEditingHoursFor(null);
              setHoursValue('');
              setValidationMessage(null);
            }} 
            className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-slate-800 dark:text-white font-bold transition-all active:scale-95">
              ✕ Annulla
          </button>
          <button 
            onClick={handleSaveHours}
            disabled={!hoursValue || parseFloat(hoursValue.replace(',', '.')) <= 0}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:shadow-none">
              ✓ Conferma
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl dark:shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header con gradiente */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 dark:from-teal-600 dark:via-cyan-600 dark:to-blue-600 px-6 py-4 rounded-t-3xl shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-white drop-shadow-lg">
                {editingHoursFor ? `✏️ Inserisci Ore` : `📅 Giustifica Assenza`}
              </h2>
              <p className="text-sm text-white/90 font-semibold mt-1">
                {date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl leading-none transition-all transform hover:scale-110 active:scale-95"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {editingHoursFor ? renderHoursInputView() : renderSelectionView()}
        </div>
      </div>
    </div>
  );
};

export default QuickLeaveModal;

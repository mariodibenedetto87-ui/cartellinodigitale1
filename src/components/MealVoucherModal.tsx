import React, { useState } from 'react';
import { AllTimeLogs } from '../types';
import { formatDateKey } from '../utils/timeUtils';
import { getWorkSessionsInfo } from '../utils/mealVoucherUtils';

// Icon Component
const Receipt: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

interface MealVoucherModalProps {
  date: Date;
  onClose: () => void;
  allLogs: AllTimeLogs;
  onSave: (date: string, earned: boolean, note: string) => void;
}

const MealVoucherModal: React.FC<MealVoucherModalProps> = ({ date, onClose, allLogs, onSave }) => {
  const dateKey = formatDateKey(date);
  const dayLogs = allLogs[dateKey] || [];
  const workInfo = getWorkSessionsInfo(dayLogs);
  
  const [earned, setEarned] = useState(workInfo.eligible);
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSave(dateKey, earned, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-black/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Receipt className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-blue-500">Buono Pasto</h2>
              <p className="text-sm text-gray-600 dark:text-slate-600">
                {date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
        </div>

        {/* Info timbrature */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-3">Riepilogo Timbrature</h3>
          
          {workInfo.sessions.length === 0 ? (
            <div className="text-center py-6 text-gray-600 dark:text-slate-600">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nessuna timbratura per questo giorno</p>
            </div>
          ) : (
            <>
              {/* Sessioni di lavoro */}
              <div className="space-y-3 mb-4">
                {workInfo.sessions.map((session, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm text-gray-600 dark:text-slate-600">Sessione {index + 1}</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-white">{session.hours}h</div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-300">
                      <span className="font-mono">{session.start}</span>
                      <span>→</span>
                      <span className="font-mono">{session.end}</span>
                    </div>
                    {session.breakAfter !== undefined && (
                      <div className={`mt-2 text-xs ${session.breakAfter <= 2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ⏸ Pausa: {session.breakAfter}h {session.breakAfter <= 2 ? '✓' : '✗ (> 2h)'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totale */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Totale ore lavorate</div>
                    <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                      {workInfo.eligible ? '✅ Buono pasto maturato automaticamente' : '❌ Requisiti non soddisfatti'}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{workInfo.totalHours.toFixed(1)}h</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Regole */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg text-sm">
          <div className="font-semibold text-gray-700 dark:text-slate-300 mb-2">📋 Regole buono pasto:</div>
          <ul className="space-y-1 text-gray-600 dark:text-slate-600 ml-4">
            <li>• 7 ore continuative senza pause</li>
            <li>• Oppure: 6h + pausa max 2h + altre ore</li>
            <li>• Massimo 1 buono al giorno</li>
          </ul>
        </div>

        {/* Toggle manuale */}
        <div className="mb-6">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <div>
              <div className="font-semibold text-gray-800 dark:text-white">Buono pasto maturato</div>
              <div className="text-xs text-gray-600 dark:text-slate-600 mt-1">Attiva/disattiva manualmente</div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={earned}
                onChange={(e) => setEarned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
            </div>
          </label>
        </div>

        {/* Note */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Note (opzionale)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es: Timbratura dimenticata, straordinario, ecc."
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
            rows={3}
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            {earned ? '✓ Conferma Buono Pasto' : 'Salva'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealVoucherModal;

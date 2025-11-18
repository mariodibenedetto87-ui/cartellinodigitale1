import React, { useMemo } from 'react';
import { AllTimeLogs, AllMealVouchers } from '../types';
import { formatDateKey } from '../utils/timeUtils';
import { getWorkSessionsInfo, calculateMealVoucherEligibility } from '../utils/mealVoucherUtils';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

// Icon Component
const Receipt: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

interface MealVoucherCardProps {
  date: Date;
  allLogs: AllTimeLogs;
  allMealVouchers: AllMealVouchers;
  onOpenModal: (date: Date) => void;
  session: Session | null;
}

const MealVoucherCard: React.FC<MealVoucherCardProps> = ({ date, allLogs, allMealVouchers, onOpenModal, session }) => {
  const dateKey = formatDateKey(date);
  const dayLogs = allLogs[dateKey] || [];
  const voucher = allMealVouchers[dateKey];
  
  const workInfo = useMemo(() => {
    return getWorkSessionsInfo(dayLogs);
  }, [dayLogs, dateKey, voucher]);
  
  // Determina se ha diritto al buono pasto
  const hasVoucher = voucher ? voucher.earned : workInfo.eligible;
  const isManual = voucher?.manual || false;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${hasVoucher ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-slate-700/30'}`}>
            <Receipt className={`w-6 h-6 ${hasVoucher ? 'text-blue-500' : 'text-gray-400 dark:text-slate-500'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Buono Pasto</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          hasVoucher 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
            : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
        }`}>
          {hasVoucher ? '✓ Maturato' : '✗ Non maturato'}
        </div>
      </div>

      {/* Info ore lavorate */}
      {dayLogs.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600 dark:text-slate-400">Ore lavorate</span>
            <span className="font-bold text-gray-800 dark:text-white">{workInfo.totalHours.toFixed(1)}h</span>
          </div>
          
          {/* Barra progresso */}
          <div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                workInfo.totalHours >= 7 ? 'bg-blue-500' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(100, (workInfo.totalHours / 7) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
            <span>0h</span>
            <span className="text-blue-500 font-medium">7h richieste</span>
          </div>
        </div>
      )}

      {/* Note manuali */}
      {isManual && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400">⚠️ Gestito Manualmente</div>
            {workInfo.eligible && !hasVoucher && (
              <div className="text-xs text-amber-600 dark:text-amber-300">
                (Calcolato: ✓ Maturato)
              </div>
            )}
          </div>
          {voucher?.note && (
            <div className="text-xs text-amber-600 dark:text-amber-300 mt-1">{voucher.note}</div>
          )}
        </div>
      )}

      {/* Pulsante gestione */}
      <button
        onClick={() => onOpenModal(date)}
        className="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg"
      >
        {hasVoucher ? '✏️ Modifica' : '+ Aggiungi Manualmente'}
      </button>

      {/* Pulsante per tornare al calcolo automatico */}
      {isManual && (
        <button
          onClick={async () => {
            if (!session || !voucher) return;
            const confirmed = confirm('Vuoi eliminare la gestione manuale e tornare al calcolo automatico?');
            if (!confirmed) return;
            
            try {
              // Elimina voucher manuale
              const { error } = await supabase
                .from('meal_vouchers')
                .delete()
                .eq('user_id', session.user.id)
                .eq('date', dateKey);
              
              if (error) throw error;
              
              // Ricalcola automaticamente
              const eligible = calculateMealVoucherEligibility(dayLogs);
              
              if (eligible) {
                await supabase.from('meal_vouchers').upsert({
                  user_id: session.user.id,
                  date: dateKey,
                  earned: true,
                  manual: false,
                  note: 'Calcolato automaticamente'
                });
              }
              
              window.location.reload();
            } catch (err) {
              console.error('Errore eliminazione voucher manuale:', err);
              alert('Errore durante l\'operazione');
            }
          }}
          className="w-full mt-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-xs"
        >
          🔄 Torna al Calcolo Automatico
        </button>
      )}

      {/* Mini info regole */}
      {!hasVoucher && dayLogs.length === 0 && (
        <div className="mt-3 text-xs text-center text-gray-500 dark:text-slate-400">
          Aggiungi timbrature o gestisci manualmente
        </div>
      )}
      {!hasVoucher && dayLogs.length > 0 && (
        <div className="mt-3 text-xs text-center text-gray-500 dark:text-slate-400">
          Servono 7h continuative o 6h+pausa≤2h
        </div>
      )}
    </div>
  );
};

export default MealVoucherCard;

import React, { useState, useEffect } from 'react';
import { WorkStatus, WorkSettings } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { haptic, HapticType } from '../utils/haptics';

// Extend window type for NDEFReader
declare global {
    interface Window {
        NDEFReader: any;
    }
}

const ClockIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const CheckmarkIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const FingerprintIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.588 8.26l-6.522-6.522a.75.75 0 00-1.06 0l-1.95 1.95a.75.75 0 01-1.06 0l-2.224-2.224a.75.75 0 00-1.06 0l-1.95 1.95a.75.75 0 01-1.06 0l-6.522-6.522A7.5 7.5 0 017.864 4.243z" />
    </svg>
);

interface NfcScannerProps {
  workStatus: WorkStatus;
  onToggle: () => void;
  disabled: boolean;
  currentSessionStart: Date | null;
  currentSessionDuration: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  dayTotalWorkMs?: number;
  workSettings: WorkSettings;
}

const NfcScanner: React.FC<NfcScannerProps> = ({ workStatus, onToggle, disabled, currentSessionStart, currentSessionDuration, selectedDate, onDateChange, dayTotalWorkMs, workSettings }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcMessage, setNfcMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);
  
  useEffect(() => {
      let interval: number | undefined;
      if (workStatus === WorkStatus.ClockedIn && currentSessionStart) {
          const standardDayMs = workSettings.standardDayHours * 60 * 60 * 1000;
          if (standardDayMs > 0) {
              interval = window.setInterval(() => {
                  const elapsedMs = new Date().getTime() - new Date(currentSessionStart).getTime();
                  const calculatedProgress = (elapsedMs / standardDayMs) * 100;
                  setProgress(Math.min(calculatedProgress, 100)); // Cap at 100%
              }, 1000);
          }
      } else {
          setProgress(0);
      }
      return () => clearInterval(interval);
  }, [workStatus, currentSessionStart, workSettings.standardDayHours]);


  const isClockedIn = workStatus === WorkStatus.ClockedIn;
  const actionText = isClockedIn ? 'Registra Uscita' : 'Registra Entrata';
  
  const handleClick = async () => {
    if (disabled || isAnimating) return;

    // Haptic feedback immediato
    haptic(HapticType.MEDIUM);

    if (nfcSupported) {
      try {
        const ndef = new window.NDEFReader();
        const controller = new AbortController();
        
        await ndef.scan({ signal: controller.signal });
        setNfcMessage('Pronto per la scansione. Avvicina il tag NFC...');

        ndef.onreadingerror = () => {
          setNfcMessage('Errore di lettura. Riprova.');
          haptic(HapticType.ERROR);
          controller.abort();
        };

        ndef.onreading = (event: any) => {
          for (const record of event.message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder();
              const text = textDecoder.decode(record.data);
              if (text === "toggle") {
                setNfcMessage("Timbratura registrata con successo!");
                haptic(HapticType.SUCCESS); // Feedback di successo
                
                onToggle();

                setIsAnimating(true);
                setTimeout(() => {
                  setIsAnimating(false);
                  setNfcMessage('');
                }, 1500);
                
                controller.abort();
                return;
              }
            }
          }
          setNfcMessage("Tag non riconosciuto. Assicurati che contenga il testo 'toggle'.");
          haptic(HapticType.WARNING);
          controller.abort();
        };

      } catch (error) {
        console.error("Errore Web NFC:", error);
        setNfcMessage("Errore: Impossibile avviare la scansione NFC.");
        haptic(HapticType.ERROR);
      }
    } else {
      haptic(HapticType.SUCCESS); // Feedback di successo per simulazione
      onToggle();
      
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);
    }
  };

  const handleDateNavigation = (days: number) => {
      haptic(HapticType.LIGHT); // Feedback leggero per navigazione
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      onDateChange(newDate);
  }
  
  const getInstructionalText = () => {
    if (isAnimating) return 'La tua timbratura è stata registrata con successo.';
    if (nfcMessage) return nfcMessage;
    if (disabled) return 'Seleziona la data odierna per timbrare.';
    if (nfcSupported) return "Tocca il pulsante per avviare la scansione NFC. Su iPhone, usa l'app Comandi (vedi guida NFC_IPHONE_GUIDE.md).";
    return 'Tocca il pulsante per simulare la timbratura.';
  };
  
  const cardBaseClasses = "rounded-2xl p-6 md:p-8 shadow-lg dark:shadow-black/20 text-white transition-all duration-300 ease-in-out min-h-[350px] flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1";
  const cardColorClasses = isClockedIn 
    ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
    : 'bg-white dark:bg-slate-800';
  const cardAnimationClasses = isAnimating ? 'shadow-2xl shadow-green-400/40 dark:shadow-green-300/20' : '';

  const buttonBaseClasses = "w-full md:w-auto px-12 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 duration-300 shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-95 flex items-center justify-center space-x-3";
  let buttonColorClasses = isAnimating
    ? 'bg-green-500 focus:ring-green-400 text-white'
    : (isClockedIn 
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white' 
        : 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-500 text-white');

  if (disabled) {
    buttonColorClasses = 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed text-slate-100 dark:text-slate-300';
  }
  
  const circularButtonClasses = "w-36 h-36 rounded-full font-bold text-lg transition-all transform hover:scale-105 duration-300 shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-95 flex flex-col items-center justify-center space-y-2";

  const statusTextColor = isClockedIn ? 'text-green-200' : 'text-red-500 dark:text-red-400';
  const statusText = isClockedIn ? 'Timbratura Attiva' : 'Timbratura Non Attiva';

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className={`${cardBaseClasses} ${cardColorClasses} ${cardAnimationClasses}`}>
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className={`text-2xl font-bold ${isClockedIn ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                        {disabled ? 'Visualizzazione Storico' : 'Controllo Presenze'}
                    </h2>
                     <div className="flex items-center space-x-2 mt-2">
                        <button onClick={() => handleDateNavigation(-1)} className={`p-1.5 rounded-full transition-colors ${isClockedIn ? 'hover:bg-white/10' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`} aria-label="Giorno precedente">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${isClockedIn ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <div className="relative group">
                            <p className={`text-sm font-semibold w-64 text-center cursor-pointer ${isClockedIn ? 'text-white/90 hover:text-white' : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white'} transition-colors`}>
                                {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <input 
                                type="date" 
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        onDateChange(new Date(e.target.value + 'T12:00:00'));
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                title="Seleziona una data"
                            />
                        </div>
                        <button 
                            onClick={() => {
                                const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                                if (input) input.showPicker?.();
                            }}
                            className={`p-1.5 rounded-full transition-colors ${isClockedIn ? 'hover:bg-white/10' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`} 
                            aria-label="Seleziona data"
                            title="Seleziona data"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${isClockedIn ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </button>
                        <button onClick={() => handleDateNavigation(1)} className={`p-1.5 rounded-full transition-colors ${isClockedIn ? 'hover:bg-white/10' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`} aria-label="Giorno successivo">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${isClockedIn ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}`}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
                 <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className={`relative flex h-3 w-3`}>
                        {isClockedIn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isClockedIn ? 'bg-green-300' : 'bg-red-500'}`}></span>
                    </div>
                    <span className={`text-sm font-semibold ${statusTextColor}`}>{statusText}</span>
                </div>
            </div>

            <div className="my-6 text-center" style={{minHeight: '92px'}}>
                {isClockedIn ? (
                    <div className="animate-fade-in-up">
                        <p className="text-sm text-white/80">Durata Sessione Corrente</p>
                        <div className="flex items-center justify-center space-x-3 mt-1">
                            <ClockIcon className="w-8 h-8 text-white/90" />
                            <div className="text-left">
                                <p className="text-5xl font-mono tracking-wider text-white">{currentSessionDuration}</p>
                                {currentSessionStart && (
                                    <p className="text-sm text-white/80 -mt-1">
                                        Iniziato alle {new Date(currentSessionStart).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    (dayTotalWorkMs ?? 0) > 0 ? (
                        <div className="animate-fade-in-up">
                            <p className="text-sm text-gray-500 dark:text-slate-400">Ore da Timbrature</p>
                            <div className="flex items-center justify-center space-x-3 mt-1">
                                <ClockIcon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                                <div className="text-left">
                                    <p className="text-5xl font-mono tracking-wider text-slate-800 dark:text-white">
                                        {formatDuration(dayTotalWorkMs!)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        (Solo timbrature, esclusi straordinari manuali)
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up flex items-center justify-center h-full">
                             <p className="text-gray-500 dark:text-slate-400">Nessuna attività registrata.</p>
                        </div>
                    )
                )}
            </div>
        </div>
        
        <div className="text-center mt-auto">
             <p className={`h-10 mb-4 mt-2 ${isClockedIn ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}`}>
                {getInstructionalText()}
            </p>
             {isClockedIn ? (
                <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="12" />
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: offset,
                                transition: 'stroke-dashoffset 1s linear',
                            }}
                        />
                    </svg>
                    <button
                        onClick={handleClick}
                        disabled={isAnimating}
                        className={`${circularButtonClasses} ${buttonColorClasses}`}
                        aria-label={isAnimating ? 'Registrato' : actionText}
                    >
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <FingerprintIcon className={`absolute w-10 h-10 ${isAnimating ? 'animate-fingerprint-fade-out' : 'opacity-100'}`} />
                            <CheckmarkIcon className={`absolute w-10 h-10 ${isAnimating ? 'animate-checkmark-pop' : 'opacity-0'}`} />
                        </div>
                        <span className="text-base font-semibold">{isAnimating ? 'Registrato!' : actionText}</span>
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleClick}
                    disabled={disabled || isAnimating}
                    className={`${buttonBaseClasses} ${buttonColorClasses}`}
                    aria-label={disabled ? 'Timbratura disabilitata' : (isAnimating ? 'Registrato' : actionText)}
                >
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        <FingerprintIcon className={`absolute ${isAnimating ? 'animate-fingerprint-fade-out' : 'opacity-100'}`} />
                        <CheckmarkIcon className={`absolute ${isAnimating ? 'animate-checkmark-pop' : 'opacity-0'}`} />
                    </div>
                    <span>{isAnimating ? 'Registrato!' : (nfcSupported && !disabled ? 'Scansiona Tag NFC' : actionText)}</span>
                </button>
            )}
        </div>
    </div>
  );
};

export default NfcScanner;

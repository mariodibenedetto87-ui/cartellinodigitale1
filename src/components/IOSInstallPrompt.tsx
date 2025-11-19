import React, { useState, useEffect } from 'react';

/**
 * Componente per guidare gli utenti iOS nell'installazione della PWA
 */
const IOSInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verifica se l'utente è su iOS e non sta già usando la PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    const hasSeenPrompt = localStorage.getItem('ios-install-prompt-seen');

    // Mostra il prompt solo se:
    // 1. È un dispositivo iOS
    // 2. Non è già in modalità standalone (installato)
    // 3. L'utente non ha già visto il prompt
    if (isIOS && !isStandalone && !hasSeenPrompt) {
      // Mostra dopo 3 secondi
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-seen', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full pointer-events-auto animate-fade-in-up border-2 border-teal-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-2xl">
              ⏱
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Installa CartellinoPro</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Accesso rapido e offline</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Chiudi"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-2">
            <span className="text-teal-500 mt-0.5">1.</span>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Tocca il pulsante <strong>Condividi</strong> 
              <svg className="inline w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              in basso
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-teal-500 mt-0.5">2.</span>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Scorri e seleziona <strong>"Aggiungi a Home"</strong>
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-teal-500 mt-0.5">3.</span>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Conferma per creare l'icona
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Non ora
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors"
          >
            Capito!
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallPrompt;

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica che siamo in ambiente browser
    if (typeof window === 'undefined') return;

    // Verifica se l'app è già installata
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verifica se è già stata installata in precedenza
    if (typeof localStorage !== 'undefined') {
      const wasInstalled = localStorage.getItem('pwa-installed');
      if (wasInstalled === 'true') {
        setIsInstalled(true);
        return;
      }
    }

    // Ascolta l'evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Mostra il prompt dopo 30 secondi se non è stato già mostrato
      if (typeof localStorage !== 'undefined') {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        if (!hasSeenPrompt) {
          setTimeout(() => {
            setShowPrompt(true);
          }, 30000); // 30 secondi
        }
      }
    };

    // Ascolta quando l'app viene installata
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pwa-installed', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Mostra il prompt di installazione nativo
      await deferredPrompt.prompt();

      // Aspetta la scelta dell'utente
      await deferredPrompt.userChoice;

      // Salva che l'utente ha visto il prompt
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pwa-install-prompt-seen', 'true');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      // Resetta lo stato
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      
      // Ri-mostra dopo 7 giorni se l'utente dismette
      setTimeout(() => {
        localStorage.removeItem('pwa-install-prompt-seen');
      }, 7 * 24 * 60 * 60 * 1000); // 7 giorni
    }
  };

  // Non mostrare se già installata o se non c'è il prompt
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-teal-500 to-cyan-500 shadow-2xl animate-slide-up">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg mb-1">
              📱 Installa Timecard Pro
            </h3>
            <p className="text-white/90 text-sm">
              Accesso rapido dalla home, funziona offline e ricevi notifiche!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all backdrop-blur-sm"
              aria-label="Chiudi"
            >
              Dopo
            </button>
            <button
              onClick={handleInstallClick}
              className="px-6 py-2 bg-white hover:bg-gray-100 text-teal-600 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              aria-label="Installa"
            >
              Installa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { DashboardLayout, WidgetVisibility } from '../types';

interface DashboardLayoutEditorProps {
  currentLayout: DashboardLayout;
  widgetVisibility: WidgetVisibility;
  onLayoutChange: (newLayout: DashboardLayout) => void;
  onVisibilityChange: (widgetId: string, visible: boolean) => void;
  onClose: () => void;
}

const widgetInfo: Record<string, { name: string; description: string; minW: number; minH: number; defaultW: number; defaultH: number; category: 'main' | 'sidebar' }> = {
  smartNotifications: { name: 'Controllo Presenze', description: 'Notifiche intelligenti e gestione timbrature', minW: 2, minH: 2, defaultW: 4, defaultH: 3, category: 'main' },
  nfcScanner: { name: 'Scanner NFC', description: 'Scansione badge NFC/QR', minW: 2, minH: 2, defaultW: 4, defaultH: 2, category: 'main' },
  summary: { name: 'Riepilogo del Giorno', description: 'Ore lavorate oggi', minW: 2, minH: 2, defaultW: 4, defaultH: 3, category: 'main' },
  dashboardInsights: { name: 'Statistiche Comparative', description: 'Analisi settimanali e suggerimenti', minW: 2, minH: 3, defaultW: 4, defaultH: 4, category: 'main' },
  mealVoucherCard: { name: 'Buoni Pasto', description: 'Gestione ticket restaurant', minW: 2, minH: 2, defaultW: 4, defaultH: 2, category: 'main' },
  plannerCard: { name: 'Pianificazione Rapida', description: 'Pianifica turni e ferie', minW: 2, minH: 2, defaultW: 3, defaultH: 3, category: 'sidebar' },
  offerCard: { name: 'Offerta Speciale', description: 'Banner promozionale', minW: 2, minH: 2, defaultW: 3, defaultH: 2, category: 'sidebar' },
  balancesSummary: { name: 'Saldi Principali', description: 'Riepilogo ferie e permessi', minW: 2, minH: 3, defaultW: 3, defaultH: 4, category: 'sidebar' },
  monthlySummary: { name: 'Riepilogo Mensile', description: 'Statistiche del mese corrente', minW: 2, minH: 2, defaultW: 3, defaultH: 3, category: 'sidebar' },
  weeklySummary: { name: 'Riepilogo Settimanale', description: 'Ore della settimana', minW: 2, minH: 2, defaultW: 3, defaultH: 2, category: 'sidebar' },
  weeklyHoursChart: { name: 'Grafico Ore Settimanali', description: 'Visualizzazione grafica ore settimanali', minW: 2, minH: 3, defaultW: 3, defaultH: 3, category: 'sidebar' },
};

export default function DashboardLayoutEditor({
  widgetVisibility,
  onLayoutChange,
  onVisibilityChange,
  onClose,
}: DashboardLayoutEditorProps) {
  const handleSave = () => {
    // Save current visibility state
    showToast('Impostazioni salvate con successo!');
    onClose();
  };

  const handleReset = () => {
    // Reset to default layout
    const defaultLayout: DashboardLayout = {
      main: ['smartNotifications', 'nfcScanner', 'summary', 'dashboardInsights', 'mealVoucherCard'],
      sidebar: ['plannerCard', 'offerCard', 'balancesSummary', 'monthlySummary', 'weeklySummary', 'weeklyHoursChart'],
    };
    onLayoutChange(defaultLayout);
    
    // Reset all visibility to true
    Object.keys(widgetInfo).forEach(widgetId => {
      onVisibilityChange(widgetId, true);
    });
    
    showToast('Layout ripristinato al default!');
  };

  const showToast = (message: string) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Gestione Widget Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-600 mt-1">
              Attiva o disattiva i widget e riordinali trascinandoli per personalizzare la tua dashboard.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Widget Visibility Controls */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonna Principale */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                Colonna Principale
              </h4>
              <div className="space-y-2">
                {Object.entries(widgetInfo)
                  .filter(([_, info]) => info.category === 'main')
                  .map(([widgetId, info]) => (
                    <label
                      key={widgetId}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="relative inline-block w-12 h-6 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={widgetVisibility[widgetId] !== false}
                          onChange={(e) => onVisibilityChange(widgetId, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {info.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-600 truncate">
                          {info.description}
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            {/* Barra Laterale */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                Barra Laterale
              </h4>
              <div className="space-y-2">
                {Object.entries(widgetInfo)
                  .filter(([_, info]) => info.category === 'sidebar')
                  .map(([widgetId, info]) => (
                    <label
                      key={widgetId}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="relative inline-block w-12 h-6 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={widgetVisibility[widgetId] !== false}
                          onChange={(e) => onVisibilityChange(widgetId, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {info.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-600 truncate">
                          {info.description}
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>



        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
          >
            Ripristina Default
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all shadow-md"
            >
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

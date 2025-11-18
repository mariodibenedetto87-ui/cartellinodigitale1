import { useState, useCallback } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { DashboardLayout, WidgetVisibility } from '../types';

interface DashboardLayoutEditorProps {
  currentLayout: DashboardLayout;
  widgetVisibility: WidgetVisibility;
  onLayoutChange: (newLayout: DashboardLayout) => void;
  onVisibilityChange: (widgetId: string, visible: boolean) => void;
  onClose: () => void;
}

const widgetInfo: Record<string, { name: string; description: string; minW: number; minH: number; defaultW: number; defaultH: number }> = {
  smartNotifications: { name: 'Notifiche Smart', description: 'Notifiche intelligenti e suggerimenti', minW: 2, minH: 2, defaultW: 4, defaultH: 3 },
  nfcScanner: { name: 'Scanner NFC', description: 'Scansione badge NFC/QR', minW: 2, minH: 2, defaultW: 4, defaultH: 2 },
  summary: { name: 'Riepilogo Giorno', description: 'Ore lavorate oggi', minW: 2, minH: 2, defaultW: 4, defaultH: 3 },
  dashboardInsights: { name: 'Insights AI', description: 'Analisi settimanali e suggerimenti', minW: 2, minH: 3, defaultW: 4, defaultH: 4 },
  mealVoucherCard: { name: 'Buoni Pasto', description: 'Gestione ticket restaurant', minW: 2, minH: 2, defaultW: 4, defaultH: 2 },
  plannerCard: { name: 'Pianificatore', description: 'Pianifica turni e ferie', minW: 2, minH: 2, defaultW: 3, defaultH: 3 },
  offerCard: { name: 'Offerta Speciale', description: 'Banner promozionale', minW: 2, minH: 2, defaultW: 3, defaultH: 2 },
  balancesSummary: { name: 'Saldi', description: 'Riepilogo ferie e permessi', minW: 2, minH: 3, defaultW: 3, defaultH: 4 },
  monthlySummary: { name: 'Riepilogo Mensile', description: 'Statistiche del mese', minW: 2, minH: 2, defaultW: 3, defaultH: 3 },
  weeklySummary: { name: 'Riepilogo Settimanale', description: 'Ore della settimana', minW: 2, minH: 2, defaultW: 3, defaultH: 2 },
  weeklyHoursChart: { name: 'Grafico Ore', description: 'Grafico ore settimanali', minW: 2, minH: 3, defaultW: 3, defaultH: 3 },
};

export default function DashboardLayoutEditor({
  currentLayout,
  widgetVisibility,
  onLayoutChange,
  onVisibilityChange,
  onClose,
}: DashboardLayoutEditorProps) {
  const [editMode, setEditMode] = useState(false);
  const [localLayout, setLocalLayout] = useState<Layout[]>(() => {
    // Convert DashboardLayout to react-grid-layout format
    const allWidgets = [...currentLayout.main, ...currentLayout.sidebar];
    return allWidgets.map((widgetId, index) => {
      const info = widgetInfo[widgetId] || { defaultW: 3, defaultH: 2, minW: 2, minH: 2 };
      return {
        i: widgetId,
        x: (index % 4) * 3,
        y: Math.floor(index / 4) * 3,
        w: info.defaultW,
        h: info.defaultH,
        minW: info.minW,
        minH: info.minH,
      };
    });
  });

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLocalLayout(newLayout);
  }, []);

  const handleSave = () => {
    // Convert react-grid-layout format back to DashboardLayout
    // Split into main (first 5) and sidebar (rest)
    const visibleWidgets = localLayout
      .filter(item => widgetVisibility[item.i] !== false)
      .sort((a, b) => {
        if (a.y === b.y) return a.x - b.x;
        return a.y - b.y;
      })
      .map(item => item.i);

    const newLayout: DashboardLayout = {
      main: visibleWidgets.slice(0, 5),
      sidebar: visibleWidgets.slice(5),
    };

    onLayoutChange(newLayout);
    showToast('Layout salvato!');
    setEditMode(false);
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
    
    // Recreate local layout
    const allWidgets = [...defaultLayout.main, ...defaultLayout.sidebar];
    const resetLayout = allWidgets.map((widgetId, index) => {
      const info = widgetInfo[widgetId] || { defaultW: 3, defaultH: 2, minW: 2, minH: 2 };
      return {
        i: widgetId,
        x: (index % 4) * 3,
        y: Math.floor(index / 4) * 3,
        w: info.defaultW,
        h: info.defaultH,
        minW: info.minW,
        minH: info.minH,
      };
    });
    setLocalLayout(resetLayout);
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
              Personalizza Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mostra/nascondi widgets e riorganizza il layout
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Widget Visibility Controls */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Visibilità Widgets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(widgetInfo).map(([widgetId, info]) => (
              <label
                key={widgetId}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={widgetVisibility[widgetId] !== false}
                  onChange={(e) => onVisibilityChange(widgetId, e.target.checked)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {info.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {info.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Layout Editor */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Riorganizza Layout
            </h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                editMode
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {editMode ? '✓ Modalità Modifica Attiva' : 'Attiva Modifica'}
            </button>
          </div>

          {editMode && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Suggerimento:</strong> Trascina i widgets per riorganizzarli. Ridimensionali trascinando gli angoli.
              </p>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[400px]">
            <GridLayout
              className="layout"
              layout={localLayout}
              cols={12}
              rowHeight={60}
              width={1000}
              isDraggable={editMode}
              isResizable={editMode}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
            >
              {localLayout
                .filter(item => widgetVisibility[item.i] !== false)
                .map(item => (
                  <div key={item.i} className="bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden">
                    <div className={`h-full flex flex-col ${editMode ? 'drag-handle cursor-move' : ''}`}>
                      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
                        {editMode && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        )}
                        {widgetInfo[item.i]?.name || item.i}
                      </div>
                      <div className="flex-1 p-3 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                        {widgetInfo[item.i]?.description || 'Widget'}
                      </div>
                    </div>
                  </div>
                ))}
            </GridLayout>
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

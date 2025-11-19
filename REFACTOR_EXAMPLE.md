# 🔄 Esempio di Refactor con Context API

## Prima: DashboardPage con Prop Drilling

```tsx
// 24 PROPS! 😱
interface DashboardPageProps {
    session: Session | null;
    allLogs: AllTimeLogs;
    allDayInfo: AllDayInfo;
    allManualOvertime: AllManualOvertime;
    allMealVouchers: AllMealVouchers;
    selectedDate: Date;
    workStatus: WorkStatus;
    currentSessionStart: Date | null;
    currentSessionDuration: string;
    workSettings: WorkSettings;
    offerSettings: OfferSettings;
    statusItems: StatusItem[];
    smartNotifications: SmartNotification[];
    dashboardLayout: DashboardLayout;
    widgetVisibility: WidgetVisibility;
    onNavigateToCalendar: () => void;
    onToggle: () => void;
    onOpenQuickLeaveModal: (options: { date: Date }) => void;
    onSetSelectedDate: (date: Date) => void;
    onDismissNotification: (id: string) => void;
    onEditEntry: (dateKey: string, entryId: string, newTimestamp: Date, newType: 'in' | 'out') => void;
    onDeleteEntry: (dateKey: string, entryId: string) => void;
    onOpenAddEntryModal: (date: Date) => void;
    onOpenAddManualEntryModal: (date: Date) => void;
    onDeleteManualOvertime: (dateKey: string, entryId: string) => void;
    onOpenRangePlanner: (options?: { startDate?: Date }) => void;
    onOpenAddOvertimeModal: (date: Date) => void;
    onOpenMealVoucherModal: (date: Date) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { 
        session, allLogs, allDayInfo, allManualOvertime, allMealVouchers, 
        selectedDate, workStatus, currentSessionStart, currentSessionDuration, 
        workSettings, offerSettings, statusItems, smartNotifications, 
        onToggle, onSetSelectedDate, onEditEntry, onDeleteEntry, 
        onOpenAddEntryModal, onOpenAddManualEntryModal, onDeleteManualOvertime, 
        onDismissNotification, dashboardLayout, widgetVisibility, 
        onOpenRangePlanner, onOpenQuickLeaveModal, onOpenAddOvertimeModal, 
        onOpenMealVoucherModal
    } = props;
    
    // ... resto del codice
};
```

## Dopo: DashboardPage con Context API

```tsx
// ZERO PROPS! 🎉
const DashboardPage: React.FC = () => {
    // Accesso diretto al context - nessuna prop!
    const {
        session,
        allLogs,
        allDayInfo,
        allManualOvertime,
        allMealVouchers,
        selectedDate,
        setSelectedDate,
        workStatus,
        currentSessionStart,
        currentSessionDuration,
        settings: { workSettings, offerSettings, statusItems, dashboardLayout, widgetVisibility },
        smartNotifications,
        setSmartNotifications,
        setCurrentPage,
    } = useAppContext();
    
    // Handlers dal custom hook
    const {
        handleEditEntry,
        handleDeleteEntry,
        handleDeleteManualOvertime,
    } = useAppLogic();
    
    // Handlers locali per modals (questi rimarranno in App.tsx per ora)
    const [showQuickLeaveModal, setShowQuickLeaveModal] = useState(false);
    const [addEntryModalDate, setAddEntryModalDate] = useState<Date | null>(null);
    
    // ... resto del codice identico
};
```

## Benefici

### Riduzione Codice
- **Props**: 24 → 0 (-100%)
- **Interface lines**: 28 → 0 (-100%)
- **Destructuring**: 8 linee → 3 linee (-62%)

### Manutenibilità
- Aggiungere nuovo stato: 1 modifica (Context) invece di 10+ (ogni componente)
- Testing: Mock solo Context invece di 24 props
- Refactoring: Cambi interface Context, tutto si aggiorna automaticamente

### Performance
- Re-render solo quando effettivamente cambia lo stato usato
- React.memo funziona meglio (meno props = meno confronti)

## Step di Migrazione

1. ✅ Creare AppContext
2. ✅ Creare useAppLogic hook
3. ⏳ Refactor DashboardPage
4. ⏳ Refactor CalendarPage  
5. ⏳ Refactor BalancesPage
6. ⏳ Refactor SettingsPage
7. ⏳ Rimuovere props da App.tsx

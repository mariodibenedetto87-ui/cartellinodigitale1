import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { WorkSettings, OfferSettings, ThemeSettings, StatusItem, SavedRotation, DashboardLayout, WidgetVisibility, WorkLocation } from '../types';
import { defaultStatusItems } from '../data/statusItems';
import { applyTheme } from '../utils/themeUtils';
import Toast from '../components/Toast';

interface SettingsState {
    workSettings: WorkSettings;
    offerSettings: OfferSettings;
    themeSettings: ThemeSettings;
    statusItems: StatusItem[];
    savedRotations: SavedRotation[];
    dashboardLayout: DashboardLayout;
    widgetVisibility: WidgetVisibility;
}

interface SettingsContextType {
    settings: SettingsState;
    setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
    workLocation: WorkLocation | null;
    setWorkLocation: (location: WorkLocation | null) => void;
    saveSettings: (newSettings: SettingsState) => Promise<void>;
    // Helper methods for updating specific settings
    updateWorkSettings: (workSettings: WorkSettings) => void;
    updateOfferSettings: (offerSettings: OfferSettings) => void;
    updateThemeSettings: (themeSettings: ThemeSettings) => void;
    updateDashboardLayout: (layout: DashboardLayout) => void;
    updateWidgetVisibility: (visibility: WidgetVisibility) => void;
    updateSavedRotations: (rotations: SavedRotation[]) => void;
    updateStatusItems: (items: StatusItem[]) => void;
    updateWorkLocation: (location: WorkLocation | null) => void;
    removeWorkLocation: () => void;
}

const defaultSettings: SettingsState = {
    workSettings: {
        standardDayHours: 6,
        nightTimeStartHour: 22,
        nightTimeEndHour: 6,
        treatHolidayAsOvertime: true,
        enableClockInReminder: false,
        enableClockOutReminder: true,
        deductAutoBreak: false,
        autoBreakThresholdHours: 6,
        autoBreakMinutes: 30,
        shifts: [
            { id: 'morning', name: 'Mattina', startHour: 8, startMinute: 0, endHour: 14, endMinute: 0, textColor: 'text-rose-800 dark:text-rose-200', bgColor: 'bg-rose-100 dark:bg-rose-900/50' },
            { id: 'afternoon', name: 'Pomeriggio', startHour: 14, startMinute: 0, endHour: 20, endMinute: 0, textColor: 'text-sky-800 dark:text-sky-200', bgColor: 'bg-sky-100 dark:bg-sky-900/50' },
            { id: 'evening', name: 'Serale', startHour: 16, startMinute: 0, endHour: 22, endMinute: 0, textColor: 'text-indigo-800 dark:text-indigo-200', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
            { id: 'night', name: 'Notturno', startHour: 21, startMinute: 0, endHour: 3, endMinute: 0, textColor: 'text-purple-800 dark:text-purple-200', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
            { id: 'rest', name: 'Riposo', startHour: null, endHour: null, textColor: 'text-pink-800 dark:text-pink-200', bgColor: 'bg-pink-100 dark:bg-pink-900/50' },
        ],
    },
    offerSettings: { title: '', description: '', imageUrl: '' },
    themeSettings: { accentColor: 'teal', primaryShade: '500' },
    statusItems: defaultStatusItems,
    savedRotations: [],
    dashboardLayout: {
        main: ['smartNotifications', 'nfcScanner', 'summary', 'dashboardInsights', 'mealVoucherCard'],
        sidebar: ['plannerCard', 'offerCard', 'balancesSummary', 'monthlySummary', 'weeklySummary', 'weeklyHoursChart']
    },
    widgetVisibility: {
        smartNotifications: true, nfcScanner: true, summary: true, dashboardInsights: true,
        mealVoucherCard: true, plannerCard: true, offerCard: true,
        balancesSummary: true, monthlySummary: true, weeklySummary: true,
        weeklyHoursChart: false,
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to debounce saving to Supabase
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: number;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            clearTimeout(timeout);
            timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
        });
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading } = useAuth();
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [workLocation, setWorkLocation] = useState<WorkLocation | null>(null);
    const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' }[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    useEffect(() => {
        if (session) {
            const fetchSettings = async () => {
                const { data: settingsData, error: settingsError } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                if (settingsData) {
                    setSettings(prevSettings => {
                        // Merge Logic for Shifts
                        const loadedShifts = settingsData.work_settings?.shifts || [];
                        const defaultShifts = prevSettings.workSettings.shifts;

                        const mergedShifts = [...loadedShifts];
                        defaultShifts.forEach((ds: any) => {
                            if (!mergedShifts.find((ls: any) => ls.id === ds.id)) {
                                mergedShifts.push(ds);
                            }
                        });

                        // Merge dashboard layout
                        const loadedMainLayout = settingsData.dashboard_layout?.main || [];
                        const defaultMainLayout = prevSettings.dashboardLayout.main;
                        const mergedMainLayout = [...loadedMainLayout];
                        defaultMainLayout.forEach((widget: string) => {
                            if (!mergedMainLayout.includes(widget)) {
                                mergedMainLayout.push(widget);
                            }
                        });

                        const loadedSidebarLayout = settingsData.dashboard_layout?.sidebar || [];
                        const defaultSidebarLayout = prevSettings.dashboardLayout.sidebar;
                        const mergedSidebarLayout = [...loadedSidebarLayout];
                        defaultSidebarLayout.forEach((widget: string) => {
                            if (!mergedSidebarLayout.includes(widget)) {
                                mergedSidebarLayout.push(widget);
                            }
                        });

                        const uniqueMainLayout = mergedMainLayout.filter(widget => !mergedSidebarLayout.includes(widget));

                        return {
                            workSettings: {
                                ...prevSettings.workSettings,
                                ...settingsData.work_settings,
                                shifts: mergedShifts,
                                ...(settingsData.work_settings?.workLocation && {
                                    workLocation: settingsData.work_settings.workLocation
                                })
                            },
                            offerSettings: { ...prevSettings.offerSettings, ...settingsData.offer_settings },
                            themeSettings: settingsData.theme_settings
                                ? { ...prevSettings.themeSettings, ...settingsData.theme_settings }
                                : prevSettings.themeSettings,
                            dashboardLayout: {
                                main: uniqueMainLayout,
                                sidebar: mergedSidebarLayout
                            },
                            widgetVisibility: {
                                ...prevSettings.widgetVisibility,
                                ...settingsData.widget_visibility
                            },
                            statusItems: settingsData.status_items || prevSettings.statusItems,
                            savedRotations: settingsData.saved_rotations || prevSettings.savedRotations,
                        };
                    });

                    if (settingsData.work_settings?.workLocation) {
                        setWorkLocation(settingsData.work_settings.workLocation);
                    }
                } else if (settingsError && settingsError.code === 'PGRST116') {
                    // Insert new user settings
                    const insertData: any = {
                        user_id: session.user.id,
                        work_settings: settings.workSettings,
                        offer_settings: settings.offerSettings,
                        dashboard_layout: settings.dashboardLayout,
                        widget_visibility: settings.widgetVisibility,
                        status_items: settings.statusItems,
                        saved_rotations: settings.savedRotations,
                    };

                    const { error: insertError } = await supabase.from('user_settings').insert(insertData);
                    if (insertError) console.error('Error creating settings:', insertError);
                }
            };
            fetchSettings();
        }
    }, [session]);

    // Apply theme
    useEffect(() => {
        applyTheme(settings.themeSettings.accentColor, settings.themeSettings.primaryShade);
    }, [settings.themeSettings]);

    const debouncedSaveSettings = useCallback(debounce(async (newSettings: SettingsState, currentLocation: WorkLocation | null) => {
        if (!session) return;

        const updateData = {
            work_settings: { ...newSettings.workSettings, workLocation: currentLocation },
            offer_settings: newSettings.offerSettings,
            dashboard_layout: newSettings.dashboardLayout,
            widget_visibility: newSettings.widgetVisibility,
            status_items: newSettings.statusItems,
            saved_rotations: newSettings.savedRotations,
            theme_settings: newSettings.themeSettings,
        };

        try {
            const { error } = await supabase
                .from('user_settings')
                .update(updateData)
                .eq('user_id', session.user.id);

            if (error) {
                console.error('Error saving settings:', error);
                showToast(`Salvataggio fallito: ${error.message}`, 'error');
            } else {
                showToast('Impostazioni salvate nel cloud!');
            }
        } catch (err: any) {
            showToast(`Errore: ${err.message}`, 'error');
        }
    }, 5000), [session, showToast]);

    const saveSettings = async (newSettings: SettingsState) => {
        setSettings(newSettings);
        debouncedSaveSettings(newSettings, workLocation);
    };

    // Helper methods for updating specific settings
    const updateWorkSettings = useCallback((workSettings: WorkSettings) => {
        setSettings(prev => {
            const newSettings = { ...prev, workSettings };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
    }, [workLocation, debouncedSaveSettings]);

    const updateOfferSettings = useCallback((offerSettings: OfferSettings) => {
        setSettings(prev => {
            const newSettings = { ...prev, offerSettings };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
    }, [workLocation, debouncedSaveSettings]);

    const updateThemeSettings = useCallback((themeSettings: ThemeSettings) => {
        setSettings(prev => {
            const newSettings = { ...prev, themeSettings };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
        applyTheme(themeSettings.accentColor, themeSettings.primaryShade);
    }, [workLocation, debouncedSaveSettings]);

    const updateDashboardLayout = useCallback((dashboardLayout: DashboardLayout) => {
        setSettings(prev => {
            const newSettings = { ...prev, dashboardLayout };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
    }, [workLocation, debouncedSaveSettings]);

    const updateWidgetVisibility = useCallback((widgetVisibility: WidgetVisibility) => {
        setSettings(prev => {
            const newSettings = { ...prev, widgetVisibility };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
    }, [workLocation, debouncedSaveSettings]);

    const updateSavedRotations = useCallback((savedRotations: SavedRotation[]) => {
        setSettings(prev => {
            const newSettings = { ...prev, savedRotations };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
    }, [workLocation, debouncedSaveSettings]);

    const updateStatusItems = useCallback((statusItems: StatusItem[]) => {
        setSettings(prev => {
            const newSettings = { ...prev, statusItems };
            debouncedSaveSettings(newSettings, workLocation);
            return newSettings;
        });
    }, [workLocation, debouncedSaveSettings]);

    const updateWorkLocation = useCallback((location: WorkLocation | null) => {
        setWorkLocation(location);
        // Note: workLocation save is triggered by the useEffect
    }, []);

    const removeWorkLocation = useCallback(() => {
        setWorkLocation(null);
    }, []);

    // Also trigger save when workLocation changes
    useEffect(() => {
        if (session && !loading) {
            debouncedSaveSettings(settings, workLocation);
        }
    }, [workLocation]);

    return (
        <SettingsContext.Provider value={{
            settings,
            setSettings,
            workLocation,
            setWorkLocation,
            saveSettings,
            updateWorkSettings,
            updateOfferSettings,
            updateThemeSettings,
            updateDashboardLayout,
            updateWidgetVisibility,
            updateSavedRotations,
            updateStatusItems,
            updateWorkLocation,
            removeWorkLocation
        }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
                ))}
            </div>
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

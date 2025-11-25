import React from 'react';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import AddTimeEntryModal from './AddTimeEntryModal';
import AddManualEntryModal from './AddManualEntryModal';

/**
 * ModalManager - Centralized modal rendering based on UIContext state
 * Renders key modals that are needed across the application
 */
const ModalManager: React.FC = () => {
    const {
        addEntryModalDate, setAddEntryModalDate,
        addManualEntryModalDate, setAddManualEntryModalDate,
    } = useUI();

    const {
        handleAddEntry, handleAddOvertime
    } = useData();

    const { settings } = useSettings();
    const { statusItems } = settings;

    return (
        <>
            {/* Add Time Entry Modal */}
            {addEntryModalDate && (
                <AddTimeEntryModal
                    date={addEntryModalDate}
                    onClose={() => setAddEntryModalDate(null)}
                    onSave={(timestamp, type) => {
                        handleAddEntry(timestamp, type);
                        setAddEntryModalDate(null);
                    }}
                />
            )}

            {/* Add Manual Entry Modal (Straordinario manuale) */}
            {addManualEntryModalDate && (
                <AddManualEntryModal
                    date={addManualEntryModalDate}
                    statusItems={statusItems}
                    onClose={() => setAddManualEntryModalDate(null)}
                    onSave={(dateKey, durationMs, type, note) => {
                        handleAddOvertime(dateKey, durationMs, type, note);
                        setAddManualEntryModalDate(null);
                    }}
                />
            )}
        </>
    );
};

export default ModalManager;

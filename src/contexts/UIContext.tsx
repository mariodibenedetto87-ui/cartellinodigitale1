import React, { createContext, useContext, useState } from 'react';
import { LeaveType } from '../types';

interface UIContextType {
    // Modal States
    quickLeaveModalOptions: { date: Date; highlightedLeave?: LeaveType } | null;
    setQuickLeaveModalOptions: (options: { date: Date; highlightedLeave?: LeaveType } | null) => void;

    addEntryModalDate: Date | null;
    setAddEntryModalDate: (date: Date | null) => void;

    addManualEntryModalDate: Date | null;
    setAddManualEntryModalDate: (date: Date | null) => void;

    hoursJustificationModal: { date: Date; mode: 'extra' | 'missing' } | null;
    setHoursJustificationModal: (options: { date: Date; mode: 'extra' | 'missing' } | null) => void;

    absenceJustificationModalDate: Date | null;
    setAbsenceJustificationModalDate: (date: Date | null) => void;

    mealVoucherModalDate: Date | null;
    setMealVoucherModalDate: (date: Date | null) => void;

    rangePlannerOptions: { isOpen: boolean; startDate?: Date };
    setRangePlannerOptions: (options: { isOpen: boolean; startDate?: Date }) => void;

    isGlobalSearchOpen: boolean;
    setIsGlobalSearchOpen: (isOpen: boolean) => void;

    // Helper functions to open modals
    openQuickLeaveModal: (date: Date, highlightedLeave?: LeaveType) => void;
    openAddEntryModal: (date: Date) => void;
    openAddManualEntryModal: (date: Date) => void;
    openAddOvertimeModal: (date: Date) => void;
    openHoursMissingModal: (date: Date) => void;
    openAbsenceJustificationModal: (date: Date) => void;
    openMealVoucherModal: (date: Date) => void;
    openRangePlanner: (startDate?: Date) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [quickLeaveModalOptions, setQuickLeaveModalOptions] = useState<{ date: Date; highlightedLeave?: LeaveType } | null>(null);
    const [addEntryModalDate, setAddEntryModalDate] = useState<Date | null>(null);
    const [addManualEntryModalDate, setAddManualEntryModalDate] = useState<Date | null>(null);
    const [hoursJustificationModal, setHoursJustificationModal] = useState<{ date: Date; mode: 'extra' | 'missing' } | null>(null);
    const [absenceJustificationModalDate, setAbsenceJustificationModalDate] = useState<Date | null>(null);
    const [mealVoucherModalDate, setMealVoucherModalDate] = useState<Date | null>(null);
    const [rangePlannerOptions, setRangePlannerOptions] = useState<{ isOpen: boolean; startDate?: Date }>({ isOpen: false });
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

    const openQuickLeaveModal = (date: Date, highlightedLeave?: LeaveType) => setQuickLeaveModalOptions({ date, highlightedLeave });
    const openAddEntryModal = (date: Date) => setAddEntryModalDate(date);
    const openAddManualEntryModal = (date: Date) => setAddManualEntryModalDate(date);
    const openAddOvertimeModal = (date: Date) => setHoursJustificationModal({ date, mode: 'extra' });
    const openHoursMissingModal = (date: Date) => setHoursJustificationModal({ date, mode: 'missing' });
    const openAbsenceJustificationModal = (date: Date) => setAbsenceJustificationModalDate(date);
    const openMealVoucherModal = (date: Date) => setMealVoucherModalDate(date);
    const openRangePlanner = (startDate?: Date) => setRangePlannerOptions({ isOpen: true, startDate });

    return (
        <UIContext.Provider value={{
            quickLeaveModalOptions, setQuickLeaveModalOptions,
            addEntryModalDate, setAddEntryModalDate,
            addManualEntryModalDate, setAddManualEntryModalDate,
            hoursJustificationModal, setHoursJustificationModal,
            absenceJustificationModalDate, setAbsenceJustificationModalDate,
            mealVoucherModalDate, setMealVoucherModalDate,
            rangePlannerOptions, setRangePlannerOptions,
            isGlobalSearchOpen, setIsGlobalSearchOpen,
            openQuickLeaveModal, openAddEntryModal, openAddManualEntryModal,
            openAddOvertimeModal, openHoursMissingModal, openAbsenceJustificationModal,
            openMealVoucherModal, openRangePlanner
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

// ENUMS & LITERAL TYPES
export enum WorkStatus {
    ClockedIn = 'CLOCK_IN',
    ClockedOut = 'CLOCK_OUT',
}

export interface Shift {
  id: string;
  name: string;
  startHour: number | null;
  endHour: number | null;
  textColor: string;
  bgColor: string;
}

export type ShiftType = string; // This will be the shift ID
export type LeaveType = string; // e.g., 'vacation', 'code-15'
export type CalendarView = 'day' | 'week' | 'month' | 'year';
export type ManualOvertimeType = string;
export type ShiftTool = ShiftType | 'eraser';
export type CustomLeaveType = string;
export interface LeaveEntitlements {
    [leaveType: string]: {
        total: number;
        used: number;
    };
}

// DATA STRUCTURES
export interface TimeEntry {
    id: string;
    timestamp: Date;
    type: 'in' | 'out';
}

export interface AllTimeLogs {
    [dateKey: string]: TimeEntry[];
}

export interface CalendarEvent {
    id: string;
    type: 'shift' | 'leave' | 'onCall';
    shift?: ShiftType;
    leave?: {
        type: LeaveType;
        hours?: number;
    };
    onCall?: boolean;
}

export interface DayInfo {
    // Manteniamo i campi vecchi per retrocompatibilità
    shift?: ShiftType;
    leave?: {
        type: LeaveType;
        hours?: number;
    };
    onCall?: boolean;
    // Nuovo campo per supportare più eventi
    events?: CalendarEvent[];
}

export interface AllDayInfo {
    [dateKey: string]: DayInfo;
}

export interface ManualOvertimeEntry {
    id: string;
    durationMs: number;
    type: ManualOvertimeType;
    note: string;
    usedEntryIds?: string[]; // IDs delle timbrature usate per questa giustificazione
}

export interface AllManualOvertime {
    [dateKey: string]: ManualOvertimeEntry[];
}

export interface MealVoucher {
    id: string;
    date: string; // YYYY-MM-DD format
    earned: boolean;
    manual: boolean;
    note: string;
}

export interface AllMealVouchers {
    [dateKey: string]: MealVoucher;
}


// SETTINGS & CONFIG
export interface WorkSettings {
    standardDayHours: number;
    nightTimeStartHour: number;
    nightTimeEndHour: number;
    treatHolidayAsOvertime: boolean;
    enableClockInReminder: boolean;
    enableClockOutReminder: boolean;
    deductAutoBreak: boolean;
    autoBreakThresholdHours: number;
    autoBreakMinutes: number;
    shifts: Shift[];
}

export interface OfferSettings {
    title: string;
    description: string;
    imageUrl: string;
}

export interface ThemeSettings {
    accentColor: string; // e.g., 'teal', 'blue', 'purple', 'orange', 'green'
    primaryShade: string; // e.g., '500', '600'
}

export interface StatusItem {
    code: number;
    description: string;
    year: number;
    class: string;
    entitlement: number;
    category: 'leave-day' | 'leave-hours' | 'overtime' | 'balance' | 'info';
}

export interface SavedRotation {
    id: string;
    name: string;
    pattern: ShiftType[];
}

// DASHBOARD
export interface DashboardLayout {
    main: string[];
    sidebar: string[];
}

export interface WidgetVisibility {
    [widgetId: string]: boolean;
}

// CALCULATION SUMMARIES
export interface WorkDaySummary {
    totalWorkMs: number;
    standardWorkMs: number;
    overtimeDiurnalMs: number;
    overtimeNocturnalMs: number;
    overtimeHolidayMs: number;
    overtimeNocturnalHolidayMs: number;
    excessHoursMs: number;
    nullHoursMs: number;
}

export interface WorkIntervalSummary extends WorkDaySummary {
    start: Date;
    end: Date;
    closingEntryId?: string;
}
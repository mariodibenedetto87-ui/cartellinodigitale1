import { StatusItem, LeaveType } from '../types';
import { VacationIcon, Law104Icon, MedicalIcon, CompTimeIcon, PermitArt32Icon, HolidayIcon, CustomLeaveIcon } from '../components/ShiftIcons';

/**
 * Retrieves display details (label, icon, color) for a leave type by looking it up in the status items list.
 * It supports the new `code-` format and provides fallbacks for legacy data.
 * @param leaveType The leave type identifier (e.g., 'code-15', or legacy 'vacation').
 * @param allStatusItems The complete list of status items from the app's state.
 * @returns An object with the label, Icon component, and color strings for display.
 */
export const getStatusItemDetails = (leaveType: LeaveType, allStatusItems: StatusItem[]) => {
    const defaultDetails = { label: 'Permesso', Icon: CustomLeaveIcon, textColor: 'text-gray-500', bgColor: 'bg-gray-500' };

    // Legacy support for old hardcoded leave types, mapping them to new codes.
    const legacyMap: Record<string, number> = {
        'vacation': 15,
        'comp-time': 8,
        'holiday': 10,
        'medical': 32,
    };
    
    let code: number | undefined;

    if (leaveType.startsWith('code-')) {
        code = parseInt(leaveType.split('-')[1], 10);
    } else if (legacyMap[leaveType]) {
        code = legacyMap[leaveType];
    } else {
        // Not a known legacy type or a new code-based type
        return defaultDetails;
    }

    if (!code) return defaultDetails;

    const item = allStatusItems.find(i => i.code === code);
    if (!item) return { ...defaultDetails, label: `Sconosciuto (${code})` };

    // Assign icons and colors based on codes with more variety
    let Icon = CustomLeaveIcon;
    let textColor = 'text-white';
    let bgColor = 'bg-gray-500';

    // Ferie (15, 16) - Blue variants
    if (code === 15) { Icon = VacationIcon; textColor = 'text-white'; bgColor = 'bg-blue-500'; }
    else if (code === 16) { Icon = VacationIcon; textColor = 'text-white'; bgColor = 'bg-blue-600'; }
    
    // Recupero ore (8) - Green
    else if (code === 8) { Icon = CompTimeIcon; textColor = 'text-white'; bgColor = 'bg-green-500'; }
    
    // Festività (10) - Orange
    else if (code === 10) { Icon = HolidayIcon; textColor = 'text-white'; bgColor = 'bg-orange-500'; }
    
    // Malattia (32) - Red
    else if (code === 32) { Icon = MedicalIcon; textColor = 'text-white'; bgColor = 'bg-red-500'; }
    
    // Permessi orari - Purple variants
    else if (item.category === 'leave-hours') { 
        Icon = PermitArt32Icon; 
        // Assign different purple shades based on code
        if (code % 3 === 0) { textColor = 'text-white'; bgColor = 'bg-purple-500'; }
        else if (code % 3 === 1) { textColor = 'text-white'; bgColor = 'bg-violet-500'; }
        else { textColor = 'text-white'; bgColor = 'bg-indigo-500'; }
    }
    
    // Permessi giornalieri - Teal/Cyan variants
    else if (item.category === 'leave-day') { 
        Icon = Law104Icon;
        // Assign different teal shades based on code
        if (code % 4 === 0) { textColor = 'text-white'; bgColor = 'bg-teal-500'; }
        else if (code % 4 === 1) { textColor = 'text-white'; bgColor = 'bg-cyan-500'; }
        else if (code % 4 === 2) { textColor = 'text-white'; bgColor = 'bg-sky-600'; }
        else { textColor = 'text-white'; bgColor = 'bg-blue-400'; }
    }
    
    // Fallback con colori variati
    else {
        // Use code to generate varied colors
        const colorIndex = code % 8;
        const colors = [
            { text: 'text-white', bg: 'bg-pink-500' },
            { text: 'text-white', bg: 'bg-rose-500' },
            { text: 'text-white', bg: 'bg-amber-500' },
            { text: 'text-white', bg: 'bg-lime-500' },
            { text: 'text-white', bg: 'bg-emerald-500' },
            { text: 'text-white', bg: 'bg-slate-500' },
            { text: 'text-white', bg: 'bg-fuchsia-500' },
            { text: 'text-white', bg: 'bg-yellow-500' },
        ];
        textColor = colors[colorIndex].text;
        bgColor = colors[colorIndex].bg;
    }
    
    return { label: item.description, Icon, textColor, bgColor };
};

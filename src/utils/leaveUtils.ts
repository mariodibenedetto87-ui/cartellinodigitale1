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

    // Assign icons based on codes or keywords in description for better visuals
    let Icon = CustomLeaveIcon;
    let textColor = 'text-gray-500';
    let bgColor = 'bg-gray-500';

    if ([15, 16].includes(code)) { Icon = VacationIcon; textColor = 'text-sky-500'; bgColor = 'bg-sky-500'; }
    else if (code === 8) { Icon = CompTimeIcon; textColor = 'text-green-500'; bgColor = 'bg-green-500'; }
    else if (code === 10) { Icon = HolidayIcon; textColor = 'text-orange-500'; bgColor = 'bg-orange-500'; }
    else if (code === 32) { Icon = MedicalIcon; textColor = 'text-red-500'; bgColor = 'bg-red-500'; }
    else if (item.category === 'leave-hours') { Icon = PermitArt32Icon; textColor = 'text-purple-500'; bgColor = 'bg-purple-500'; }
    else if (item.category === 'leave-day') { Icon = Law104Icon; textColor = 'text-blue-600'; bgColor = 'bg-blue-600'; }
    
    return { label: item.description, Icon, textColor, bgColor };
};

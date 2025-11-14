// utils/calendarUtils.ts

import { startOfWeek, addDays } from './timeUtils';

export interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    isAllDay: boolean;
    description: string;
}

/**
 * Formats a date for a Google Calendar URL.
 * For all-day events, it's YYYYMMDD.
 * For timed events, it's YYYYMMDDTHHMMSSZ.
 */
const toGoogleDate = (date: Date, isAllDay: boolean): string => {
    if (isAllDay) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    // Format to "YYYYMMDDTHHMMSSZ"
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates a URL to create a new event in Google Calendar with pre-filled details.
 * @param {CalendarEvent} event - The event details.
 * @returns {string} The generated Google Calendar URL.
 */
export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
    const startDate = toGoogleDate(event.start, event.isAllDay);
    let endDate: string;
    if (event.isAllDay) {
        // For Google Calendar, the end date for all-day events is exclusive.
        const nextDay = new Date(event.start);
        nextDay.setDate(nextDay.getDate() + 1);
        endDate = toGoogleDate(nextDay, true);
    } else {
        endDate = toGoogleDate(event.end, false);
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${startDate}/${endDate}`,
        details: event.description,
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
}


/**
 * Generates a matrix of Date objects representing a full year for calendar views.
 * Each month is represented by a 42-day array (6 weeks) for consistent grid layout.
 * @param {number} year - The year for which to generate the matrix.
 * @returns {(Date | null)[][]} A 12-element array, where each element is a 42-element array of Dates.
 */
export const getYearMatrix = (year: number): (Date | null)[][] => {
    const yearMatrix: (Date | null)[][] = [];

    for (let month = 0; month < 12; month++) {
        const monthMatrix: (Date | null)[] = [];
        const monthStart = new Date(year, month, 1);
        
        const weekStartDate = startOfWeek(monthStart);
        let currentDate = new Date(weekStartDate);
        
        for (let i = 0; i < 42; i++) {
            monthMatrix.push(new Date(currentDate));
            currentDate = addDays(currentDate, 1);
        }
        
        yearMatrix.push(monthMatrix);
    }

    return yearMatrix;
};

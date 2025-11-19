import React from 'react';

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const MorningIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-amber-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const AfternoonIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-indigo-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const RestIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-pink-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const VacationIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-sky-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v16.5M2.25 12h19.5M3.75 7.5h16.5M3.75 16.5h16.5" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const Law104Icon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-blue-600 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const MedicalIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-red-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12h7.5" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const CompTimeIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-green-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const PermitArt32Icon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-purple-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const HolidayIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-orange-500 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688 0-1.25-.562-1.25-1.25s.562-1.25 1.25-1.25 1.25.562 1.25 1.25-.562 1.25-1.25 1.25zM10.34 8.84c-.688 0-1.25-.562-1.25-1.25s.562-1.25 1.25-1.25 1.25.562 1.25 1.25-.562 1.25-1.25 1.25zM10.34 12.34c-.688 0-1.25-.562-1.25-1.25s.562-1.25 1.25-1.25 1.25.562 1.25 1.25-.562 1.25-1.25 1.25zM15.34 15.84c-.688 0-1.25-.562-1.25-1.25s.562-1.25 1.25-1.25 1.25.562 1.25 1.25-.562 1.25-1.25 1.25zM15.34 8.84c-.688 0-1.25-.562-1.25-1.25s.562-1.25 1.25-1.25 1.25.562 1.25 1.25-.562 1.25-1.25 1.25zM15.34 12.34c-.688 0-1.25-.562-1.25-1.25s.562-1.25 1.25-1.25 1.25.562 1.25 1.25-.562 1.25-1.25 1.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21V6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75V21M4.5 21h15m-15 0H3v-2.25a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 18.75V21h-1.5" />
    </svg>
);

// FIX: Update component props to accept all SVG attributes, including 'title'.
// FIX: Added { title?: string } to props type to allow passing a title for accessibility.
export const CustomLeaveIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`text-gray-600 ${className || ''}`} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v13.5A2.25 2.25 0 0118 21.75H6A2.25 2.25 0 013.75 19.5V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
    </svg>
);

export const PhoneIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
);
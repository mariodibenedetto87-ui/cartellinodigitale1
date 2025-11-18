// Dynamic theme CSS generator
export const applyTheme = (accentColor: string, primaryShade: string) => {
    const root = document.documentElement;
    
    // Color mapping - Tailwind color values
    const colorMap: Record<string, Record<string, string>> = {
        teal: {
            '400': '#2dd4bf',
            '500': '#14b8a6',
            '600': '#0d9488',
            '700': '#0f766e',
        },
        blue: {
            '400': '#60a5fa',
            '500': '#3b82f6',
            '600': '#2563eb',
            '700': '#1d4ed8',
        },
        purple: {
            '400': '#c084fc',
            '500': '#a855f7',
            '600': '#9333ea',
            '700': '#7e22ce',
        },
        orange: {
            '400': '#fb923c',
            '500': '#f97316',
            '600': '#ea580c',
            '700': '#c2410c',
        },
        green: {
            '400': '#4ade80',
            '500': '#22c55e',
            '600': '#16a34a',
            '700': '#15803d',
        },
        pink: {
            '400': '#f472b6',
            '500': '#ec4899',
            '600': '#db2777',
            '700': '#be185d',
        },
        indigo: {
            '400': '#818cf8',
            '500': '#6366f1',
            '600': '#4f46e5',
            '700': '#4338ca',
        },
        red: {
            '400': '#f87171',
            '500': '#ef4444',
            '600': '#dc2626',
            '700': '#b91c1c',
        },
    };
    
    const color = colorMap[accentColor]?.[primaryShade] || '#14b8a6';
    
    // Apply CSS variables
    root.style.setProperty('--accent-color', color);
    root.style.setProperty('--accent-color-hover', colorMap[accentColor]?.['600'] || '#0d9488');
    root.style.setProperty('--accent-color-light', colorMap[accentColor]?.['400'] || '#2dd4bf');
    
    // Update all gradient elements dynamically
    updateGradients(accentColor);
};

const updateGradients = (_accentColor: string) => {
    // Update inline styles for gradient elements
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    
    // Remove existing dynamic style
    const existing = document.getElementById('dynamic-theme-style');
    if (existing) existing.remove();
    
    // Create dynamic CSS with current accent color - COMPREHENSIVE OVERRIDE
    style.innerHTML = `
        /* === BUTTONS & INTERACTIVE ELEMENTS === */
        .bg-teal-600, .bg-teal-500, .bg-teal-700 {
            background-color: var(--accent-color) !important;
        }
        .hover\\:bg-teal-700:hover, .hover\\:bg-teal-600:hover {
            background-color: var(--accent-color-hover) !important;
        }
        .text-teal-600, .text-teal-500, .text-teal-700 {
            color: var(--accent-color) !important;
        }
        .border-teal-500, .border-teal-600 {
            border-color: var(--accent-color) !important;
        }
        
        /* === GRADIENTS - All variations === */
        .bg-gradient-to-br.from-teal-500,
        .bg-gradient-to-br.from-teal-400,
        .bg-gradient-to-r.from-teal-500,
        .bg-gradient-to-r.from-teal-400,
        .bg-gradient-to-br.from-teal-500.to-blue-500,
        .bg-gradient-to-r.from-teal-500.to-blue-500 {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        
        /* === FOCUS STATES === */
        .focus\\:ring-teal-500:focus {
            --tw-ring-color: var(--accent-color) !important;
        }
        .focus\\:border-teal-500:focus {
            border-color: var(--accent-color) !important;
        }
        
        /* === HOVER GRADIENTS === */
        .hover\\:from-teal-600:hover,
        .hover\\:to-blue-600:hover {
            background: linear-gradient(135deg, var(--accent-color), var(--accent-color-hover)) !important;
        }
        
        /* === FAB BUTTON (Quick Actions) === */
        button[aria-label*="Apri menu"],
        button[aria-label*="Chiudi menu"] {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        button[aria-label*="Apri menu"]:hover,
        button[aria-label*="Chiudi menu"]:hover {
            background: linear-gradient(135deg, var(--accent-color), var(--accent-color-hover)) !important;
        }
        
        /* === HEADER NAVIGATION === */
        nav button.bg-teal-600 {
            background-color: var(--accent-color) !important;
        }
        nav button.bg-teal-600:hover {
            background-color: var(--accent-color-hover) !important;
        }
        
        /* === PROGRESS BARS === */
        .bg-teal-500 {
            background-color: var(--accent-color) !important;
        }
        
        /* === BADGES & PILLS === */
        .bg-teal-100 {
            background-color: color-mix(in srgb, var(--accent-color) 20%, white) !important;
        }
        .text-teal-800 {
            color: color-mix(in srgb, var(--accent-color) 80%, black) !important;
        }
        
        /* === CARDS & CONTAINERS === */
        .border-teal-200 {
            border-color: color-mix(in srgb, var(--accent-color) 30%, white) !important;
        }
        
        /* === ICONS WITH BACKGROUND === */
        div[class*="bg-gradient-to-br from-teal"] {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        
        /* === ONBOARDING PROGRESS BAR === */
        .bg-gradient-to-r.from-teal-500.to-blue-500 {
            background: linear-gradient(to right, var(--accent-color-light), var(--accent-color)) !important;
        }
        
        /* === SELECTION RINGS (Theme Picker) === */
        .bg-gradient-to-br.from-teal-500.to-blue-500.-z-10 {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        
        /* === DASHBOARD INSIGHTS GRADIENTS === */
        .bg-clip-text.text-transparent[class*="from-teal"] {
            background: linear-gradient(to right, var(--accent-color-light), var(--accent-color)) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
        }
        
        /* === ANIMATIONS & PULSE === */
        .animate-ping[class*="bg-teal"] {
            background-color: var(--accent-color-light) !important;
        }
        span[class*="bg-teal"] {
            background-color: var(--accent-color) !important;
        }
        
        /* === DARK MODE VARIANTS === */
        .dark .dark\\:bg-teal-900\\/50 {
            background-color: color-mix(in srgb, var(--accent-color) 15%, black) !important;
        }
        .dark .dark\\:text-teal-200 {
            color: color-mix(in srgb, var(--accent-color) 60%, white) !important;
        }
        .dark .dark\\:border-teal-800 {
            border-color: color-mix(in srgb, var(--accent-color) 60%, black) !important;
        }
        
        /* === SPECIFIC COMPONENTS === */
        /* NfcScanner circular button */
        .rounded-full.bg-gradient-to-br {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        
        /* Header icons/buttons */
        header button[class*="bg-teal"] {
            background-color: var(--accent-color) !important;
        }
        header button[class*="bg-teal"]:hover {
            background-color: var(--accent-color-hover) !important;
        }
        
        /* Settings save buttons */
        button[class*="bg-teal-600"] {
            background-color: var(--accent-color) !important;
        }
        button[class*="bg-teal-600"]:hover {
            background-color: var(--accent-color-hover) !important;
        }
        
        /* Modal action buttons */
        button[class*="from-teal-500"] {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        button[class*="from-teal-500"]:hover {
            background: linear-gradient(135deg, var(--accent-color), var(--accent-color-hover)) !important;
        }
        
        /* Links and text accents */
        a[class*="text-teal"] {
            color: var(--accent-color) !important;
        }
        a[class*="text-teal"]:hover {
            color: var(--accent-color-hover) !important;
        }
        
        /* Checkbox and radio buttons (if any) */
        input[type="checkbox"]:checked,
        input[type="radio"]:checked {
            background-color: var(--accent-color) !important;
            border-color: var(--accent-color) !important;
        }
        
        /* Calendar highlights */
        .bg-teal-50 {
            background-color: color-mix(in srgb, var(--accent-color) 10%, white) !important;
        }
        
        /* Sidebar active states */
        .border-l-4.border-teal-500 {
            border-left-color: var(--accent-color) !important;
        }
        
        /* === UTILITIES === */
        .theme-gradient {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        .theme-bg {
            background-color: var(--accent-color) !important;
        }
        .theme-bg-hover:hover {
            background-color: var(--accent-color-hover) !important;
        }
        .theme-text {
            color: var(--accent-color) !important;
        }
        .theme-border {
            border-color: var(--accent-color) !important;
        }
    `;
    
    document.head.appendChild(style);
};

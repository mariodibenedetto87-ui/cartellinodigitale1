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
    
    // Create dynamic CSS with current accent color
    style.innerHTML = `
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
        /* Override Tailwind gradients */
        .bg-gradient-to-br.from-teal-500,
        .bg-gradient-to-br.from-teal-400,
        .bg-gradient-to-r.from-teal-500 {
            background: linear-gradient(to bottom right, var(--accent-color-light), var(--accent-color)) !important;
        }
        .bg-gradient-to-r.from-teal-400 {
            background: linear-gradient(to right, var(--accent-color-light), var(--accent-color)) !important;
        }
        /* FAB button */
        .bg-gradient-to-br.from-teal-500.to-blue-500 {
            background: linear-gradient(135deg, var(--accent-color-light), var(--accent-color)) !important;
        }
        /* Hover states */
        .hover\\:from-teal-600:hover {
            background: linear-gradient(135deg, var(--accent-color), var(--accent-color-hover)) !important;
        }
    `;
    
    document.head.appendChild(style);
};

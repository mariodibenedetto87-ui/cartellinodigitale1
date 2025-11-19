import React, { useState } from 'react';
import { ThemeSettings } from '../types';

interface ThemeColorPickerProps {
    currentTheme: ThemeSettings;
    onSave: (theme: ThemeSettings) => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
);

interface ThemePreset {
    id: string;
    name: string;
    accentColor: string;
    primaryShade: string;
    gradient: string;
    description: string;
}

const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({ currentTheme, onSave }) => {
    const [selectedTheme, setSelectedTheme] = useState<ThemeSettings>(currentTheme);

    const themePresets: ThemePreset[] = [
        {
            id: 'teal',
            name: 'Ocean Teal',
            accentColor: 'teal',
            primaryShade: '500',
            gradient: 'from-teal-400 via-teal-500 to-teal-600',
            description: 'Fresco e professionale (default)'
        },
        {
            id: 'blue',
            name: 'Sky Blue',
            accentColor: 'blue',
            primaryShade: '500',
            gradient: 'from-blue-400 via-blue-500 to-blue-600',
            description: 'Classico e affidabile'
        },
        {
            id: 'purple',
            name: 'Royal Purple',
            accentColor: 'purple',
            primaryShade: '500',
            gradient: 'from-purple-400 via-purple-500 to-purple-600',
            description: 'Elegante e moderno'
        },
        {
            id: 'orange',
            name: 'Sunset Orange',
            accentColor: 'orange',
            primaryShade: '500',
            gradient: 'from-orange-400 via-orange-500 to-orange-600',
            description: 'Energico e caldo'
        },
        {
            id: 'green',
            name: 'Forest Green',
            accentColor: 'green',
            primaryShade: '500',
            gradient: 'from-green-400 via-green-500 to-green-600',
            description: 'Naturale e rilassante'
        },
        {
            id: 'pink',
            name: 'Rose Pink',
            accentColor: 'pink',
            primaryShade: '500',
            gradient: 'from-pink-400 via-pink-500 to-pink-600',
            description: 'Creativo e vibrante'
        },
        {
            id: 'indigo',
            name: 'Deep Indigo',
            accentColor: 'indigo',
            primaryShade: '500',
            gradient: 'from-indigo-400 via-indigo-500 to-indigo-600',
            description: 'Sofisticato e distintivo'
        },
        {
            id: 'red',
            name: 'Ruby Red',
            accentColor: 'red',
            primaryShade: '500',
            gradient: 'from-red-400 via-red-500 to-red-600',
            description: 'Audace e deciso'
        }
    ];

    const handleThemeSelect = (preset: ThemePreset) => {
        const newTheme: ThemeSettings = {
            accentColor: preset.accentColor,
            primaryShade: preset.primaryShade
        };
        setSelectedTheme(newTheme);
        onSave(newTheme);
    };

    const isSelected = (preset: ThemePreset) => {
        return selectedTheme.accentColor === preset.accentColor;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
                    <PaintBrushIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Temi Colore
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-slate-600">
                        Personalizza l'aspetto dell'app
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {themePresets.map((preset, index) => (
                    <button
                        key={preset.id}
                        onClick={() => handleThemeSelect(preset)}
                        className={`group relative p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 animate-fade-in-up ${
                            isSelected(preset)
                                ? 'border-slate-800 dark:border-white shadow-lg'
                                : 'border-gray-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Gradient Preview */}
                        <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${preset.gradient} mb-3 shadow-inner relative overflow-hidden`}>
                            {isSelected(preset) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 animate-fade-in">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
                                        <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Info */}
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                            {preset.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-slate-600 leading-relaxed">
                            {preset.description}
                        </p>

                        {/* Selection Ring */}
                        {isSelected(preset) && (
                            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 -z-10 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Il tema viene applicato immediatamente e salvato automaticamente. 
                    I colori influenzano pulsanti, gradienti e elementi interattivi dell'app.
                </p>
            </div>
        </div>
    );
};

export default ThemeColorPicker;

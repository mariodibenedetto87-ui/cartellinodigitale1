import React, { useState, useRef, useEffect } from 'react';
import { WorkStatus } from '../types';

interface QuickActionsFABProps {
    workStatus: WorkStatus;
    onToggleWork: () => void;
    onAddLeave: () => void;
    onOpenNFC: () => void;
    onAddNote: () => void;
    disabled?: boolean;
}

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);

const NFCIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
    </svg>
);

const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({
    workStatus,
    onToggleWork,
    onAddLeave,
    onOpenNFC,
    onAddNote,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Show tooltip on first render after 2 seconds
        const timer = setTimeout(() => {
            if (!localStorage.getItem('fab_tooltip_shown')) {
                setShowTooltip(true);
                localStorage.setItem('fab_tooltip_shown', 'true');
                setTimeout(() => setShowTooltip(false), 5000);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMainClick = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        setShowTooltip(false);
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    };

    const handleActionClick = (action: () => void) => {
        action();
        setIsOpen(false);
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50]);
        }
    };

    const actions = [
        {
            icon: <ClockIcon className="w-6 h-6" />,
            label: workStatus === WorkStatus.ClockedIn ? 'Timbra Uscita' : 'Timbra Entrata',
            color: workStatus === WorkStatus.ClockedIn ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
            onClick: () => handleActionClick(onToggleWork),
            delay: 0
        },
        {
            icon: <CalendarIcon className="w-6 h-6" />,
            label: 'Aggiungi Assenza',
            color: 'from-blue-500 to-blue-600',
            onClick: () => handleActionClick(onAddLeave),
            delay: 50
        },
        {
            icon: <NFCIcon className="w-6 h-6" />,
            label: 'Scansiona NFC',
            color: 'from-purple-500 to-purple-600',
            onClick: () => handleActionClick(onOpenNFC),
            delay: 100
        },
        {
            icon: <NoteIcon className="w-6 h-6" />,
            label: 'Aggiungi Nota',
            color: 'from-amber-500 to-amber-600',
            onClick: () => handleActionClick(onAddNote),
            delay: 150
        }
    ];

    return (
        <div ref={fabRef} className="fixed bottom-6 right-6 z-30">
            {/* Tooltip */}
            {showTooltip && !isOpen && (
                <div className="absolute bottom-20 right-0 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap animate-bounce-gentle">
                    <div className="text-sm font-medium">👆 Clicca qui per azioni rapide!</div>
                    <div className="absolute -bottom-1 right-6 w-3 h-3 bg-slate-800 transform rotate-45" />
                </div>
            )}

            {/* Action Buttons */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 flex flex-col gap-3">
                    {actions.map((action, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 animate-scale-in"
                            style={{ animationDelay: `${action.delay}ms` }}
                        >
                            {/* Label */}
                            <span className="bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 animate-fade-in-left" style={{ animationDelay: `${action.delay + 50}ms` }}>
                                {action.label}
                            </span>
                            
                            {/* Button */}
                            <button
                                onClick={action.onClick}
                                className={`w-14 h-14 rounded-full bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center`}
                                aria-label={action.label}
                            >
                                {action.icon}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                onClick={handleMainClick}
                disabled={disabled}
                className={`w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-2xl transition-all transform ${
                    isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
                } active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                    !disabled && 'hover:shadow-teal-500/50'
                }`}
                aria-label={isOpen ? 'Chiudi menu azioni rapide' : 'Apri menu azioni rapide'}
            >
                {isOpen ? (
                    <CloseIcon className="w-8 h-8" />
                ) : (
                    <div className="relative">
                        <PlusIcon className="w-8 h-8" />
                        {!isOpen && (
                            <div className="absolute -top-1 -right-1">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};

export default QuickActionsFAB;

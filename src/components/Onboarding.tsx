import React, { useState } from 'react';

interface OnboardingStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    target?: string;
}

interface OnboardingProps {
    onComplete: () => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
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

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const steps: OnboardingStep[] = [
        {
            title: "Benvenuto in Timecard Pro! 🎉",
            description: "La tua soluzione completa per gestire presenze, turni e straordinari. Iniziamo con un tour rapido!",
            icon: <div className="text-6xl">👋</div>
        },
        {
            title: "Timbra Entrata/Uscita",
            description: "Usa il pulsante principale per registrare le tue timbrature. Puoi anche usare il tag NFC dal tuo smartphone!",
            icon: <ClockIcon className="w-16 h-16 text-teal-500" />
        },
        {
            title: "Pianifica i Tuoi Turni",
            description: "Nel calendario puoi pianificare turni, ferie e permessi. Trascina e rilascia per una gestione veloce!",
            icon: <CalendarIcon className="w-16 h-16 text-blue-500" />
        },
        {
            title: "Monitora i Tuoi Saldi",
            description: "Controlla ore lavorate, straordinari accumulati e giorni di ferie rimanenti nella sezione Saldi.",
            icon: <ChartIcon className="w-16 h-16 text-purple-500" />
        },
        {
            title: "Tutto Pronto! 🚀",
            description: "Sei pronto per iniziare! Usa il bottone ⚡ in basso a destra per azioni rapide. Buon lavoro!",
            icon: <CheckIcon className="w-16 h-16 text-green-500" />
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsVisible(false);
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-200 dark:bg-slate-700 rounded-t-2xl overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                {step.icon}
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-4">
                            {step.title}
                        </h2>

                        {/* Description */}
                        <p className="text-center text-gray-600 dark:text-slate-300 mb-8 leading-relaxed">
                            {step.description}
                        </p>

                        {/* Step Indicators */}
                        <div className="flex justify-center gap-2 mb-6">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        index === currentStep 
                                            ? 'w-8 bg-teal-500' 
                                            : index < currentStep
                                            ? 'w-2 bg-teal-300'
                                            : 'w-2 bg-gray-300 dark:bg-slate-600'
                                    }`}
                                    aria-label={`Vai allo step ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {currentStep > 0 && currentStep < steps.length - 1 && (
                                <button
                                    onClick={handleSkip}
                                    className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    Salta
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className={`${
                                    currentStep > 0 && currentStep < steps.length - 1 ? 'flex-1' : 'w-full'
                                } px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95`}
                            >
                                {currentStep === steps.length - 1 ? 'Inizia!' : currentStep === 0 ? 'Inizia il Tour' : 'Avanti'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Onboarding;


import React from 'react';

interface PlannerCardProps {
    onOpen: () => void;
}

const CalendarDaysIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12.75 12.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3-3h.008v.008h-.008v-.008Z" />
    </svg>
);


const PlannerCard: React.FC<PlannerCardProps> = ({ onOpen }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 text-center transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <CalendarDaysIcon className="w-12 h-12 mx-auto text-teal-500 dark:text-teal-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">Pianificazione Rapida</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Imposta turni o assenze per più giorni in un unico passaggio.
            </p>
            <button
                onClick={onOpen}
                className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
            >
                Apri Pianificatore
            </button>
        </div>
    );
};

export default PlannerCard;

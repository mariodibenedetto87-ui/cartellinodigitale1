import React, { useEffect } from 'react';

interface ImportStatusToastProps {
  message: string;
  type: 'info' | 'success' | 'error' | '';
  onDismiss: () => void;
}

const ImportStatusToast: React.FC<ImportStatusToastProps> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        if (message && (type === 'success' || type === 'error')) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, type, onDismiss]);

    if (!message) return null;

    const baseClasses = "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl text-white text-sm font-semibold z-50 transition-all duration-300 animate-fade-in";
    const typeClasses = {
        info: "bg-blue-500",
        success: "bg-emerald-500",
        error: "bg-red-500",
        '': 'hidden'
    };

    const Icon = () => {
        switch (type) {
            case 'info':
                return (
                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                );
            case 'success':
                 return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 )
            case 'error':
                 return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 )
            default: return null;
        }
    }

    return (
        <div className={`${baseClasses} ${typeClasses[type]} flex items-center`}>
            <Icon />
            <span>{message}</span>
        </div>
    );
};

export default ImportStatusToast;
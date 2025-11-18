import React from 'react';
import { SmartNotification } from '../utils/smartNotifications';

interface SmartNotificationsPanelProps {
    notifications: SmartNotification[];
    onDismiss: (id: string) => void;
    onAction?: (id: string) => void;
}

const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const SmartNotificationsPanel: React.FC<SmartNotificationsPanelProps> = ({
    notifications,
    onDismiss,
    onAction
}) => {
    if (notifications.length === 0) return null;

    const getNotificationStyles = (type: SmartNotification['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';
            case 'info':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
            default:
                return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
        }
    };

    const getPriorityIndicator = (priority: SmartNotification['priority']) => {
        if (priority === 'high') {
            return <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>;
        }
        return null;
    };

    return (
        <div className="space-y-3">
            {notifications.map((notification, index) => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-2 shadow-sm transition-all hover:shadow-md animate-fade-in-up ${getNotificationStyles(notification.type)}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                            <BellIcon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">
                                    {notification.title}
                                </h3>
                                {getPriorityIndicator(notification.priority)}
                            </div>
                            <p className="text-sm opacity-90 leading-relaxed">
                                {notification.message}
                            </p>

                            {/* Action Button */}
                            {notification.actionLabel && onAction && (
                                <button
                                    onClick={() => onAction(notification.id)}
                                    className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-opacity-80 transition-all shadow-sm"
                                >
                                    {notification.actionLabel}
                                </button>
                            )}
                        </div>

                        {/* Dismiss Button */}
                        <button
                            onClick={() => onDismiss(notification.id)}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            aria-label="Chiudi notifica"
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SmartNotificationsPanel;

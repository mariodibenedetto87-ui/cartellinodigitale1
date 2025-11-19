import { BellAlertIcon, XMarkIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { haptic, HapticType } from '../utils/haptics';
import { formatDistance } from '../utils/geolocationUtils';

interface GeofenceNotificationProps {
  isOpen: boolean;
  workLocationName: string;
  distance: number;
  shiftStartHour?: number;
  onClockIn: () => void;
  onDismiss: () => void;
}

export function GeofenceNotification({
  isOpen,
  workLocationName,
  distance,
  shiftStartHour,
  onClockIn,
  onDismiss,
}: GeofenceNotificationProps) {
  if (!isOpen) return null;

  const handleClockIn = () => {
    haptic(HapticType.SUCCESS);
    onClockIn();
  };

  const handleDismiss = () => {
    haptic(HapticType.LIGHT);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Notification Card */}
      <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-2xl max-w-sm w-full animate-slide-down">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Chiudi notifica"
        >
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center animate-bounce">
              <MapPinIcon className="w-10 h-10 text-teal-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <BellAlertIcon className="w-4 h-4 text-yellow-900" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Sei arrivato! 👋</h2>
          <p className="text-teal-50 mb-4">
            Ti trovi a <span className="font-semibold">{formatDistance(distance)}</span> da <span className="font-semibold">{workLocationName}</span>
          </p>

          {shiftStartHour !== undefined && (
            <div className="flex items-center justify-center gap-2 text-sm text-teal-100 mb-6">
              <ClockIcon className="w-4 h-4" />
              <span>Turno previsto: {shiftStartHour}:00</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleClockIn}
              className="w-full py-3 px-6 bg-white text-teal-600 font-bold rounded-xl hover:bg-teal-50 active:scale-95 transition-all shadow-lg"
            >
              ⏱️ Timbra Entrata
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 px-6 bg-teal-700/50 text-white font-medium rounded-xl hover:bg-teal-700/70 transition-colors"
            >
              Più tardi
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-down {
          from {
            transform: translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

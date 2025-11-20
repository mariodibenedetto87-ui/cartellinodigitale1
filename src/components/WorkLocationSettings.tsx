import { useState, useEffect } from 'react';
import { MapPinIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { WorkLocation } from '../utils/geolocationUtils';
import { getCurrentPosition, calculateDistance, formatDistance } from '../utils/geolocationUtils';
import { haptic, HapticType } from '../utils/haptics';

interface WorkLocationSettingsProps {
  workLocation: WorkLocation | null;
  onSave: (location: WorkLocation) => void;
  onRemove: () => void;
}

export function WorkLocationSettings({ workLocation, onSave, onRemove }: WorkLocationSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [locationName, setLocationName] = useState(workLocation?.name || '');
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(workLocation?.radius || 200);
  const [latitude, setLatitude] = useState(workLocation?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(workLocation?.longitude?.toString() || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'gps' | 'manual'>('gps');

  useEffect(() => {
    if (workLocation) {
      setLocationName(workLocation.name);
      setRadius(workLocation.radius);
      setLatitude(workLocation.latitude.toString());
      setLongitude(workLocation.longitude.toString());
    }
  }, [workLocation]);

  // Check current distance from work location
  useEffect(() => {
    if (workLocation && 'geolocation' in navigator) {
      const checkDistance = async () => {
        try {
          const position = await getCurrentPosition();
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            workLocation.latitude,
            workLocation.longitude
          );
          setCurrentDistance(distance);
        } catch (err) {
          // Silently fail - not critical
        }
      };
      checkDistance();
      const interval = setInterval(checkDistance, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [workLocation]);

  const handleGetCurrentLocation = async () => {
    haptic(HapticType.LIGHT);
    setIsGettingLocation(true);
    setError(null);

    try {
      const position = await getCurrentPosition();
      setLatitude(position.coords.latitude.toString());
      setLongitude(position.coords.longitude.toString());
      haptic(HapticType.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel recupero della posizione');
      haptic(HapticType.ERROR);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSave = () => {
    haptic(HapticType.LIGHT);
    if (!locationName.trim()) {
      setError('Inserisci un nome per la posizione');
      return;
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      setError('Inserisci coordinate valide');
      return;
    }
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Coordinate fuori dal range valido (lat: -90/90, lon: -180/180)');
      return;
    }

    onSave({
      name: locationName.trim(),
      latitude: lat,
      longitude: lon,
      radius,
    });
    setIsEditing(false);
    setError(null);
    haptic(HapticType.SUCCESS);
  };

  const handleRemove = () => {
    haptic(HapticType.LIGHT);
    if (window.confirm('🗑️ Vuoi rimuovere la posizione del lavoro?')) {
      onRemove();
      setIsEditing(false);
      haptic(HapticType.WARNING);
    }
  };

  const handleCancel = () => {
    haptic(HapticType.LIGHT);
    if (workLocation) {
      setLocationName(workLocation.name);
      setRadius(workLocation.radius);
      setLatitude(workLocation.latitude.toString());
      setLongitude(workLocation.longitude.toString());
    }
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing && !workLocation) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPinIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Posizione Lavoro
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          Configura la posizione del tuo luogo di lavoro per ricevere notifiche automatiche quando arrivi
        </p>
        <button
          onClick={() => {
            haptic(HapticType.LIGHT);
            setIsEditing(true);
          }}
          className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          Configura Posizione
        </button>
      </div>
    );
  }

  if (!isEditing && workLocation) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Posizione Lavoro
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                haptic(HapticType.LIGHT);
                setIsEditing(true);
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
            >
              Modifica
            </button>
            <button
              onClick={handleRemove}
              className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded transition-colors"
            >
              Rimuovi
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">Nome:</p>
            <p className="font-medium text-gray-900 dark:text-white">{workLocation.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">Raggio di attivazione:</p>
            <p className="font-medium text-gray-900 dark:text-white">{workLocation.radius}m</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">Coordinate:</p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {workLocation.latitude.toFixed(6)}, {workLocation.longitude.toFixed(6)}
            </p>
          </div>
          {currentDistance !== null && (
            <div className={`p-3 rounded-lg ${
              currentDistance <= workLocation.radius
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
            }`}>
              <p className="text-sm text-gray-600 dark:text-slate-400">Distanza attuale:</p>
              <p className={`font-semibold ${
                currentDistance <= workLocation.radius
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {formatDistance(currentDistance)}
                {currentDistance <= workLocation.radius && ' - Sei sul posto di lavoro'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {workLocation ? 'Modifica Posizione' : 'Configura Posizione Lavoro'}
          </h3>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome Posizione
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="es. Ufficio, Sede Aziendale, Magazzino..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Raggio di Attivazione (metri)
          </label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            min="50"
            max="1000"
            step="50"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
            L'app ti notificherà quando sei entro {radius}m dal lavoro
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posizione
          </label>
          
          {/* Toggle buttons for input mode */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                haptic(HapticType.LIGHT);
                setInputMode('gps');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'gps'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              📍 GPS Attuale
            </button>
            <button
              type="button"
              onClick={() => {
                haptic(HapticType.LIGHT);
                setInputMode('manual');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              ✏️ Manuale
            </button>
          </div>

          {inputMode === 'gps' ? (
            <button
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rilevamento posizione...
                </>
              ) : (
                <>
                  <MapPinIcon className="w-5 h-5" />
                  Rileva Posizione Attuale
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Indirizzo (opzionale)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="es. Via Roma 10, Milano"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                  L'indirizzo è solo indicativo. Devi inserire le coordinate sotto.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Latitudine *
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="45.4642"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Longitudine *
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="9.1900"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                💡 Puoi trovare le coordinate su <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Maps</a> cliccando col destro sul luogo
              </p>
            </div>
          )}
          
          {(latitude !== '' && longitude !== '') && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">📍 Coordinate impostate:</p>
              <p className="text-sm font-mono text-blue-700 dark:text-blue-400">
                {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Salva
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <XMarkIcon className="w-5 h-5" />
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

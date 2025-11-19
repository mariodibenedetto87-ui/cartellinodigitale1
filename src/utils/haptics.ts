/**
 * Haptic Feedback Utility
 * Fornisce vibrazioni tattili per migliorare l'esperienza utente su mobile
 */

export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Esegue feedback aptico leggero (tap normale)
 */
export const hapticLight = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

/**
 * Esegue feedback aptico medio (azione importante)
 */
export const hapticMedium = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
};

/**
 * Esegue feedback aptico pesante (azione critica)
 */
export const hapticHeavy = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([20, 30, 20]);
  }
};

/**
 * Feedback per successo (pattern piacevole)
 */
export const hapticSuccess = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
};

/**
 * Feedback per warning (pattern di attenzione)
 */
export const hapticWarning = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([30, 20, 30]);
  }
};

/**
 * Feedback per errore (pattern negativo)
 */
export const hapticError = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
};

/**
 * Hook per haptic feedback
 */
export const haptic = (type: HapticType = HapticType.LIGHT) => {
  switch (type) {
    case HapticType.LIGHT:
      hapticLight();
      break;
    case HapticType.MEDIUM:
      hapticMedium();
      break;
    case HapticType.HEAVY:
      hapticHeavy();
      break;
    case HapticType.SUCCESS:
      hapticSuccess();
      break;
    case HapticType.WARNING:
      hapticWarning();
      break;
    case HapticType.ERROR:
      hapticError();
      break;
  }
};

/**
 * Verifica se haptic feedback è supportato
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

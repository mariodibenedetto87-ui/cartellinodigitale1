# 📱 Roadmap: Da Web App a App iPhone

## 🎯 OBIETTIVO
Trasformare CartellinoPro in un'app nativa per iPhone disponibile su App Store.

---

## 🚀 APPROCCIO CONSIGLIATO: CAPACITOR

**Perché Capacitor?**
- ✅ Mantieni 90% del codice React attuale
- ✅ App Store ufficiale
- ✅ Accesso hardware nativo (camera, NFC, Face ID)
- ✅ Notifiche push native iOS
- ✅ Performance quasi-native
- ✅ Tempo sviluppo: 2-4 settimane

---

## 📅 TIMELINE

### **FASE 1: Preparazione (1 settimana)**

#### Miglioramenti UI per Mobile
- [ ] Aumentare dimensioni touch targets (min 44x44px)
- [ ] Aggiungere haptic feedback su tutti i pulsanti
- [ ] Implementare pull-to-refresh
- [ ] Aggiungere swipe gestures (delete, edit)
- [ ] Ottimizzare animazioni per 60fps
- [ ] Testare su Safari iOS (viewport, safe areas)

#### File da modificare:
```typescript
// src/utils/haptics.ts (nuovo)
export const hapticLight = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

export const hapticMedium = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
};

export const hapticHeavy = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([20, 30, 20]);
  }
};

// Usare su ogni button:
<button onClick={() => {
  hapticLight();
  handleAction();
}}>
```

```css
/* src/index.css - Safe Area iOS */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

### **FASE 2: Capacitor Setup (1 settimana)**

#### Installazione
```bash
# 1. Installa Capacitor
npm install @capacitor/core @capacitor/cli

# 2. Inizializza progetto
npx cap init
# Nome: CartellinoPro
# Package ID: com.mariodibenedetto.cartellinopro
# Web Dir: dist

# 3. Aggiungi iOS
npm install @capacitor/ios
npx cap add ios

# 4. Plugin essenziali
npm install @capacitor/camera
npm install @capacitor/push-notifications
npm install @capacitor/haptics
npm install @capacitor/status-bar
npm install @capacitor/splash-screen
npm install @capacitor-community/fcm
```

#### Configurazione iOS
```json
// capacitor.config.json
{
  "appId": "com.mariodibenedetto.cartellinopro",
  "appName": "CartellinoPro",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "ios": {
    "contentInset": "always",
    "backgroundColor": "#ffffff"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#14b8a6",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

---

### **FASE 3: Feature Native (2 settimane)**

#### 3.1 Haptic Feedback Nativo
```typescript
// src/hooks/useHaptics.ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useHaptics = () => {
  const light = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
  };

  const medium = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
  };

  const heavy = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  };

  const notification = async (type: 'success' | 'warning' | 'error') => {
    await Haptics.notification({ type });
  };

  return { light, medium, heavy, notification };
};
```

#### 3.2 Push Notifications
```typescript
// src/utils/notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  // Request permission
  let permStatus = await PushNotifications.checkPermissions();
  
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }
  
  if (permStatus.receive !== 'granted') {
    throw new Error('User denied permissions!');
  }

  await PushNotifications.register();

  // Listener per nuovo token
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
    // Salva token nel DB Supabase
  });

  // Listener per notifiche in arrivo
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ', notification);
  });
};
```

#### 3.3 Face ID / Touch ID
```typescript
// src/utils/biometrics.ts
import { NativeBiometric } from 'capacitor-native-biometric';

export const authenticateWithBiometrics = async () => {
  const result = await NativeBiometric.isAvailable();

  if (!result.isAvailable) {
    return false;
  }

  const verified = await NativeBiometric.verifyIdentity({
    reason: 'Accedi a CartellinoPro',
    title: 'Autenticazione biometrica',
    subtitle: 'Usa Face ID o Touch ID',
    description: 'Verifica la tua identità per continuare'
  });

  return verified;
};
```

#### 3.4 Camera per QR Code
```typescript
// src/utils/camera.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const scanQRCode = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera
  });

  // Processa QR code con libreria (jsQR)
  return image.webPath;
};
```

---

### **FASE 4: Build & Deploy (1 settimana)**

#### 4.1 Build iOS
```bash
# 1. Build web app
npm run build

# 2. Sync con iOS
npx cap sync ios

# 3. Apri Xcode
npx cap open ios

# 4. In Xcode:
# - Configura firma (Apple Developer Account necessario)
# - Configura icone app
# - Configura splash screen
# - Configura Info.plist (permessi camera, notifiche, ecc.)
# - Build per device fisico
```

#### 4.2 App Store Submission

**Requisiti:**
- [ ] Apple Developer Account ($99/anno)
- [ ] App Icon (1024x1024px)
- [ ] Screenshots (tutti i device)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Descrizione app (italiano + inglese)
- [ ] Keywords per SEO
- [ ] Age rating
- [ ] Test su TestFlight

**Info.plist - Permessi iOS:**
```xml
<key>NSCameraUsageDescription</key>
<string>CartellinoPro necessita della fotocamera per scansionare badge NFC</string>

<key>NSFaceIDUsageDescription</key>
<string>Usa Face ID per accedere velocemente all'app</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Accedi alla galleria per caricare foto del badge</string>
```

---

## 🎨 MIGLIORAMENTI UI SPECIFICI PER IPHONE

### Safe Area Insets
```css
/* Gestire notch iPhone */
.header {
  padding-top: max(env(safe-area-inset-top), 1rem);
}

.footer {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
}
```

### Large Titles (iOS Style)
```typescript
// Header con large title iOS
<div className="sticky top-0 bg-white dark:bg-slate-900 z-50">
  <div className="pt-safe-area-top">
    <h1 className="text-4xl font-bold px-4 py-6 tracking-tight">
      Dashboard
    </h1>
  </div>
</div>
```

### Bottom Sheet Modals
```typescript
// Modali che salgono dal basso (iOS style)
<div className="fixed inset-x-0 bottom-0 z-50 
  rounded-t-3xl bg-white dark:bg-slate-900
  shadow-2xl transform transition-transform
  translate-y-0 animate-slide-up">
  {/* Drag handle */}
  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
  {/* Modal content */}
</div>
```

### Pull to Refresh
```typescript
// src/hooks/usePullToRefresh.ts
import { useEffect, useRef } from 'react';

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 80) {
        onRefresh();
        isPulling.current = false;
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onRefresh]);
};
```

---

## 📊 METRICHE DI SUCCESSO

### Performance Target iOS
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 2s
- [ ] 60 FPS costanti su scroll/animations
- [ ] Bundle size < 500KB (già raggiunto: 218KB ✅)
- [ ] Lighthouse Mobile Score > 90

### User Experience
- [ ] Haptic feedback su tutte le interazioni
- [ ] Transizioni fluide (spring animations)
- [ ] Pull-to-refresh funzionante
- [ ] Offline-first (PWA già supporta)
- [ ] Face ID/Touch ID opzionale

---

## 💰 COSTI STIMATI

### Development
- **Tempo**: 4-6 settimane full-time
- **Opzionale**: Sviluppatore iOS freelance (€2000-€5000)

### Pubblicazione
- **Apple Developer Account**: €99/anno (obbligatorio)
- **App Store Optimization (ASO)**: €0-€500 (opzionale)
- **Server/Backend**: €0 (Supabase free tier OK)

### Totale Minimo: **€99/anno**

---

## 🚧 RISCHI & MITIGAZIONI

### Rischio 1: Rejection App Store
**Causa**: App troppo semplice, UI non iOS-style
**Mitigazione**: 
- Usare componenti iOS-style (SwiftUI-like)
- Aggiungere feature uniche (NFC nativo, widget)
- Documentazione completa

### Rischio 2: Performance su device vecchi
**Causa**: iPhone 8/X potrebbero essere lenti
**Mitigazione**:
- Lazy loading già implementato ✅
- Minimizzare animazioni complesse
- Testare su device fisici vecchi

### Rischio 3: NFC non funziona
**Causa**: NFC Web API limitato su iOS
**Mitigazione**:
- Usare plugin Capacitor nativo per NFC
- Fallback: QR code scanning

---

## ✅ CHECKLIST PRE-LAUNCH

### Codice
- [ ] Build production funziona
- [ ] 0 errori TypeScript
- [ ] 0 errori Capacitor
- [ ] Test su iPhone fisico
- [ ] Test su iPad
- [ ] Testato su iOS 15, 16, 17

### Assets
- [ ] App Icon (1024x1024)
- [ ] Splash Screen (tutti i formati)
- [ ] Screenshots App Store (5.5", 6.5", 12.9")
- [ ] Preview video (opzionale)

### Legale
- [ ] Privacy Policy pubblicata
- [ ] Terms of Service
- [ ] Cookie Policy (se applicable)
- [ ] GDPR compliance

### Marketing
- [ ] Nome app univoco
- [ ] Keywords ricercate
- [ ] Descrizione ottimizzata
- [ ] Categoria corretta (Business/Productivity)

---

## 🎯 NEXT STEPS

**OGGI:**
1. Migliorare PWA attuale (installabile da Safari)
2. Testare su iPhone reale
3. Aggiungere haptic feedback basilare

**QUESTA SETTIMANA:**
1. Creare Apple Developer Account
2. Installare Xcode
3. Setup Capacitor

**PROSSIME 2 SETTIMANE:**
1. Build prima versione iOS
2. Test su TestFlight (beta testing)
3. Iterare su feedback

**ENTRO 1 MESE:**
1. Submit App Store
2. Aspettare review (5-7 giorni)
3. 🎉 **LANCIO!**

---

**Autore**: Mario Di Benedetto  
**Data**: 19 Dicembre 2024  
**Versione**: 1.0 - Initial Roadmap

# 📱 Guida Completa: Timbratura NFC con iPhone e App Comandi

Questa guida ti mostrerà come configurare tag NFC con l'app **Comandi** di iPhone per registrare entrate e uscite automaticamente nella tua app Timecard Pro.

---

## 📋 Requisiti

- **iPhone** con iOS 13 o superiore (con chip NFC)
- **Tag NFC** (NTAG213, NTAG215, NTAG216 o compatibili ISO 14443)
- **App Comandi** (preinstallata su iPhone)
- **Safari** su iPhone (per aprire l'app)

---

## 🏷️ Fase 1: Preparare il Tag NFC

### Cosa Serve
- **1 Tag NFC** (NTAG213, NTAG215, NTAG216 o compatibili)
- **App NFC Tools** (download gratuito dall'App Store) per scrivere il tag

💡 **Nota**: Con un solo tag, l'app rileva automaticamente se sei in entrata o uscita e fa il toggle dello stato!

### Procedura di Scrittura Tag

1. **Scarica NFC Tools**
   - Apri App Store
   - Cerca "NFC Tools"
   - Scarica e installa l'app

2. **Scrivi il Tag Universale**
   - Apri NFC Tools
   - Tocca **"SCRITTURA"**
   - Seleziona **"Aggiungi record"**
   - Scegli **"Testo"**
   - Scrivi: `toggle` (tutto minuscolo)
   - Tocca **"OK"**
   - Tocca **"Scrivi"**
   - Avvicina il tag NFC al retro dell'iPhone (vicino alla fotocamera)
   - Attendi conferma di scrittura ✅
   - **Etichetta il tag**: "TIMBRATURA" o "⏰ BADGE"

### ✨ Vantaggi del Tag Singolo
- ✅ **Più semplice**: un solo tag da gestire
- ✅ **Intelligente**: l'app sa automaticamente se timbrare entrata o uscita
- ✅ **Comodo**: puoi posizionarlo ovunque (ingresso, scrivania, ecc.)
- ✅ **Economico**: serve solo 1 tag invece di 2

### 🎯 Come Funziona
L'app controlla lo stato attuale:
- **Non timbrato** → Registra **ENTRATA** ✅
- **Già in entrata** → Registra **USCITA** ✅
- Tutto automatico, zero errori!

---

## 🔧 Fase 2: Creare l'Automazione con Comandi (Background Automatico)

### ⚡ Caratteristiche Automazione Background
- ✅ **Funziona senza aprire l'app manualmente**
- ✅ **Esecuzione automatica** quando avvicini il tag
- ✅ **Nessuna conferma richiesta** (se configurato correttamente)
- ✅ **Feedback istantaneo** con notifica

### Passo 1: Creare l'Automazione NFC Universale

1. **Apri l'app Comandi**
2. Vai alla scheda **"Automazione"** in basso
3. Tocca **"+"** in alto a destra
4. Seleziona **"Crea automazione personale"**
5. Scorri e seleziona **"NFC"**
6. Tocca **"Scansiona"** e avvicina il tag NFC al retro dell'iPhone
7. Dai un nome al tag: **"Timbratura Badge"** o **"⏰ Clock"**
8. Tocca **"Avanti"**

9. **Aggiungi le seguenti azioni in sequenza:**

   **Azione 1: Apri URL**
   - Cerca e aggiungi **"Apri URL"**
   - Inserisci: `https://cartellinodigitale1.vercel.app/?nfc=true`

   **Azione 2: Mostra Notifica** (opzionale ma consigliata)
   - Cerca e aggiungi **"Mostra notifica"**
   - Titolo: `Timbratura Registrata`
   - Corpo: `Badge rilevato! ✅`

10. Tocca **"Avanti"**
11. **🔴 CRITICO**: Disabilita **"Chiedi prima di eseguire"**
12. **🔴 CRITICO**: Abilita **"Notifica quando viene eseguita"** (per feedback)
13. Tocca **"Fine"**

✨ **Fatto!** Ora quando avvicini il tag, l'app si apre e:
- Se non sei timbrato → registra **ENTRATA** automaticamente
- Se sei già in entrata → registra **USCITA** automaticamente

### 🎯 Perché Funziona con Parametro ?nfc=true?

L'app Timecard Pro è intelligente:
- Il parametro `?nfc=true` segnala che stai usando l'automazione NFC
- L'app rileva automaticamente il tuo stato attuale (in/out)
- Esegue il **toggle** automatico dello stato
- Nessun bisogno di specificare entrata o uscita! 🚀

### 🎯 Configurazione Avanzata per Background Puro

Per un'esperienza ancora più fluida, aggiungi queste azioni **prima** di "Apri URL":

1. **Imposta variabile** (opzionale)
   - Nome: `TimbratureURL`
   - Valore: `https://cartellinodigitale1.vercel.app/?nfc=true`

2. **Attendi** 0.1 secondi (previene errori di timing)

3. **Apri URL** (usa la variabile o URL diretto)

4. **Chiudi l'app** Safari (opzionale, richiede iOS 16+)
   - Cerca "Chiudi app"
   - Seleziona Safari

Questo chiuderà automaticamente Safari dopo la timbratura!

---

## 🌐 Fase 3: L'App Gestisce Automaticamente Entrata/Uscita

L'app Timecard Pro è già configurata per gestire il toggle automatico:

### Come Funziona il Sistema Intelligente

Quando apri l'app tramite NFC, il sistema:

1. **Controlla lo stato corrente** dell'utente
2. **Se non timbrato** (o ultima timbratura = OUT):
   - 🟢 Registra **ENTRATA**
   - Mostra notifica: "Entrata registrata ✅"
   - Avvia il timer della sessione
3. **Se già timbrato** (ultima timbratura = IN):
   - 🔴 Registra **USCITA**
   - Mostra notifica: "Uscita registrata ✅"
   - Ferma il timer e calcola ore lavorate

### ✨ Vantaggi del Sistema Automatico

- ✅ **Zero configurazione** lato codice
- ✅ **Nessun parametro URL** da ricordare
- ✅ **Impossibile sbagliare** la timbratura
- ✅ **Funziona anche offline** con sincronizzazione successiva
- ✅ **Feedback visivo** immediato nell'app

---

## 🎯 Fase 4: Testare il Sistema Background

### Test Sistema Automatico (Un Solo Tag)
1. **Blocca l'iPhone** (schermo spento o home screen)
2. **Prima scansione**: Avvicina il tag NFC al retro dell'iPhone
   - 🟢 **Sentirai una vibrazione** e vedrai notifica
   - Safari si aprirà brevemente
   - Notifica: **"Entrata registrata ✅"**
   - Timer inizia a contare
3. **Seconda scansione** (dopo qualche ora): Avvicina di nuovo lo stesso tag
   - 🔴 **Vibrazione**
   - Notifica: **"Uscita registrata ✅"**
   - Ore lavorate calcolate automaticamente
4. ✅ **Sistema funzionante!** Un solo tag gestisce tutto

### 🔍 Verifica Funzionamento Corretto

**Scenario Ideale (Tag Singolo Automatico):**
```
1. Avvicini tag → Vibrazione immediata
2. Notifica banner: "Timbratura Registrata"
3. Safari si apre/chiude in <1 secondo
4. App rileva stato e registra IN o OUT automaticamente
5. Notifica conferma: "Entrata ✅" o "Uscita ✅"
```

**Se richiede conferma (NON ideale):**
```
1. Avvicini tag → Notifica "Eseguire automazione?"
2. Devi cliccare "Esegui" manualmente ❌
```
👉 **Soluzione**: Apri Comandi → Automazione → Seleziona automazione NFC → Disabilita "Chiedi prima di eseguire"

### Troubleshooting Completo

#### ❌ L'iPhone non rileva il tag
**Soluzioni:**
- Impostazioni → Generali → NFC → Verifica sia ON
- Prova a tenere il tag per 2-3 secondi
- Posiziona il tag al **centro del retro** dell'iPhone (vicino alla fotocamera)
- Rimuovi custodie spesse (>3mm possono bloccare NFC)

#### ❌ L'automazione chiede sempre conferma
**Soluzioni:**
- Apri **Comandi** → **Automazione**
- Tocca l'automazione NFC problematica
- Scorri in basso
- **DISABILITA** "Chiedi prima di eseguire"
- Salva

#### ❌ Safari si apre ma non registra la timbratura
**Soluzioni:**
- Verifica URL sia corretto: `https://cartellinodigitale1.vercel.app/?nfc=true`
- Controlla che l'app sia raggiungibile online (non localhost)
- Apri Safari manualmente e testa l'URL con il parametro `?nfc=true`
- Verifica che il pulsante NFC nella dashboard funzioni manualmente
- Verifica console JavaScript per errori

#### ❌ Funziona solo con schermo sbloccato
**Soluzioni:**
- Verifica Face ID/Touch ID siano configurati
- Impostazioni → Face ID e codice → Abilita "NFC da schermata di blocco"
- Aggiorna iOS all'ultima versione (NFC background richiede iOS 14+)

#### ❌ Vibra ma non succede nulla
**Soluzioni:**
- Controlla log automazione: Comandi → Automazione → [i] → "Visualizza registro attività"
- Verifica connessione internet (WiFi o 4G/5G)
- Controlla che Safari non sia bloccato (Tempo di utilizzo → Limiti app)

### 🧪 Test Avanzato: Modalità Aereo

Per verificare il comportamento offline:
1. Attiva **Modalità Aereo**
2. Avvicina tag NFC
3. L'automazione dovrebbe partire ma fallire per mancanza internet
4. Disattiva Modalità Aereo
5. L'app sincronizzerà la timbratura (se Service Worker attivo)

---

## 🔒 Alternative Avanzate: Deep Links

Per un'integrazione più profonda, puoi usare **URL scheme personalizzati**:

1. **Registra uno URL scheme** nel file `manifest.json`:
```json
{
  "protocol_handlers": [
    {
      "protocol": "web+timecard",
      "url": "/?action=%s"
    }
  ]
}
```

2. **Usa URL personalizzati** nelle automazioni:
   - Entrata: `web+timecard:clock-in`
   - Uscita: `web+timecard:clock-out`

---

## 📍 Posizionamento del Tag

### Suggerimenti
- **Ingresso ufficio**: Attacca il tag vicino alla porta d'ingresso (comodo sia per entrare che uscire)
- **Sulla scrivania**: Se lavori sempre dalla stessa postazione
- **Altezza consigliata**: 1,20-1,40 metri (comoda per avvicinare l'iPhone)
- **Protezione**: Usa custodie adesive trasparenti per proteggere il tag
- **Accessibilità**: Posizionalo dove passi sempre (eviti di dimenticare la timbratura)

💡 **Consiglio**: Con un solo tag, il posto migliore è vicino alla porta d'ingresso - lo usi naturalmente sia entrando che uscendo!

---

## 🎨 Personalizzazioni

### Icone e Colori nei Comandi
- **Tag Universale**: ⏰ o 🔄 (rappresenta il toggle automatico)
- Oppure usa colori neutri come 🔵 Blu o ⚪ Bianco

### Feedback Visivo
L'app Timecard Pro mostrerà:
- ✅ Animazione di conferma
- 📊 Aggiornamento immediato del timer
- 🔔 Notifica push (se abilitata)

---

## 🚀 Funzionalità Avanzate

### Logging Automatico
L'app registra automaticamente:
- **Timestamp** preciso al millisecondo
- **Tipo** (Entrata/Uscita)
- **Durata sessione** in tempo reale
- **Sincronizzazione** con Supabase

### Offline Support
- Le timbrature funzionano anche **senza internet**
- Sincronizzazione automatica quando torni online
- **Service Worker** gestisce la cache

---

## ❓ FAQ

**D: Devo aprire l'app manualmente per timbrare?**  
R: **NO!** Se configurato correttamente (iOS 14+, "Chiedi prima di eseguire" disabilitato), basta avvicinare il tag anche con schermo bloccato. L'automazione parte in background automaticamente.

**D: Funziona con schermo spento/bloccato?**  
R: **SÌ** (iOS 14+). Avvicina il tag, senti vibrazione, e l'automazione parte. Potrebbe richiedere Face ID/Touch ID la prima volta, poi funziona sempre in background.

**D: Posso usare lo stesso tag per entrata e uscita?**  
R: **SÌ! È il metodo consigliato!** L'app rileva automaticamente lo stato attuale e fa il toggle. Un solo tag è più semplice, economico e impossibile da sbagliare.

**D: Quanto è veloce la timbratura?**  
R: Con iOS 16+: **<1 secondo** dal momento in cui avvicini il tag. Con iOS 14-15: 1-3 secondi.

**D: Funziona con Apple Watch?**  
R: Sì con limitazioni. Apple Watch Series 6+ ha NFC, ma l'app Comandi su watchOS ha funzionalità limitate. È più affidabile usare l'iPhone.

**D: I tag NFC hanno batteria?**  
R: No, sono completamente **passivi** e durano decenni senza manutenzione.

**D: Quante volte posso riscrivere un tag?**  
R: I tag NTAG213/215/216 supportano circa **100.000 cicli** di scrittura/cancellazione.

**D: Posso usare Web NFC API su iPhone?**  
R: No, Safari iOS non supporta Web NFC API. L'app **Comandi è l'unico modo** per automazioni NFC su iPhone.

**D: Cosa succede se non ho internet?**  
R: L'automazione parte ma la timbratura fallisce. Con Service Worker attivo, la timbratura viene salvata in cache e sincronizzata quando torni online.

**D: Posso usare NFC mentre uso altre app?**  
R: **SÌ!** Le automazioni NFC hanno priorità e funzionano indipendentemente dall'app attiva.

**D: Serve Face ID ogni volta?**  
R: Solo la **prima scansione** dopo il riavvio. Poi l'automazione ricorda l'autorizzazione e funziona senza Face ID.

**D: Posso disabilitare la notifica "Esecuzione automazione"?**  
R: No, iOS mostra sempre una notifica quando un'automazione si esegue. Ma è utile come feedback!

**D: Funziona con custodie protettive?**  
R: Dipende dallo spessore. Custodie sottili (<2mm) funzionano bene. Custodie spesse o con piastre metalliche possono bloccare il segnale NFC.

---

## 📱 Compatibilità iOS & Funzionalità Background

| Funzionalità | iOS 13 | iOS 14+ | iOS 15+ | iOS 16+ |
|--------------|--------|---------|---------|---------|
| NFC Tag Scan | ✅ | ✅ | ✅ | ✅ |
| Automazioni Base | ✅ | ✅ | ✅ | ✅ |
| **Background Automatico** | ❌ | ✅ | ✅ | ✅ |
| NFC da Schermo Bloccato | ⚠️ Limitato | ✅ | ✅ | ✅ |
| Notifiche Push | ✅ | ✅ | ✅ | ✅ |
| Focus Mode Integration | ❌ | ❌ | ⚠️ Parziale | ✅ |
| Chiusura Automatica App | ❌ | ❌ | ❌ | ✅ |

### 📝 Note Importanti per Background

**iOS 13:**
- NFC funziona ma richiede **sblocco manuale**
- Non supporta "Chiedi prima di eseguire = OFF"
- Limiti significativi per automazioni background

**iOS 14-15:**
- ✅ **Background completo** se "Chiedi prima di eseguire" è disabilitato
- ✅ NFC funziona da schermo bloccato (dopo Face ID/Touch ID)
- ⚠️ Alcune azioni potrebbero richiedere unlock

**iOS 16+:**
- ✅ **Esperienza ottimale** per automazioni NFC
- ✅ Supporto "Chiudi app" per chiudere Safari automaticamente
- ✅ Migliore integrazione Focus Mode
- ✅ Tempi di risposta più rapidi (<500ms)

---

## 🎓 Risorse Aggiuntive

- [Guida Ufficiale Apple Comandi](https://support.apple.com/it-it/guide/shortcuts/welcome/ios)
- [Specifiche NFC Forum](https://nfc-forum.org/)
- [NFC Tools App Store](https://apps.apple.com/it/app/nfc-tools/id1252962749)

---

## 🛠️ Supporto

Per problemi o domande:
1. Controlla la sezione [Troubleshooting](#troubleshooting)
2. Verifica i log nella console di Safari (Sviluppo > Mostra console)
3. Contatta il supporto tecnico con:
   - Modello iPhone
   - Versione iOS
   - Screenshot dell'errore

---

**✨ Buona timbratura automatica!** 🚀

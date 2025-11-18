<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ⏱️ Timecard Pro - Sistema di Gestione Presenze

Un'applicazione completa per la gestione delle presenze con supporto NFC, AI-powered PDF import, e dashboard personalizzabile.

## ✨ Caratteristiche Principali

- 🔐 **Autenticazione sicura** con Supabase
- ⏲️ **Timbratura NFC** per iPhone/Android
- 📱 **Integrazione iOS Shortcuts** per automazione
- 🤖 **Import PDF con AI** (Google Gemini) per cartellini automatici
- 📊 **Dashboard personalizzabile** con widget drag-and-drop
- 📅 **Calendario avanzato** con vista giorno/settimana/mese/anno
- 🎨 **Dark mode** con animazioni moderne
- 💾 **Offline support** con Service Worker
- 📈 **Statistiche in tempo reale** (ore lavorate, straordinari, permessi)
- 🏖️ **Gestione ferie/permessi** con contatori integrati

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js 18+ 
- Account Supabase
- Google Gemini API Key (opzionale, per import PDF)

### Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/tuousername/timecard-pro.git
   cd timecard-pro
   ```

2. **Installa dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   
   Crea un file `.env` nella root:
   ```env
   VITE_SUPABASE_URL=https://tuoprogetto.supabase.co
   VITE_SUPABASE_ANON_KEY=tua_anon_key_qui
   VITE_GOOGLE_API_KEY=tua_gemini_api_key_qui
   ```

4. **Setup Database Supabase**
   
   Esegui lo script SQL in `schema.sql` nella tua console Supabase

5. **Avvia l'app**
   ```bash
   npm run dev
   ```

   L'app sarà disponibile su `http://localhost:5173/`

## 📱 Configurazione NFC con iPhone

Per utilizzare tag NFC con iPhone per timbrature automatiche, consulta la guida completa:

👉 **[NFC_IPHONE_GUIDE.md](./NFC_IPHONE_GUIDE.md)**

La guida include:
- Setup tag NFC con app NFC Tools
- Creazione automazioni con app Comandi iOS
- Parametri URL per deep linking
- Troubleshooting e FAQ

### Quick Setup NFC
1. Scrivi `toggle` su un tag NFC con NFC Tools
2. Crea automazione in Comandi iOS → NFC
3. Azione: Apri URL → `https://tuodominio.com/?action=clock-in`
4. Disabilita "Chiedi prima di eseguire"
5. Ripeti per tag uscita con `?action=clock-out`

## 🏗️ Architettura

```
timecard-pro/
├── src/
│   ├── components/        # Componenti React riutilizzabili
│   │   ├── NfcScanner.tsx # Gestione NFC e timbratura
│   │   ├── Summary.tsx    # Riepilogo giornaliero
│   │   ├── calendar/      # Viste calendario
│   │   └── modals/        # Modali (turni, assenze, etc.)
│   ├── pages/             # Pagine principali
│   │   ├── DashboardPage.tsx
│   │   ├── CalendarPage.tsx
│   │   └── BalancesPage.tsx
│   ├── utils/             # Funzioni utility
│   │   ├── timeUtils.ts   # Calcolo ore, formattazione
│   │   ├── statusUtils.ts # Gestione saldi permessi
│   │   └── icsUtils.ts    # Export ICS
│   ├── App.tsx            # Root component
│   └── supabaseClient.ts  # Client Supabase
├── schema.sql             # Schema database Supabase
├── NFC_IPHONE_GUIDE.md    # Guida configurazione NFC
└── tailwind.config.js     # Configurazione Tailwind CSS
```

## 🎨 Tecnologie Utilizzate

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3 con dark mode
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Google Gemini 2.5 Flash per OCR cartellini PDF
- **Offline**: Service Worker con cache strategies
- **Charts**: Componenti custom con SVG
- **Calendar**: Implementazione custom con viste multiple

## 📊 Funzionalità Dettagliate

### Dashboard
- ⏱️ **NfcScanner**: Timbratura con animazioni, progress bar circolare
- 📈 **Summary**: Riepilogo giornaliero con turno programmato
- 📅 **WeeklySummary**: Statistiche settimanali
- 📆 **MonthlySummary**: Riepilogo mensile con straordinari
- 💰 **BalancesSummary**: Saldi permessi/ferie in real-time
- 🎯 **PlannerCard**: Accesso rapido al pianificatore turni

### Calendario
- 🔄 **Import PDF/Immagini** con Google Gemini AI
- 📤 **Export ICS/CSV** per integrazioni esterne
- 🎨 **Badge turni colorati** (MAT/POM/SER/NOT/RIP)
- 🗓️ **Viste multiple**: Giorno, Settimana, Mese, Anno
- ✏️ **Pianificatore visuale** con drag-and-drop
- 📍 **Gestione reperibilità** (on-call) con orari

### Saldi & Permessi
- ✅ **Contatori in tempo reale** con colori intelligenti
- ⚠️ **Avvisi saldo basso** prima di portare in negativo
- 🏖️ **Giustifica Assenza** integrato con contatori
- 📊 **Grafici donut** per visualizzazione utilizzo
- 🗓️ **Dettaglio per anno** con history completo

### Impostazioni
- ⚙️ **Configurazione turni** personalizzati
- 🔔 **Notifiche programmabili** per entrata/uscita
- 🎨 **Dark mode** persistente
- 📱 **Layout dashboard** personalizzabile
- 👤 **Gestione profilo** e logout

## 🔐 Sicurezza & Privacy

- 🔒 **Row Level Security (RLS)** su Supabase
- 🔑 **Auth JWT-based** con refresh tokens
- 🛡️ **Input sanitization** per XSS prevention
- 📜 **HTTPS only** in produzione
- 🚫 **No tracking** di terze parti

## 🌐 Deploy

### Vercel (Consigliato)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 🤝 Contribuire

I contributi sono benvenuti! Per favore:
1. Fai fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 📧 Contatti

Per supporto o domande:
- 📧 Email: support@timecardpro.com
- 🐛 Issues: [GitHub Issues](https://github.com/tuousername/timecard-pro/issues)

## 🙏 Ringraziamenti

- [Supabase](https://supabase.com/) per il backend
- [Google Gemini](https://ai.google.dev/) per l'AI OCR
- [Tailwind CSS](https://tailwindcss.com/) per lo styling
- [React](https://react.dev/) per il framework
- Community open source per le librerie utilizzate

---

**✨ Made with ❤️ by Timecard Pro Team** 🚀


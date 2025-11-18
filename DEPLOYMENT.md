# 🚀 Guida al Deployment - Timecard Pro

Questa guida ti aiuterà a pubblicare l'app su **Vercel** e **GitHub** in modo professionale.

---

## 📋 Pre-requisiti

- ✅ Account [GitHub](https://github.com)
- ✅ Account [Vercel](https://vercel.com)
- ✅ Account [Supabase](https://supabase.com)
- ✅ Google Gemini API Key (opzionale, per import PDF)

---

## 🔐 Step 1: Preparazione Repository GitHub

### 1.1 Verifica File Sensibili

Assicurati che `.gitignore` sia configurato correttamente:

```bash
# Verifica che questi file NON siano tracciati
git status

# Se vedi .env o .env.local, rimuovili dalla storia Git
git rm --cached .env .env.local
git commit -m "chore: rimozione file sensibili"
```

### 1.2 Crea Repository su GitHub

1. Vai su [github.com/new](https://github.com/new)
2. Nome repository: `timecard-pro` (o nome a tua scelta)
3. Descrizione: "Sistema avanzato di gestione presenze con NFC, AI-powered PDF import e dashboard personalizzabile"
4. **Privato** (consigliato) o Pubblico
5. NON inizializzare con README (ne hai già uno)
6. Clicca **"Create repository"**

### 1.3 Collega Repository Locale

```bash
# Nel terminale, nella cartella del progetto
git init
git add .
git commit -m "feat: initial commit - Timecard Pro v1.0.0"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/timecard-pro.git
git push -u origin main
```

---

## ⚙️ Step 2: Configurazione Supabase

### 2.1 Crea Progetto Supabase

1. Vai su [app.supabase.com](https://app.supabase.com)
2. **"New project"**
3. Nome: `timecard-pro`
4. Database Password: Genera una password sicura (salvala!)
5. Region: Scegli la più vicina ai tuoi utenti
6. Clicca **"Create new project"**

### 2.2 Esegui Schema Database

1. Vai su **SQL Editor** nel dashboard Supabase
2. Clicca **"New query"**
3. Copia **TUTTO** il contenuto di `database_schema.sql`
4. Incolla nell'editor
5. Clicca **"Run"** (⌘+Enter)
6. Verifica successo: dovresti vedere 4 tabelle create

### 2.3 Configura Autenticazione

1. Vai su **Authentication** → **Providers**
2. Abilita **Email** (attivo di default)
3. Opzionale: Abilita **Google**, **GitHub** per OAuth
4. Vai su **Authentication** → **URL Configuration**
5. **Site URL**: `https://tuodominio.vercel.app` (lo aggiornerai dopo il deploy)
6. **Redirect URLs**: Aggiungi `https://tuodominio.vercel.app/**`

### 2.4 Ottieni Credenziali API

1. Vai su **Settings** → **API**
2. Copia:
   - **Project URL**: `https://tuoprogetto.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Salva questi valori (li userai su Vercel)

---

## 🌐 Step 3: Deploy su Vercel

### 3.1 Importa Progetto da GitHub

1. Vai su [vercel.com/new](https://vercel.com/new)
2. **"Import Git Repository"**
3. Seleziona il tuo repository `timecard-pro`
4. Clicca **"Import"**

### 3.2 Configura Variabili d'Ambiente

Nella sezione **Environment Variables**, aggiungi:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://tuoprogetto.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `VITE_GOOGLE_API_KEY` | `AIzaSy...` (opzionale) | Production, Preview, Development |

⚠️ **IMPORTANTE**: Copia i valori esatti da Supabase!

### 3.3 Configura Build Settings

Vercel rileva automaticamente Vite, ma verifica:

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` (o `vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Deploy!

1. Clicca **"Deploy"**
2. Attendi 2-3 minuti
3. 🎉 Il tuo sito sarà live su `https://tuoprogetto.vercel.app`

---

## 🔄 Step 4: Aggiorna URL in Supabase

Ora che hai l'URL Vercel:

1. Torna su [app.supabase.com](https://app.supabase.com)
2. **Authentication** → **URL Configuration**
3. **Site URL**: `https://tuoprogetto.vercel.app`
4. **Redirect URLs**: Aggiungi:
   - `https://tuoprogetto.vercel.app/**`
   - `http://localhost:5173/**` (per sviluppo locale)
5. Salva

---

## 🧪 Step 5: Test Completo

### 5.1 Test Registrazione/Login

1. Vai su `https://tuoprogetto.vercel.app`
2. Registra un nuovo account
3. Verifica email di conferma
4. Login con le credenziali

### 5.2 Test Timbratura

1. Clicca **"Registra Entrata"**
2. Verifica che la timbratura appaia nel riepilogo
3. Ricarica pagina → i dati devono persistere

### 5.3 Test Import PDF (se hai configurato Gemini)

1. Vai su **Calendario**
2. Clicca **"Importa"**
3. Carica un'immagine o PDF di cartellino
4. Verifica che le timbrature vengano estratte

### 5.4 Test NFC (opzionale, richiede iPhone)

1. Segui la guida `NFC_IPHONE_GUIDE.md`
2. Configura l'automazione con l'URL Vercel
3. Testa con tag NFC

---

## 🔧 Step 6: Configurazioni Avanzate (Opzionali)

### 6.1 Custom Domain

1. Vercel Dashboard → **Settings** → **Domains**
2. Aggiungi il tuo dominio (es. `timecard.tuosito.com`)
3. Configura DNS secondo le istruzioni Vercel
4. Aggiorna URL in Supabase

### 6.2 Analytics

```bash
npm install @vercel/analytics
```

In `src/index.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

### 6.3 Preview Deployments

Ogni push su branch diverso da `main` crea un deploy di preview:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel genererà automaticamente: `https://timecard-pro-xxx.vercel.app`

### 6.4 Protezione Branch

Su GitHub:

1. **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. ✅ Require pull request reviews before merging
4. ✅ Require status checks to pass

---

## 📊 Step 7: Monitoraggio e Manutenzione

### 7.1 Vercel Dashboard

Monitora:
- **Deployments**: Storia di tutti i deploy
- **Analytics**: Visite, performance
- **Logs**: Errori in produzione

### 7.2 Supabase Dashboard

Monitora:
- **Database**: Numero di righe, storage usato
- **Auth**: Utenti registrati
- **API**: Richieste al secondo
- **Logs**: Errori e query lente

### 7.3 Aggiornamenti

```bash
# Sviluppo locale
git checkout -b feature/nuova-funzionalita
# ... fai modifiche ...
git add .
git commit -m "feat: aggiunta nuova funzionalità"
git push origin feature/nuova-funzionalita

# Su GitHub: crea Pull Request → Review → Merge
# Vercel farà automaticamente il deploy su main
```

---

## 🐛 Troubleshooting Comune

### Errore: "Failed to fetch"

**Causa**: Variabili ambiente non configurate su Vercel

**Soluzione**:
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Verifica che `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` siano corretti
3. **Re-deploy** il progetto

### Errore: "Auth session missing!"

**Causa**: URL non configurato in Supabase

**Soluzione**:
1. Supabase → **Authentication** → **URL Configuration**
2. Aggiungi l'URL Vercel esatto
3. Riprova il login

### Build Fallito

**Causa**: Errori TypeScript o dipendenze mancanti

**Soluzione**:
```bash
# Testa build locale
npm run build

# Se fallisce, correggi gli errori
# Poi commit e push
git add .
git commit -m "fix: risolti errori build"
git push
```

### 404 su Refresh

**Causa**: SPA routing non configurato

**Soluzione**: `vercel.json` è già configurato con:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Se manca, crealo e re-deploya.

---

## 🎉 Congratulazioni!

La tua app **Timecard Pro** è ora live e accessibile worldwide! 🌍

**Prossimi passi consigliati:**
- 📱 Configura NFC per timbrature automatiche
- 📊 Monitora analytics e feedback utenti
- 🚀 Aggiungi nuove funzionalità (notifiche push, report PDF, etc.)
- 🔒 Configura backup automatici database Supabase

---

## 📚 Risorse Utili

- [Documentazione Vercel](https://vercel.com/docs)
- [Documentazione Supabase](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ by Timecard Pro Team**

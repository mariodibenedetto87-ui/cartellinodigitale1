# 🚀 Checklist Pre-Deploy - Timecard Pro

Prima di pubblicare su GitHub e Vercel, verifica di aver completato tutti questi passaggi:

## ✅ Sicurezza (CRITICO)

- [x] `.gitignore` creato e configurato correttamente
- [ ] Verificato che `.env` e `.env.local` NON siano tracciati da Git
  ```bash
  git status
  # Se vedi .env o .env.local, esegui:
  git rm --cached .env .env.local
  ```
- [ ] Creato `.env.example` con valori template (NO valori reali)
- [ ] API keys NON presenti nel codice sorgente
- [ ] Console.log di debug rimossi dal codice produzione

## ✅ Configurazione Database

- [ ] Schema Supabase eseguito senza errori (`database_schema.sql`)
- [ ] RLS (Row Level Security) abilitato su tutte le tabelle
- [ ] Policy configurate correttamente per `authenticated` users
- [ ] Testato inserimento/lettura dati via app

## ✅ Build e Ottimizzazione

- [x] `vite.config.ts` ottimizzato (minify, code splitting, drop_console)
- [x] `vercel.json` con security headers e rewrites SPA
- [x] ErrorBoundary implementato per catturare errori React
- [ ] Build locale eseguita con successo
  ```bash
  npm run build
  # Verifica che dist/ venga creato senza errori
  ```
- [ ] Preview build testato localmente
  ```bash
  npm run preview
  # Apri http://localhost:4173 e testa l'app
  ```

## ✅ Testing Funzionalità

- [ ] Registrazione nuovo utente funzionante
- [ ] Login/Logout funzionante
- [ ] Timbratura entrata/uscita persistente nel database
- [ ] Calendario mostra correttamente le timbrature
- [ ] Permessi orari: aggiunta/modifica funzionante
- [ ] Import PDF (se configurato Gemini API) funzionante
- [ ] Dark mode funzionante
- [ ] Responsive design testato (mobile, tablet, desktop)

## ✅ Preparazione GitHub

- [ ] Repository creato su GitHub (pubblico o privato)
- [ ] README.md aggiornato con informazioni progetto
- [ ] DEPLOYMENT.md presente con istruzioni complete
- [ ] NFC_IPHONE_GUIDE.md presente (se usi NFC)
- [ ] Commit iniziale preparato:
  ```bash
  git init
  git add .
  git commit -m "feat: initial commit - Timecard Pro v1.0.0"
  git branch -M main
  git remote add origin https://github.com/TUO-USERNAME/timecard-pro.git
  ```

## ✅ Preparazione Vercel

- [ ] Account Vercel creato
- [ ] Progetto Supabase attivo con database configurato
- [ ] Credenziali Supabase copiate:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] (Opzionale) Google Gemini API Key copiata: `VITE_GOOGLE_API_KEY`

## ✅ Post-Deploy

- [ ] Vercel deploy completato con successo
- [ ] URL produzione funzionante (https://tuoprogetto.vercel.app)
- [ ] Aggiornato Site URL in Supabase Authentication:
  - [ ] Site URL: `https://tuoprogetto.vercel.app`
  - [ ] Redirect URLs: `https://tuoprogetto.vercel.app/**`
- [ ] Testato registrazione/login su produzione
- [ ] Testato timbratura su produzione
- [ ] Verificato che i dati persistono correttamente

## ✅ Pulizia e Documentazione

- [x] File obsoleti rimossi (`schema.sql` vecchio)
- [x] Duplicati rimossi (App.tsx, types.ts nella root)
- [ ] Documentazione NFC configurata (se usi iPhone)
- [ ] Custom domain configurato (opzionale)

## 📊 Checklist Avanzata (Opzionale)

- [ ] Analytics configurato (Vercel Analytics o Google Analytics)
- [ ] Error monitoring configurato (Sentry, LogRocket)
- [ ] CI/CD pipeline configurato (GitHub Actions)
- [ ] Lighthouse score verificato (Performance, SEO, Accessibility)
- [ ] Test E2E scritti (Playwright, Cypress)
- [ ] Backup database configurato su Supabase

## 🐛 Problemi Comuni

### Build fallisce con errori TypeScript
```bash
npm run type-check
# Correggi tutti gli errori TypeScript
```

### "Failed to fetch" su produzione
- Verifica che le variabili d'ambiente su Vercel siano corrette
- Controlla che `VITE_` sia il prefisso per tutte le variabili

### Login non funziona su produzione
- Verifica che l'URL Vercel sia aggiunto in Supabase → Authentication → URL Configuration

### NFC non funziona
- Assicurati di usare l'URL HTTPS di produzione (non localhost)
- Verifica che l'automazione iOS sia configurata correttamente

## ✅ Finito!

Una volta completata questa checklist, la tua app è pronta per essere pubblicata! 🎉

Per pubblicare:
```bash
# Push su GitHub
git push -u origin main

# Deploy automatico su Vercel (collega il repo GitHub)
# oppure usa Vercel CLI:
npx vercel --prod
```

---

**Made with ❤️ by Timecard Pro Team**

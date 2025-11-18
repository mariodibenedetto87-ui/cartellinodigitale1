# Configurazione Autenticazione Supabase per Logout

## Problema
Il logout funziona in locale ma non su Vercel in produzione.

## Soluzione

### 1. Configura i Redirect URL su Supabase

Vai su: https://supabase.com/dashboard/project/vzsowooniljgvewpchko/auth/url-configuration

Aggiungi questi URL nelle **Redirect URLs**:

```
http://localhost:5173
http://localhost:5173/
https://cartellinodigitale1-dfp3dlqqa-marios-projects-dad1128c.vercel.app
https://cartellinodigitale1-dfp3dlqqa-marios-projects-dad1128c.vercel.app/
https://*.vercel.app
```

### 2. Configura il Site URL

Imposta il **Site URL** principale (IMPORTANTE - usa l'URL attuale):
```
https://cartellinodigitale1-dnko83w7q-marios-projects-dad1128c.vercel.app
```

**NOTA**: Se hai un dominio personalizzato, usalo invece dell'URL Vercel.

### 2b. Verifica Authentication Settings

Assicurati che nelle impostazioni di autenticazione:
- **Enable email confirmations** sia DISABILITATO per il testing
- **Secure email change** sia configurato correttamente

### 3. Abilita Email Provider (se non già fatto)

Assicurati che il provider Email sia abilitato in:
https://supabase.com/dashboard/project/vzsowooniljgvewpchko/auth/providers

### 4. Verifica le modifiche al codice

Le modifiche già implementate:
- ✅ `supabaseClient.ts`: Aggiunte opzioni auth con `flowType: 'pkce'`
- ✅ `App.tsx`: `handleLogout()` con gestione errori e reset dello state locale
- ✅ `Header.tsx`: Pulsante logout visibile

## Come testare

1. Esegui il deploy: `git add -A && git commit -m "fix: logout configuration" && git push origin main && vercel --prod`
2. Apri l'app su Vercel
3. Fai login
4. Clicca sul pulsante di logout rosso
5. Dovresti essere reindirizzato alla pagina di login

## Note
- Il logout ora include un reset completo dello stato locale
- Viene mostrato un toast di conferma
- Gli errori vengono loggati nella console per debugging

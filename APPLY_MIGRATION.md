# 🚀 Quick Start - Applicare Migration theme_settings

## ⚡ Passo 1: Apri Supabase Dashboard

Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor

## 📋 Passo 2: Copia SQL

Copia il seguente codice:

```sql
-- Migration: Add theme_settings column
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{"mode":"system","accentColor":"teal"}'::jsonb;

-- Commento sulla colonna
COMMENT ON COLUMN user_settings.theme_settings IS 'Impostazioni tema utente (mode: system/light/dark, accentColor: colore principale)';

-- Aggiorna record esistenti
UPDATE user_settings 
SET theme_settings = '{"mode":"system","accentColor":"teal"}'::jsonb 
WHERE theme_settings IS NULL;
```

## ▶️ Passo 3: Esegui

1. Incolla il codice nell'SQL Editor
2. Clicca **Run** (o premi Ctrl+Enter)
3. Dovresti vedere: ✅ "Success. No rows returned"

## ✅ Passo 4: Verifica

Esegui questa query per verificare:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings' 
  AND column_name = 'theme_settings';
```

**Output atteso**:
```
column_name    | data_type | column_default
theme_settings | jsonb     | '{"mode":"system","accentColor":"teal"}'::jsonb
```

## 🎉 Fatto!

Ora l'app può salvare le preferenze tema nel cloud! 

**Test nell'app**:
1. Apri l'app
2. Vai in Impostazioni → Tema
3. Cambia tema (es. Dark mode)
4. Fai logout e login
5. Verifica che il tema sia stato salvato ✨

---

**Problemi?** Leggi `supabase/migrations/README.md` per troubleshooting dettagliato.

# 📁 Supabase Migrations

Questa cartella contiene le migration SQL per aggiornare il database Supabase.

## 🔧 Come Applicare le Migration

### Metodo 1: Dashboard Supabase (Consigliato)

1. Vai su [supabase.com](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** nel menu laterale
4. Apri il file della migration (es. `20250120_add_theme_settings.sql`)
5. Copia e incolla il contenuto nell'editor
6. Clicca **Run** per eseguire

### Metodo 2: Supabase CLI

```bash
# 1. Installa Supabase CLI (se non già installato)
npm install -g supabase

# 2. Login
supabase login

# 3. Link al progetto
supabase link --project-ref your-project-ref

# 4. Applica la migration
supabase db push
```

### Metodo 3: API REST (Avanzato)

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_settings JSONB;"}'
```

## 📋 Lista Migration

| Data | File | Descrizione | Status |
|------|------|-------------|--------|
| 2025-01-20 | `20250120_add_theme_settings.sql` | Aggiunge colonna `theme_settings` a `user_settings` | ⏳ Da applicare |

## ✅ Verifica Applicazione

Dopo aver applicato la migration, verifica che sia andata a buon fine:

```sql
-- Controlla se la colonna esiste
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings' 
  AND column_name = 'theme_settings';

-- Output atteso:
-- column_name    | data_type | column_default
-- theme_settings | jsonb     | '{"mode":"system","accentColor":"teal"}'::jsonb
```

## 🔄 Rollback (Se Necessario)

Se la migration causa problemi:

```sql
-- Rimuovi la colonna theme_settings
ALTER TABLE user_settings DROP COLUMN IF EXISTS theme_settings;
```

⚠️ **Attenzione**: Questo cancellerà tutti i dati salvati nella colonna!

## 📝 Note

- Le migration sono idempotenti (`IF NOT EXISTS`) quindi è sicuro eseguirle più volte
- Fai sempre un backup prima di applicare migration in produzione
- Testa le migration su un progetto di sviluppo prima di applicarle in produzione

## 🆘 Troubleshooting

### Errore: "permission denied for table user_settings"

Usa la service role key invece della anon key:
- Dashboard → Settings → API → Service Role Key

### Errore: "column already exists"

La migration è già stata applicata. Puoi ignorare l'errore o usare `IF NOT EXISTS`.

### Tema non salvato dopo migration

1. Verifica che la migration sia stata applicata con successo
2. Fai logout e login nell'app
3. Cambia il tema e verifica che venga salvato
4. Controlla la tabella: `SELECT theme_settings FROM user_settings WHERE user_id = 'YOUR_USER_ID';`

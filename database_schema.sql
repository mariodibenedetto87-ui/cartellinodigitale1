-- =====================================================
-- TIMECARD PRO - SCHEMA DATABASE SUPABASE
-- =====================================================
-- Questo schema definisce tutte le tabelle necessarie
-- per il funzionamento dell'app, incluso il supporto NFC
-- =====================================================

-- Abilita Row Level Security (RLS)
-- Importante: ogni tabella deve avere RLS abilitato per sicurezza

-- =====================================================
-- TABELLA: user_settings
-- Memorizza tutte le impostazioni utente
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    work_settings JSONB DEFAULT '{}'::jsonb,
    offer_settings JSONB DEFAULT '{}'::jsonb,
    dashboard_layout JSONB DEFAULT '{}'::jsonb,
    widget_visibility JSONB DEFAULT '{}'::jsonb,
    status_items JSONB DEFAULT '[]'::jsonb,
    saved_rotations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo le proprie impostazioni
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire le proprie impostazioni
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare le proprie impostazioni
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare le proprie impostazioni
CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABELLA: time_logs
-- Memorizza tutte le timbrature (entrate/uscite)
-- CRITICO PER NFC: Questa tabella riceve i dati dalle timbrature NFC
-- =====================================================
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index per performance
    CONSTRAINT time_logs_user_timestamp_idx UNIQUE (user_id, timestamp)
);

-- Indici per query veloci
CREATE INDEX IF NOT EXISTS time_logs_user_id_idx ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS time_logs_timestamp_idx ON time_logs(timestamp);
-- Rimosso indice con DATE() perché causa errore IMMUTABLE
-- L'indice su timestamp è sufficiente per query per data

-- Abilita RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo le proprie timbrature
CREATE POLICY "Users can view own time logs" ON time_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire le proprie timbrature
-- IMPORTANTE: Questa policy permette l'inserimento NFC automatico
CREATE POLICY "Users can insert own time logs" ON time_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare le proprie timbrature
CREATE POLICY "Users can update own time logs" ON time_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare le proprie timbrature
CREATE POLICY "Users can delete own time logs" ON time_logs
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABELLA: day_info
-- Memorizza informazioni giornaliere (turni, assenze, reperibilità)
-- =====================================================
CREATE TABLE IF NOT EXISTS day_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint per evitare duplicati
    CONSTRAINT day_info_user_date_unique UNIQUE (user_id, date)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS day_info_user_id_idx ON day_info(user_id);
CREATE INDEX IF NOT EXISTS day_info_date_idx ON day_info(date);
-- Indice composito per query user+date (il più usato)
CREATE INDEX IF NOT EXISTS day_info_user_date_idx ON day_info(user_id, date);

-- Abilita RLS
ALTER TABLE day_info ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo le proprie info giornaliere
CREATE POLICY "Users can view own day info" ON day_info
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire le proprie info
CREATE POLICY "Users can insert own day info" ON day_info
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare le proprie info
CREATE POLICY "Users can update own day info" ON day_info
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare le proprie info
CREATE POLICY "Users can delete own day info" ON day_info
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABELLA: manual_overtime
-- Memorizza straordinari inseriti manualmente
-- =====================================================
CREATE TABLE IF NOT EXISTS manual_overtime (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    entry JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS manual_overtime_user_id_idx ON manual_overtime(user_id);
CREATE INDEX IF NOT EXISTS manual_overtime_date_idx ON manual_overtime(date);
-- Indice composito per query user+date
CREATE INDEX IF NOT EXISTS manual_overtime_user_date_idx ON manual_overtime(user_id, date);

-- Abilita RLS
ALTER TABLE manual_overtime ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo i propri straordinari
CREATE POLICY "Users can view own overtime" ON manual_overtime
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire i propri straordinari
CREATE POLICY "Users can insert own overtime" ON manual_overtime
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare i propri straordinari
CREATE POLICY "Users can update own overtime" ON manual_overtime
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare i propri straordinari
CREATE POLICY "Users can delete own overtime" ON manual_overtime
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNZIONI TRIGGER PER UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per day_info
DROP TRIGGER IF EXISTS update_day_info_updated_at ON day_info;
CREATE TRIGGER update_day_info_updated_at
    BEFORE UPDATE ON day_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per manual_overtime
DROP TRIGGER IF EXISTS update_manual_overtime_updated_at ON manual_overtime;
CREATE TRIGGER update_manual_overtime_updated_at
    BEFORE UPDATE ON manual_overtime
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTE UTILI (OPZIONALI)
-- =====================================================

-- Vista per statistiche giornaliere
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
    tl.user_id,
    tl.timestamp::date as date,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE type = 'in') as clock_ins,
    COUNT(*) FILTER (WHERE type = 'out') as clock_outs,
    MIN(timestamp) FILTER (WHERE type = 'in') as first_in,
    MAX(timestamp) FILTER (WHERE type = 'out') as last_out
FROM time_logs tl
GROUP BY tl.user_id, tl.timestamp::date;

-- Vista per timbrature recenti (ultime 7 giorni)
CREATE OR REPLACE VIEW recent_time_logs AS
SELECT *
FROM time_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- =====================================================
-- VERIFICHE E VALIDAZIONI
-- =====================================================

-- Verifica che tutte le tabelle abbiano RLS abilitato
DO $$ 
BEGIN
    -- Controlla user_settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'user_settings' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non abilitato su user_settings';
    END IF;
    
    -- Controlla time_logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'time_logs' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non abilitato su time_logs';
    END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Gli utenti autenticati possono accedere alle tabelle
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON time_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON day_info TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON manual_overtime TO authenticated;

-- Gli utenti autenticati possono accedere alle viste
GRANT SELECT ON daily_stats TO authenticated;
GRANT SELECT ON recent_time_logs TO authenticated;

-- =====================================================
-- FINE SCHEMA
-- =====================================================

-- Per verificare lo schema creato, eseguire:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('user_settings', 'time_logs', 'day_info', 'manual_overtime')
-- ORDER BY table_name, ordinal_position;

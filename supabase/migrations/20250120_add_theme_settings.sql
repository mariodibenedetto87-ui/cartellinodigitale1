-- Migration: Add theme_settings column to user_settings table
-- Date: 2025-01-20
-- Description: Aggiunge la colonna theme_settings per salvare le preferenze tema nel cloud

-- Aggiungi colonna theme_settings se non esiste
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{"mode":"system","accentColor":"teal"}'::jsonb;

-- Commento sulla colonna
COMMENT ON COLUMN user_settings.theme_settings IS 'Impostazioni tema utente (mode: system/light/dark, accentColor: colore principale)';

-- Aggiorna record esistenti che hanno theme_settings NULL
UPDATE user_settings 
SET theme_settings = '{"mode":"system","accentColor":"teal"}'::jsonb 
WHERE theme_settings IS NULL;

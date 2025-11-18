-- Migration: Add theme_settings column to user_settings table
-- Date: 2025-11-18
-- Description: Aggiunge supporto per temi colore personalizzati

-- Add theme_settings column with default value
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{"accentColor": "teal", "primaryShade": "500"}'::jsonb;

-- Update existing rows to have default theme
UPDATE user_settings 
SET theme_settings = '{"accentColor": "teal", "primaryShade": "500"}'::jsonb
WHERE theme_settings IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.theme_settings IS 'User theme color preferences (accentColor, primaryShade)';

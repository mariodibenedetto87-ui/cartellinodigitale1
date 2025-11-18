-- Tabella per gestire i buoni pasto
-- Un buono pasto viene maturato quando:
-- 1. Si lavora 7 ore continuative senza pause (o con pausa max 2h)
-- 2. Si lavora almeno 6h + pausa max 2h + altre ore
-- Massimo 1 buono al giorno

CREATE TABLE IF NOT EXISTS meal_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    earned BOOLEAN DEFAULT true,
    manual BOOLEAN DEFAULT false,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_meal_vouchers_user_date ON meal_vouchers(user_id, date);

-- RLS policies
ALTER TABLE meal_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meal vouchers"
    ON meal_vouchers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal vouchers"
    ON meal_vouchers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal vouchers"
    ON meal_vouchers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal vouchers"
    ON meal_vouchers FOR DELETE
    USING (auth.uid() = user_id);

-- Add additional fields to clients table to match frontend
-- Run this in Supabase SQL Editor

-- Add contract and tier fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS contract_value DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{"street":"","city":"","state":"","zipCode":"","country":"USA"}'::jsonb,
ADD COLUMN IF NOT EXISTS primary_contact JSONB DEFAULT '{"name":"","email":"","phone":"","title":""}'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on tier for filtering
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);

-- Verify new columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY column_name;


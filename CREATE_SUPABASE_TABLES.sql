-- ============================================
-- Complete Supabase Table Creation Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tables if you want a fresh start (OPTIONAL - uncomment if needed)
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS ai_reports CASCADE;
-- DROP TABLE IF EXISTS service_efficiency CASCADE;
-- DROP TABLE IF EXISTS financial_insights CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'IT_Manager', 'Technician')),
  company VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(100) NOT NULL,
  industry VARCHAR(50) NOT NULL DEFAULT 'General',
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(client_name);

-- ============================================
-- 3. FINANCIAL INSIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  revenue DECIMAL(12,2) NOT NULL CHECK (revenue >= 0),
  expenses DECIMAL(12,2) NOT NULL CHECK (expenses >= 0),
  profit_margin DECIMAL(5,2) NOT NULL CHECK (profit_margin >= -100 AND profit_margin <= 100),
  spend_breakdown JSONB NOT NULL,
  ai_recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_client_month UNIQUE(client_id, month)
);

CREATE INDEX IF NOT EXISTS idx_financial_insights_client ON financial_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_insights_month ON financial_insights(month);
CREATE INDEX IF NOT EXISTS idx_financial_insights_created_at ON financial_insights(created_at DESC);

-- ============================================
-- 4. SERVICE EFFICIENCY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_efficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tasks_completed INTEGER NOT NULL CHECK (tasks_completed >= 0),
  avg_response_time DECIMAL(10,2) NOT NULL CHECK (avg_response_time >= 0),
  avg_resolution_time DECIMAL(10,2) NOT NULL CHECK (avg_resolution_time >= 0),
  ai_suggestions TEXT[] DEFAULT '{}',
  week VARCHAR(8) NOT NULL CHECK (week ~ '^\d{4}-W\d{2}$'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_efficiency_tech ON service_efficiency(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_efficiency_client ON service_efficiency(client_id);
CREATE INDEX IF NOT EXISTS idx_service_efficiency_week ON service_efficiency(week);
CREATE INDEX IF NOT EXISTS idx_service_efficiency_created_at ON service_efficiency(created_at DESC);

-- ============================================
-- 5. AI REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('Financial Forecast', 'Service Optimization')),
  generated_for_id UUID NOT NULL,
  generated_for_type VARCHAR(20) NOT NULL CHECK (generated_for_type IN ('client', 'user')),
  summary TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes AFTER table is created
CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reports_for_id ON ai_reports(generated_for_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_for_type ON ai_reports(generated_for_type);

-- ============================================
-- 6. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details VARCHAR(1000) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- ============================================
-- VERIFICATION - Check tables were created
-- ============================================
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'clients', 'financial_insights', 'service_efficiency', 'ai_reports', 'activity_logs')
ORDER BY table_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All tables created successfully!';
  RAISE NOTICE 'Tables: users, clients, financial_insights, service_efficiency, ai_reports, activity_logs';
END $$;


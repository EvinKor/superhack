-- SIMPLIFIED TABLE CREATION - Run this if the other script fails
-- Copy and paste this into Supabase SQL Editor and click RUN

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL,
  company VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 2. Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(100) NOT NULL,
  industry VARCHAR(50) NOT NULL DEFAULT 'General',
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Financial Insights table
CREATE TABLE IF NOT EXISTS financial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  month VARCHAR(7) NOT NULL,
  revenue DECIMAL(12,2) NOT NULL,
  expenses DECIMAL(12,2) NOT NULL,
  profit_margin DECIMAL(5,2) NOT NULL,
  spend_breakdown JSONB NOT NULL,
  ai_recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Service Efficiency table
CREATE TABLE IF NOT EXISTS service_efficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  tasks_completed INTEGER NOT NULL,
  avg_response_time DECIMAL(10,2) NOT NULL,
  avg_resolution_time DECIMAL(10,2) NOT NULL,
  ai_suggestions TEXT[],
  week VARCHAR(8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Reports table
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  generated_for_id UUID NOT NULL,
  generated_for_type VARCHAR(20) NOT NULL,
  summary TEXT NOT NULL,
  recommendations TEXT[],
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details VARCHAR(1000) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(50) NOT NULL
);

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'clients', 'financial_insights', 'service_efficiency', 'ai_reports', 'activity_logs')
ORDER BY table_name;


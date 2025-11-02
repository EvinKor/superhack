# 🔧 Setup Supabase Tables - Complete Guide

## ❗ The 500 Error is Because Tables Don't Exist

Your backend is trying to insert into Supabase, but the tables haven't been created yet!

---

## ✅ Solution: Create Tables in Supabase (5 Minutes)

### Step 1: Go to Supabase Dashboard

Visit: https://app.supabase.com

1. Log in to your account
2. Select your project (https://ldyiaftmraikioioexcu.supabase.co)
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy the SQL Script

Open this file in your project:
```
CREATE_SUPABASE_TABLES.sql
```

**Or copy this:**

```sql
-- Users table
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

-- Clients table
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

-- Financial Insights table
CREATE TABLE IF NOT EXISTS financial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  revenue DECIMAL(12,2) NOT NULL,
  expenses DECIMAL(12,2) NOT NULL,
  profit_margin DECIMAL(5,2) NOT NULL,
  spend_breakdown JSONB NOT NULL,
  ai_recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month)
);

CREATE INDEX IF NOT EXISTS idx_financial_insights_client ON financial_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_insights_month ON financial_insights(month);

-- Service Efficiency table
CREATE TABLE IF NOT EXISTS service_efficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tasks_completed INTEGER NOT NULL,
  avg_response_time DECIMAL(10,2) NOT NULL,
  avg_resolution_time DECIMAL(10,2) NOT NULL,
  ai_suggestions TEXT[] DEFAULT '{}',
  week VARCHAR(8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_efficiency_tech ON service_efficiency(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_efficiency_client ON service_efficiency(client_id);

-- AI Reports table
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  generated_for_id UUID NOT NULL,
  generated_for_type VARCHAR(20) NOT NULL,
  summary TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at DESC);

-- Activity Logs table
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
```

### Step 3: Run the SQL

1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** or press Ctrl+Enter
3. Wait for "Success" message

You should see:
```
Success. No rows returned
```

This is normal! It means the tables were created.

### Step 4: Verify Tables Created

Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- activity_logs
- ai_reports
- clients
- financial_insights
- service_efficiency
- users

---

## ✅ After Creating Tables

### Step 1: Restart Backend

```powershell
# Stop backend (Ctrl+C)
npm run dev
```

### Step 2: Try Saving a Client

Go to your frontend and try creating a client again.

**It will work!** ✅

---

## 🎯 Why This Fixes It

**Before:**
- Backend tries to INSERT into `clients` table
- Table doesn't exist
- Supabase returns error
- You get 500 error

**After:**
- Backend tries to INSERT into `clients` table
- Table exists ✅
- Data is saved
- You get success! ✅

---

## 📊 Bonus: Your System Will Be Complete!

Once tables are created, ALL features will work:
- ✅ User authentication
- ✅ Client management (create/edit/delete)
- ✅ Financial insights
- ✅ Service efficiency
- ✅ AI reports
- ✅ Activity logs

---

## 🚀 Quick Actions

**Do this now:**

1. **Go to Supabase:** https://app.supabase.com
2. **Click:** SQL Editor
3. **Paste:** The SQL from `CREATE_SUPABASE_TABLES.sql`
4. **Click:** Run
5. **Wait:** For success message
6. **Restart:** Your backend (`npm run dev`)
7. **Test:** Save a client - it will work!

---

**This is the final piece! Create the tables and everything will work perfectly!** 🎉

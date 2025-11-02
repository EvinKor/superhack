import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ldyiaftmraikioioexcu.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeWlhZnRtcmFpa2lvaW9leGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzY0NDAsImV4cCI6MjA3NzY1MjQ0MH0.Km1HXtvgDfRD1tbh0L8pIKQCUTJUO5sTu6x8vzoFrDA';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Database table names
export const Tables = {
  USERS: 'users',
  CLIENTS: 'clients',
  FINANCIAL_INSIGHTS: 'financial_insights',
  SERVICE_EFFICIENCY: 'service_efficiency',
  AI_REPORTS: 'ai_reports',
  ACTIVITY_LOGS: 'activity_logs'
} as const;

// Test database connection
export async function testConnection() {
  try {
    const { error } = await supabase.from(Tables.USERS).select('count', { count: 'exact', head: true });
    if (error) throw error;
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection failed:', error);
    return false;
  }
}

export default supabase;


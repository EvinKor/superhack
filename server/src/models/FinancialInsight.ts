// FinancialInsight model for Supabase
export interface SpendBreakdown {
  software_licenses: number;
  hardware_maintenance: number;
  cloud_services: number;
  labor_costs: number;
}

export interface FinancialInsight {
  id: string;
  client_id: string;
  month: string; // YYYY-MM format
  revenue: number;
  expenses: number;
  profit_margin: number;
  spend_breakdown: SpendBreakdown;
  ai_recommendations: string[];
  created_at: string;
}

export interface FinancialInsightInsert {
  client_id: string;
  month: string;
  revenue: number;
  expenses: number;
  profit_margin: number;
  spend_breakdown: SpendBreakdown;
  ai_recommendations?: string[];
  created_at?: string;
}

export interface FinancialInsightUpdate {
  client_id?: string;
  month?: string;
  revenue?: number;
  expenses?: number;
  profit_margin?: number;
  spend_breakdown?: SpendBreakdown;
  ai_recommendations?: string[];
}



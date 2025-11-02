// ServiceEfficiency model for Supabase
export interface ServiceEfficiency {
  id: string;
  technician_id: string;
  client_id: string;
  tasks_completed: number;
  avg_response_time: number; // minutes
  avg_resolution_time: number; // minutes
  ai_suggestions: string[];
  week: string; // ISO week e.g., 2025-W41
  created_at: string;
}

export interface ServiceEfficiencyInsert {
  technician_id: string;
  client_id: string;
  tasks_completed: number;
  avg_response_time: number;
  avg_resolution_time: number;
  ai_suggestions?: string[];
  week: string;
  created_at?: string;
}

export interface ServiceEfficiencyUpdate {
  technician_id?: string;
  client_id?: string;
  tasks_completed?: number;
  avg_response_time?: number;
  avg_resolution_time?: number;
  ai_suggestions?: string[];
  week?: string;
}



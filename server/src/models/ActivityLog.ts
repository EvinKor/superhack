// ActivityLog model for Supabase
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address: string;
}

export interface ActivityLogInsert {
  user_id: string;
  action: string;
  details: string;
  timestamp?: string;
  ip_address: string;
}

export interface ActivityLogUpdate {
  user_id?: string;
  action?: string;
  details?: string;
  timestamp?: string;
  ip_address?: string;
}



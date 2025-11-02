// Client model for Supabase
export type ClientStatus = 'active' | 'inactive';

export interface Client {
  id: string;
  client_name: string;
  industry: string;
  contact_person: string;
  email: string;
  phone: string;
  status: ClientStatus;
  created_by: string; // creator email
  created_at: string;
}

export interface ClientInsert {
  client_name: string;
  industry: string;
  contact_person: string;
  email: string;
  phone: string;
  status?: ClientStatus;
  created_by: string;
  created_at?: string;
}

export interface ClientUpdate {
  client_name?: string;
  industry?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status?: ClientStatus;
}



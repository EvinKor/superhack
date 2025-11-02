// Client model for Supabase
export type ClientStatus = 'active' | 'inactive';
export type ClientTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PrimaryContact {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
}

export interface Client {
  id: string;
  client_name: string;
  industry: string;
  contact_person: string;
  email: string;
  phone: string;
  status: ClientStatus;
  created_by: string;
  created_at: string;
  tier?: ClientTier;
  contract_value?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  address?: Address;
  primary_contact?: PrimaryContact;
  notes?: string;
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
  tier?: ClientTier;
  contract_value?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  address?: Address;
  primary_contact?: PrimaryContact;
  notes?: string;
}

export interface ClientUpdate {
  client_name?: string;
  industry?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status?: ClientStatus;
  tier?: ClientTier;
  contract_value?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  address?: Address;
  primary_contact?: PrimaryContact;
  notes?: string;
}



// User model for Supabase
export type UserRole = 'Admin' | 'IT_Manager' | 'Technician';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  password_hash: string;
  created_at: string;
  last_login?: string;
}

export interface UserInsert {
  name: string;
  email: string;
  role: UserRole;
  company: string;
  password_hash: string;
  created_at?: string;
  last_login?: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: UserRole;
  company?: string;
  password_hash?: string;
  last_login?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  created_at: string;
  last_login?: string;
}

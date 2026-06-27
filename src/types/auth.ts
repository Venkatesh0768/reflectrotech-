/**
 * Types for the User Authentication & Role Management module.
 */

export type UserRole = "admin" | "manager" | "employee";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  employee_id: string | null;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role: UserRole;
  permission: string;
  created_at: string;
}

export interface UserAuditLog {
  id: number;
  actor_id: string | null;
  target_id: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

// ── Request body shapes ──────────────────────────────────────

export interface SignupBody {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface UpdateProfileBody {
  full_name?: string;
  employee_id?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateUserRoleBody {
  role: UserRole;
}

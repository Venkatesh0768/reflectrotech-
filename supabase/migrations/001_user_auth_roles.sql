-- ============================================================
-- Migration: 001_user_auth_roles.sql
-- Module: User Authentication & Role Management
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. ENUM for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'employee');

-- ============================================================
-- 2. Profiles table (extends auth.users 1:1)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  full_name     TEXT        NOT NULL,
  role          public.user_role NOT NULL DEFAULT 'employee',
  employee_id   TEXT        UNIQUE,          -- e.g. "EMP-001"
  department    TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles IS 'ERP user profiles linked 1:1 to Supabase auth.users';
COMMENT ON COLUMN public.profiles.role IS 'RBAC role assigned to this user';
COMMENT ON COLUMN public.profiles.employee_id IS 'Human-readable employee identifier, e.g. EMP-001';
COMMENT ON COLUMN public.profiles.is_active IS 'Soft-delete flag — inactive users cannot log in';

-- ============================================================
-- 3. Role permissions table
-- ============================================================
CREATE TABLE public.role_permissions (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role        public.user_role NOT NULL,
  permission  TEXT        NOT NULL,          -- e.g. "inventory:read", "orders:write"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role, permission)
);

COMMENT ON TABLE public.role_permissions IS 'Maps roles to fine-grained permission strings';

-- ============================================================
-- 4. Audit log for profile changes
-- ============================================================
CREATE TABLE public.user_audit_log (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,          -- e.g. "role_changed", "deactivated"
  old_value   JSONB,
  new_value   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_audit_log IS 'Immutable audit trail for all profile mutations';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role          ON public.profiles(role);
CREATE INDEX idx_profiles_is_active     ON public.profiles(is_active);
CREATE INDEX idx_profiles_email         ON public.profiles(email);
CREATE INDEX idx_role_permissions_role  ON public.role_permissions(role);
CREATE INDEX idx_audit_log_actor        ON public.user_audit_log(actor_id);
CREATE INDEX idx_audit_log_target       ON public.user_audit_log(target_id);
CREATE INDEX idx_audit_log_created_at   ON public.user_audit_log(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- Fires when Supabase Auth creates a new user in auth.users.
-- Pulls full_name and role from user_metadata passed at signup.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'employee'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_log   ENABLE ROW LEVEL SECURITY;

-- Helper: check if the calling user has a given role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- profiles: a user can read their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- profiles: a user can update their own non-sensitive fields
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-role-escalation: role can only be changed by admins
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- profiles: admins have full access
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.current_user_role() = 'admin');

-- role_permissions: all authenticated users can read
CREATE POLICY "role_permissions_select_authenticated"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- role_permissions: only admins can insert/update/delete
CREATE POLICY "role_permissions_admin_write"
  ON public.role_permissions FOR ALL
  USING (public.current_user_role() = 'admin');

-- audit log: admins and managers can read
CREATE POLICY "audit_log_admin_manager_select"
  ON public.user_audit_log FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));

-- audit log: only service role can insert (enforced by no INSERT policy for authenticated)

-- ============================================================
-- SEED: Default role permissions
-- ============================================================
INSERT INTO public.role_permissions (role, permission) VALUES
  -- Admin: full access
  ('admin', 'users:read'),
  ('admin', 'users:write'),
  ('admin', 'users:delete'),
  ('admin', 'inventory:read'),
  ('admin', 'inventory:write'),
  ('admin', 'inventory:delete'),
  ('admin', 'orders:read'),
  ('admin', 'orders:write'),
  ('admin', 'orders:delete'),
  ('admin', 'reports:read'),
  ('admin', 'settings:write'),

  -- Manager: read/write, no destructive actions on users
  ('manager', 'users:read'),
  ('manager', 'inventory:read'),
  ('manager', 'inventory:write'),
  ('manager', 'orders:read'),
  ('manager', 'orders:write'),
  ('manager', 'reports:read'),

  -- Employee: limited read + own orders
  ('employee', 'inventory:read'),
  ('employee', 'orders:read'),
  ('employee', 'orders:write');

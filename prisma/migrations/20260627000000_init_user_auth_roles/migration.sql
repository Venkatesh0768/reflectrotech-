-- ============================================================
-- Migration: init_user_auth_roles
-- Managed by Prisma — DO NOT edit manually after applying
-- ============================================================

-- 1. CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('admin', 'manager', 'employee');

-- 2. CreateTable: profiles
CREATE TABLE "public"."profiles" (
    "id"          UUID        NOT NULL,
    "email"       TEXT        NOT NULL,
    "full_name"   TEXT        NOT NULL,
    "role"        "public"."user_role" NOT NULL DEFAULT 'employee',
    "employee_id" TEXT,
    "department"  TEXT,
    "phone"       TEXT,
    "avatar_url"  TEXT,
    "is_active"   BOOLEAN     NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable: role_permissions
CREATE TABLE "public"."role_permissions" (
    "id"          BIGINT      GENERATED ALWAYS AS IDENTITY,
    "role"        "public"."user_role" NOT NULL,
    "permission"  TEXT        NOT NULL,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable: user_audit_log
CREATE TABLE "public"."user_audit_log" (
    "id"         BIGINT  GENERATED ALWAYS AS IDENTITY,
    "actor_id"   UUID,
    "target_id"  UUID,
    "action"     TEXT        NOT NULL,
    "old_value"  JSONB,
    "new_value"  JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_log_pkey" PRIMARY KEY ("id")
);

-- 5. CreateIndex
CREATE UNIQUE INDEX "profiles_employee_id_key"     ON "public"."profiles"("employee_id");
CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "public"."role_permissions"("role", "permission");
CREATE INDEX "idx_profiles_role"         ON "public"."profiles"("role");
CREATE INDEX "idx_profiles_is_active"    ON "public"."profiles"("is_active");
CREATE INDEX "idx_profiles_email"        ON "public"."profiles"("email");
CREATE INDEX "idx_role_permissions_role" ON "public"."role_permissions"("role");
CREATE INDEX "idx_audit_log_actor"       ON "public"."user_audit_log"("actor_id");
CREATE INDEX "idx_audit_log_target"      ON "public"."user_audit_log"("target_id");
CREATE INDEX "idx_audit_log_created_at"  ON "public"."user_audit_log"("created_at" DESC);

-- 6. AddForeignKey: profiles → auth.users
ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey"
    FOREIGN KEY ("id") REFERENCES auth.users("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. AddForeignKey: user_audit_log → profiles (actor)
ALTER TABLE "public"."user_audit_log"
    ADD CONSTRAINT "user_audit_log_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. AddForeignKey: user_audit_log → profiles (target)
ALTER TABLE "public"."user_audit_log"
    ADD CONSTRAINT "user_audit_log_target_id_fkey"
    FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Custom: updated_at auto-update trigger
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
-- Custom: auto-create profile on Supabase Auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'employee')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Custom: Row Level Security
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_log   ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "role_permissions_read"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_admin"
  ON public.role_permissions FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "audit_log_read"
  ON public.user_audit_log FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));

-- ============================================================
-- Custom: Seed default role permissions
-- ============================================================
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin','users:read'),
  ('admin','users:write'),
  ('admin','users:delete'),
  ('admin','inventory:read'),
  ('admin','inventory:write'),
  ('admin','inventory:delete'),
  ('admin','orders:read'),
  ('admin','orders:write'),
  ('admin','orders:delete'),
  ('admin','reports:read'),
  ('admin','settings:write'),
  ('manager','users:read'),
  ('manager','inventory:read'),
  ('manager','inventory:write'),
  ('manager','orders:read'),
  ('manager','orders:write'),
  ('manager','reports:read'),
  ('employee','inventory:read'),
  ('employee','orders:read'),
  ('employee','orders:write');

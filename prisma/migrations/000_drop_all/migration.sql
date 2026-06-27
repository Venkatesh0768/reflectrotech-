-- Drop existing tables and types from previous manual migration (if any)
-- This runs before Prisma creates its own schema

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.current_user_role();

DROP TABLE IF EXISTS public.user_audit_log     CASCADE;
DROP TABLE IF EXISTS public.role_permissions   CASCADE;
DROP TABLE IF EXISTS public.profiles           CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;

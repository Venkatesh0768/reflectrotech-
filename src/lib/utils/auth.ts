/**
 * Server-side auth helpers used by Route Handlers.
 * Auth session management: Supabase SSR (JWT / cookies)
 * Data queries: Prisma ORM
 */
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Profile, UserRole } from "@/types/auth";
import type { Profile as PrismaProfile } from "@prisma/client";

/**
 * Maps a Prisma Profile row to our API-facing Profile type.
 */
export function toProfile(p: PrismaProfile): Profile {
  return {
    id: p.id,
    email: p.email,
    full_name: p.fullName,
    role: p.role as UserRole,
    employee_id: p.employeeId,
    department: p.department,
    phone: p.phone,
    avatar_url: p.avatarUrl,
    is_active: p.isActive,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

/**
 * Returns the authenticated user's profile, or null if not authenticated.
 * Uses Supabase to verify the session, then Prisma to fetch profile data.
 */
export async function getAuthenticatedProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) return null;
  return toProfile(profile);
}

/**
 * Guards a Route Handler to require a minimum role.
 * Returns the profile if satisfied, or a Response to return early.
 */
export async function requireRole(
  minimumRole: UserRole
): Promise<Profile | Response> {
  const profile = await getAuthenticatedProfile();

  if (!profile) return unauthorized();
  if (!profile.is_active) return forbidden("Account is deactivated");

  const hierarchy: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    admin: 2,
  };

  if (hierarchy[profile.role] < hierarchy[minimumRole]) {
    return forbidden(`Requires ${minimumRole} role or higher`);
  }

  return profile;
}

/** Type guard — narrows the result of requireRole. */
export function isResponse(value: Profile | Response): value is Response {
  return value instanceof Response;
}

// ── Standard JSON error helpers ───────────────────────────────────────────────

export function unauthorized(message = "Unauthorized") {
  return Response.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return Response.json({ success: false, error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return Response.json({ success: false, error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return Response.json({ success: false, error: message }, { status: 404 });
}

export function internalError(message = "Internal server error") {
  return Response.json({ success: false, error: message }, { status: 500 });
}

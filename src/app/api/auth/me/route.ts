/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's full profile + permissions.
 * Session: Supabase Auth | Data: Prisma
 *
 * Authenticated — requires a valid session cookie.
 */
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, toProfile } from "@/lib/utils/auth";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return unauthorized();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) return unauthorized("Profile not found");

  if (!profile.isActive) {
    return Response.json(
      { success: false, error: "Account is deactivated" },
      { status: 403 }
    );
  }

  // Fetch permissions for this user's role from Prisma
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role: profile.role },
    select: { permission: true },
  });

  return Response.json({
    success: true,
    data: {
      ...toProfile(profile),
      permissions: rolePermissions.map((rp) => rp.permission),
    },
  });
}

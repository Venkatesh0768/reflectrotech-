/**
 * GET /api/users/[id]/permissions
 *
 * Returns all permissions for a user, derived from their role.
 * Auth: Supabase | Data: Prisma
 *
 * Accessible by: admin (any user) or the user themselves.
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedProfile,
  forbidden,
  notFound,
  unauthorized,
} from "@/lib/utils/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const caller = await getAuthenticatedProfile();
  if (!caller) return unauthorized();

  if (caller.role !== "admin" && caller.id !== id) return forbidden();

  const target = await prisma.profile.findUnique({
    where: { id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!target) return notFound("User not found");

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role: target.role },
    select: { permission: true },
    orderBy: { permission: "asc" },
  });

  return Response.json({
    success: true,
    data: {
      user_id:     target.id,
      full_name:   target.fullName,
      role:        target.role,
      permissions: rolePermissions.map((rp) => rp.permission),
    },
  });
}

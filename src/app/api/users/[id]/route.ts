/**
 * GET    /api/users/[id]  — Get a user profile (admin or self)
 * PATCH  /api/users/[id]  — Update profile; role change = admin only
 * DELETE /api/users/[id]  — Soft-deactivate (admin only)
 *
 * Auth: Supabase | Data: Prisma
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  getAuthenticatedProfile,
  isResponse,
  toProfile,
  badRequest,
  forbidden,
  notFound,
  internalError,
  unauthorized,
} from "@/lib/utils/auth";
import type { UpdateProfileBody, UpdateUserRoleBody, UserRole } from "@/types/auth";

const VALID_ROLES: UserRole[] = ["admin", "manager", "employee"];

// ── GET /api/users/[id] ───────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const caller = await getAuthenticatedProfile();
  if (!caller) return unauthorized();

  // Admins can view anyone; others can only view themselves
  if (caller.role !== "admin" && caller.id !== id) return forbidden();

  const row = await prisma.profile.findUnique({ where: { id } });
  if (!row) return notFound("User not found");

  return Response.json({ success: true, data: toProfile(row) });
}

// ── PATCH /api/users/[id] ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const caller = await getAuthenticatedProfile();
  if (!caller) return unauthorized();

  const isAdmin = caller.role === "admin";
  const isSelf  = caller.id  === id;

  if (!isAdmin && !isSelf) return forbidden();

  let body: UpdateProfileBody & Partial<UpdateUserRoleBody>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  // Role changes are admin-only
  if (body.role !== undefined && !isAdmin) {
    return forbidden("Only admins can change roles");
  }
  if (body.role && !VALID_ROLES.includes(body.role)) {
    return badRequest(`role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  // Build a type-safe Prisma update payload
  const data: Record<string, unknown> = {};
  if (body.full_name    !== undefined) data.fullName   = body.full_name;
  if (body.employee_id  !== undefined) data.employeeId = body.employee_id;
  if (body.department   !== undefined) data.department = body.department;
  if (body.phone        !== undefined) data.phone      = body.phone;
  if (body.avatar_url   !== undefined) data.avatarUrl  = body.avatar_url;
  if (isAdmin && body.role)            data.role       = body.role;

  if (Object.keys(data).length === 0) {
    return badRequest("No valid fields to update");
  }

  const before = await prisma.profile.findUnique({ where: { id } });
  if (!before) return notFound("User not found");

  let updated;
  try {
    updated = await prisma.profile.update({ where: { id }, data });
  } catch {
    return internalError("Failed to update profile");
  }

  // Write audit log (non-fatal)
  prisma.userAuditLog
    .create({
      data: {
        actorId:  caller.id,
        targetId: id,
        action:
          body.role && body.role !== before.role
            ? "role_changed"
            : "profile_updated",
        oldValue: before  as object,
        newValue: updated as object,
      },
    })
    .catch(() => console.error("[audit] Failed to write audit log"));

  return Response.json({ success: true, data: toProfile(updated) });
}

// ── DELETE /api/users/[id] ────────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireRole("admin");
  if (isResponse(auth)) return auth;

  if (auth.id === id) {
    return badRequest("Admins cannot deactivate their own account");
  }

  const target = await prisma.profile.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!target) return notFound("User not found");

  if (!target.isActive) {
    return Response.json(
      { success: false, error: "User is already deactivated" },
      { status: 409 }
    );
  }

  try {
    await prisma.profile.update({
      where: { id },
      data: { isActive: false },
    });
  } catch {
    return internalError("Failed to deactivate user");
  }

  // Audit log (non-fatal)
  prisma.userAuditLog
    .create({
      data: {
        actorId:  auth.id,
        targetId: id,
        action:   "deactivated",
        oldValue: { is_active: true },
        newValue: { is_active: false },
      },
    })
    .catch(() => console.error("[audit] Failed to write audit log"));

  return Response.json({
    success: true,
    data: { message: "User deactivated successfully" },
  });
}

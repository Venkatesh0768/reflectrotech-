/**
 * GET /api/users
 *
 * Returns a paginated list of all user profiles.
 * Data: Prisma | Auth: Supabase
 *
 * Query params:
 *   page    — page number, default 1
 *   limit   — per page, default 20, max 100
 *   role    — filter: admin | manager | employee
 *   active  — filter: true | false
 *   search  — fuzzy match on full_name or email
 *
 * Requires: admin role
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, toProfile } from "@/lib/utils/auth";
import type { UserRole } from "@/types/auth";
import type { Prisma } from "@prisma/client";

const VALID_ROLES: UserRole[] = ["admin", "manager", "employee"];

export async function GET(request: NextRequest) {
  const auth = await requireRole("admin");
  if (isResponse(auth)) return auth;

  const { searchParams } = request.nextUrl;

  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)), 100);
  const role   = searchParams.get("role")   as UserRole | null;
  const active = searchParams.get("active");
  const search = searchParams.get("search");

  if (role && !VALID_ROLES.includes(role)) {
    return badRequest(`role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  // Build Prisma where clause
  const where: Prisma.ProfileWhereInput = {};

  if (role)            where.role     = role;
  if (active !== null) where.isActive = active === "true";
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email:    { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.profile.count({ where }),
  ]);

  return Response.json({
    success: true,
    data: {
      users: users.map(toProfile),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    },
  });
}

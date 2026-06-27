/** GET /api/employees  POST /api/employees */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  profileId:        z.string().uuid(),
  designation:      z.string().min(1),
  department:       z.string().min(1),
  joinDate:         z.string(),
  baseSalary:       z.number().nonnegative(),
  bankAccount:      z.string().optional(),
  nationalId:       z.string().optional(),
  emergencyContact: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const where  = search
    ? { profile: { fullName: { contains: search, mode: "insensitive" as const } } }
    : {};
  const employees = await prisma.employee.findMany({
    where,
    include: { profile: { select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true } } },
    orderBy: { profile: { fullName: "asc" } },
  });
  return Response.json({ success: true, data: employees });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("admin");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  try {
    const emp = await prisma.employee.create({
      data: { ...parsed.data, joinDate: new Date(parsed.data.joinDate) },
      include: { profile: { select: { id: true, fullName: true, email: true } } },
    });
    return Response.json({ success: true, data: emp }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return badRequest("Employee profile already linked");
    return internalError();
  }
}

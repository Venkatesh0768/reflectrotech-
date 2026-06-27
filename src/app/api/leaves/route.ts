/** GET /api/leaves  POST /api/leaves  PATCH /api/leaves/[id] */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  employeeId: z.number().int().positive(),
  leaveType:  z.enum(["annual","sick","unpaid","casual"]),
  startDate:  z.string(),
  endDate:    z.string(),
  reason:     z.string().optional(),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const status = request.nextUrl.searchParams.get("status");
  const where  = status ? { status: status as any } : {};
  const leaves = await prisma.leave.findMany({
    where,
    include: { employee: { include: { profile: { select: { fullName: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ success: true, data: leaves });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  const start = new Date(parsed.data.startDate);
  const end   = new Date(parsed.data.endDate);
  const days  = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  try {
    const leave = await prisma.leave.create({ data: { ...parsed.data, startDate: start, endDate: end, days } });
    return Response.json({ success: true, data: leave }, { status: 201 });
  } catch { return internalError(); }
}

/** GET /api/service-jobs  POST /api/service-jobs */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  customerId:    z.number().int().positive(),
  deviceName:    z.string().min(1),
  deviceModel:   z.string().optional(),
  serialNumber:  z.string().optional(),
  problemDesc:   z.string().min(1),
  estimatedCost: z.number().nonnegative().optional(),
  warrantyPeriod:z.number().int().nonnegative().optional(),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const where  = status ? { status: status as any } : {};
  const [jobs, total] = await Promise.all([
    prisma.serviceJob.findMany({
      where,
      include: { customer: { select: { id: true, name: true } }, assignedTo: { select: { id: true, fullName: true } } },
      skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
    }),
    prisma.serviceJob.count({ where }),
  ]);
  return Response.json({ success: true, data: jobs, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  try {
    const count     = await prisma.serviceJob.count();
    const jobNumber = `SJ-${String(count + 1).padStart(5, "0")}`;
    const job = await prisma.serviceJob.create({
      data: { ...parsed.data, jobNumber, assignedToId: profile.id },
      include: { customer: { select: { id: true, name: true } } },
    });
    return Response.json({ success: true, data: job }, { status: 201 });
  } catch { return internalError(); }
}

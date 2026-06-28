import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const CreateSchema = z.object({
  bomId:          z.number().int().positive(),
  targetQuantity: z.number().positive(),
  startDate:      z.string(),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const { searchParams } = request.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const status = searchParams.get("status");

  const where = status ? { status: status as any } : {};

  const [orders, total] = await Promise.all([
    prisma.productionOrder.findMany({
      where,
      include: {
        bom: { include: { product: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, fullName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.productionOrder.count({ where }),
  ]);

  return Response.json({ success: true, data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { startDate, ...rest } = parsed.data;

  try {
    const count = await prisma.productionOrder.count();
    const orderNumber = `PROD-${String(count + 1).padStart(5, "0")}`;

    const order = await prisma.productionOrder.create({
      data: {
        ...rest,
        orderNumber,
        startDate: new Date(startDate),
        createdById: profile.id,
      },
      include: { bom: true },
    });
    return Response.json({ success: true, data: order }, { status: 201 });
  } catch (err: any) {
    return internalError();
  }
}

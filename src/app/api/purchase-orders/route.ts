/** GET /api/purchase-orders  POST /api/purchase-orders */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const LineSchema = z.object({ productId: z.number().int().positive(), quantity: z.number().positive(), unitCost: z.number().nonnegative() });
const CreateSchema = z.object({
  supplierId:   z.number().int().positive(),
  orderDate:    z.string(),
  expectedDate: z.string().optional(),
  taxAmount:    z.number().nonnegative().default(0),
  notes:        z.string().optional(),
  lines:        z.array(LineSchema).min(1),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const { searchParams } = request.nextUrl;
  const status     = searchParams.get("status");
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const where      = status ? { status: status as any } : {};
  const [pos, total] = await Promise.all([
    prisma.purchaseOrder.findMany({ where, include: { supplier: { select: { id: true, name: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.purchaseOrder.count({ where }),
  ]);
  return Response.json({ success: true, data: pos, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  const { lines, taxAmount, orderDate, expectedDate, ...rest } = parsed.data;
  const subtotal    = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const totalAmount = subtotal + taxAmount;
  try {
    const count    = await prisma.purchaseOrder.count();
    const poNumber = `PO-${String(count + 1).padStart(5, "0")}`;
    const po = await prisma.purchaseOrder.create({
      data: {
        ...rest, poNumber,
        orderDate: new Date(orderDate),
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        subtotal, taxAmount, totalAmount,
        createdById: profile.id,
        lines: { create: lines.map((l) => ({ ...l, receivedQty: 0, totalCost: l.quantity * l.unitCost })) },
      },
      include: { lines: true, supplier: { select: { id: true, name: true } } },
    });
    return Response.json({ success: true, data: po }, { status: 201 });
  } catch { return internalError(); }
}

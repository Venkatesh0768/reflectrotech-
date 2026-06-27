/**
 * GET  /api/sales-orders   — paginated + status/customer filters
 * POST /api/sales-orders   — create order with line items
 */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const LineSchema = z.object({
  productId:  z.number().int().positive(),
  quantity:   z.number().positive(),
  unitPrice:  z.number().nonnegative(),
  discount:   z.number().min(0).max(100).default(0),
});

const CreateSchema = z.object({
  customerId:     z.number().int().positive(),
  orderDate:      z.string(),
  dueDate:        z.string().optional(),
  taxAmount:      z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  notes:          z.string().optional(),
  lines:          z.array(LineSchema).min(1),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const { searchParams } = request.nextUrl;
  const status     = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const search     = searchParams.get("search") ?? "";
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const where = {
    ...(status     && { status: status as any }),
    ...(customerId && { customerId: parseInt(customerId) }),
    ...(search     && { OR: [
      { orderNumber: { contains: search, mode: "insensitive" as const } },
      { customer: { name: { contains: search, mode: "insensitive" as const } } },
    ]}),
  };

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return Response.json({ success: true, data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { lines, taxAmount, discountAmount, orderDate, dueDate, ...rest } = parsed.data;

  // Compute subtotal from lines
  const subtotal = lines.reduce((sum, l) => {
    const lineTotal = l.quantity * l.unitPrice * (1 - l.discount / 100);
    return sum + lineTotal;
  }, 0);
  const totalAmount = subtotal - discountAmount + taxAmount;

  try {
    // Generate order number
    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-${String(count + 1).padStart(5, "0")}`;

    const order = await prisma.salesOrder.create({
      data: {
        ...rest,
        orderNumber,
        orderDate: new Date(orderDate),
        dueDate:   dueDate ? new Date(dueDate) : undefined,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        createdById: profile.id,
        lines: {
          create: lines.map((l) => ({
            productId:  l.productId,
            quantity:   l.quantity,
            unitPrice:  l.unitPrice,
            discount:   l.discount,
            totalPrice: l.quantity * l.unitPrice * (1 - l.discount / 100),
          })),
        },
      },
      include: { lines: true, customer: { select: { id: true, name: true } } },
    });
    return Response.json({ success: true, data: order }, { status: 201 });
  } catch {
    return internalError();
  }
}

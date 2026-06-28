/** GET /api/payments  POST /api/payments */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  referenceType:   z.enum(["sales_order","purchase_order"]),
  salesOrderId:    z.number().int().positive().optional(),
  purchaseOrderId: z.number().int().positive().optional(),
  amount:          z.number().positive(),
  method:          z.enum(["cash","bank_transfer","cheque","credit_card","online"]),
  paidAt:          z.string(),
  notes:           z.string().optional(),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const type  = request.nextUrl.searchParams.get("type");
  const refId = request.nextUrl.searchParams.get("refId");
  const where = {
    ...(type === "sales_order"    && { referenceType: "sales_order" }),
    ...(type === "purchase_order" && { referenceType: "purchase_order" }),
    ...(refId && type === "sales_order"    && { salesOrderId:    parseInt(refId) }),
    ...(refId && type === "purchase_order" && { purchaseOrderId: parseInt(refId) }),
  };
  const page   = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(request.nextUrl.searchParams.get("limit") ?? "20"));
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);
  return Response.json({ success: true, data: payments, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  try {
    const payment = await prisma.payment.create({ data: { ...parsed.data, paidAt: new Date(parsed.data.paidAt) } });
    return Response.json({ success: true, data: payment }, { status: 201 });
  } catch { return internalError(); }
}

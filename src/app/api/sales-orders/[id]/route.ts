/**
 * GET   /api/sales-orders/[id]
 * PATCH /api/sales-orders/[id]  — update status / payment status
 */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, notFound, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  status:        z.enum(["draft","confirmed","processing","shipped","delivered","cancelled","returned"]).optional(),
  paymentStatus: z.enum(["pending","partial","paid","overdue","refunded"]).optional(),
  notes:         z.string().optional(),
  dueDate:       z.string().optional(),
});

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      lines: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
      payments: true,
      createdBy: { select: { id: true, fullName: true } },
    },
  });
  if (!order) return notFound();
  return Response.json({ success: true, data: order });
}

export async function PATCH(request: NextRequest, { params }: P) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  try {
    const order = await prisma.salesOrder.update({
      where: { id: parseInt(id) },
      data: { ...parsed.data, ...(parsed.data.dueDate && { dueDate: new Date(parsed.data.dueDate) }) },
    });
    return Response.json({ success: true, data: order });
  } catch (e: any) {
    if (e.code === "P2025") return notFound();
    return internalError();
  }
}

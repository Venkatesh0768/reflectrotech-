import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  sku:          z.string().min(1).optional(),
  name:         z.string().min(1).optional(),
  description:  z.string().optional(),
  categoryId:   z.number().int().positive().optional(),
  unitId:       z.number().int().positive().optional(),
  costPrice:    z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  isSerialized: z.boolean().optional(),
  isActive:     z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return badRequest("Invalid product ID");

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true, unit: true },
    });
    return Response.json({ success: true, data: product });
  } catch (e: any) {
    if (e.code === "P2025") return badRequest("Product not found");
    if (e.code === "P2002") return badRequest("SKU already exists");
    return internalError();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("admin");
  if (isResponse(profile)) return profile;

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return badRequest("Invalid product ID");

  try {
    await prisma.product.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") return badRequest("Product not found");
    // If it fails due to foreign key constraints (e.g. used in orders)
    if (e.code === "P2003") return badRequest("Cannot delete product because it is referenced in orders or inventory movements.");
    return internalError();
  }
}

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError, notFound } from "@/lib/utils/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["draft", "in_progress", "completed", "cancelled"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) return badRequest("Invalid ID");

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { status } = parsed.data;

  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: { bom: { include: { lines: true } } },
    });

    if (!order) return notFound();
    if (order.status === "completed" || order.status === "cancelled") {
      return badRequest("Cannot change status of a completed or cancelled order");
    }

    // Handle stock movements if completing the order
    if (status === "completed") {
      const defaultWarehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
      if (!defaultWarehouse) return badRequest("No active warehouse found for stock movements");

      // Transaction: deduct raw materials and add finished product
      await prisma.$transaction(async (tx) => {
        // 1. Deduct raw materials based on BOM
        for (const line of order.bom.lines) {
          const qtyNeeded = Number(line.quantity) * Number(order.targetQuantity);
          
          await tx.stockMovement.create({
            data: {
              productId: line.rawMaterialId,
              type: "adjustment",
              quantity: -qtyNeeded,
              referenceType: "production_order",
              referenceId: order.id,
              movedById: profile.id,
              fromWarehouseId: defaultWarehouse.id,
              notes: `Used in Production Order ${order.orderNumber}`,
            },
          });

          // Upsert stock item
          const stock = await tx.stockItem.findUnique({
            where: { productId_warehouseId: { productId: line.rawMaterialId, warehouseId: defaultWarehouse.id } }
          });
          if (stock) {
            await tx.stockItem.update({
              where: { id: stock.id },
              data: { quantity: Number(stock.quantity) - qtyNeeded },
            });
          }
        }

        // 2. Add finished product
        await tx.stockMovement.create({
          data: {
            productId: order.bom.productId,
            type: "purchase", // Or production equivalent
            quantity: Number(order.targetQuantity),
            referenceType: "production_order",
            referenceId: order.id,
            movedById: profile.id,
            toWarehouseId: defaultWarehouse.id,
            notes: `Produced in Production Order ${order.orderNumber}`,
          },
        });

        const finishedStock = await tx.stockItem.findUnique({
          where: { productId_warehouseId: { productId: order.bom.productId, warehouseId: defaultWarehouse.id } }
        });

        if (finishedStock) {
          await tx.stockItem.update({
            where: { id: finishedStock.id },
            data: { quantity: Number(finishedStock.quantity) + Number(order.targetQuantity) },
          });
        } else {
          await tx.stockItem.create({
            data: {
              productId: order.bom.productId,
              warehouseId: defaultWarehouse.id,
              quantity: Number(order.targetQuantity),
            }
          });
        }

        // 3. Update order status
        await tx.productionOrder.update({
          where: { id },
          data: { status, endDate: new Date() },
        });
      });

      return Response.json({ success: true, message: "Production order completed and stock updated" });
    }

    // Normal status update
    const updated = await prisma.productionOrder.update({
      where: { id },
      data: { status },
    });
    return Response.json({ success: true, data: updated });
  } catch (err: any) {
    console.error(err);
    return internalError();
  }
}

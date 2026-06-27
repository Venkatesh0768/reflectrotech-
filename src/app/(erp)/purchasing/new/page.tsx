import { prisma } from "@/lib/prisma";
import { PurchaseOrderFormClient } from "../PurchaseOrderFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Purchase Order | Purchasing",
};

export default async function NewPurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, costPrice: true }
    })
  ]);

  return (
    <PurchaseOrderFormClient 
      suppliers={suppliers} 
      products={products.map(p => ({ ...p, costPrice: Number(p.costPrice) }))} 
    />
  );
}

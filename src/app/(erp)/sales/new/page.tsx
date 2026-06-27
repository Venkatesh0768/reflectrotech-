import { prisma } from "@/lib/prisma";
import { SalesOrderFormClient } from "../SalesOrderFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Sales Order | Sales",
};

export default async function NewSalesOrderPage() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, sellingPrice: true }
    })
  ]);

  return (
    <SalesOrderFormClient 
      customers={customers} 
      products={products.map(p => ({ ...p, sellingPrice: Number(p.sellingPrice) }))} 
    />
  );
}

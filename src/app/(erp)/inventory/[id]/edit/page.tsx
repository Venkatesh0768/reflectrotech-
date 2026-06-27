import { prisma } from "@/lib/prisma";
import { ProductFormClient } from "../../ProductFormClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Product | Inventory",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const [product, categories, units] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.unit.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } })
  ]);

  if (!product) notFound();

  return (
    <ProductFormClient 
      initialData={{
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description ?? undefined,
        categoryId: product.categoryId ?? undefined,
        unitId: product.unitId ?? undefined,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        reorderLevel: product.reorderLevel,
        isSerialized: product.isSerialized
      }} 
      categories={categories} 
      units={units} 
    />
  );
}

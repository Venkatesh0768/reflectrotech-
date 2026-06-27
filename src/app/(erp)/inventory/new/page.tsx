import { prisma } from "@/lib/prisma";
import { ProductFormClient } from "../ProductFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Product | Inventory",
};

export default async function NewProductPage() {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.unit.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } })
  ]);

  return <ProductFormClient categories={categories} units={units} />;
}

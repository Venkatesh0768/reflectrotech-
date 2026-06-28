import type { Metadata } from "next";
import { ProductionClient } from "./ProductionClient";

export const metadata: Metadata = { title: "Production & Manufacturing" };

export default function ProductionPage() {
  return <ProductionClient />;
}

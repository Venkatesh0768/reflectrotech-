import type { Metadata } from "next";
import { SuppliersClient } from "./SuppliersClient";
export const metadata: Metadata = { title: "Suppliers" };
export default function SuppliersPage() { return <SuppliersClient />; }

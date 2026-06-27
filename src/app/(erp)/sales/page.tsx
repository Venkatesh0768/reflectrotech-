import type { Metadata } from "next";
import { SalesClient } from "./SalesClient";

export const metadata: Metadata = { title: "Sales Orders" };
export default function SalesPage() { return <SalesClient />; }

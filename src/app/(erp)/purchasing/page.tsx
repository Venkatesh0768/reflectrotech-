import type { Metadata } from "next";
import { PurchasingClient } from "./PurchasingClient";
export const metadata: Metadata = { title: "Purchasing" };
export default function PurchasingPage() { return <PurchasingClient />; }

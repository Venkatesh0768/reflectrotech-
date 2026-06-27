import type { Metadata } from "next";
import { HRMClient } from "./HRMClient";
export const metadata: Metadata = { title: "HRM & Payroll" };
export default function HRMPage() { return <HRMClient />; }

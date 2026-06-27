import type { Metadata } from "next";
import { ServiceClient } from "./ServiceClient";
export const metadata: Metadata = { title: "Service Jobs" };
export default function ServicePage() { return <ServiceClient />; }

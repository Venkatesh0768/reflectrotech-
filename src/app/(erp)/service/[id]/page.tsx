import { ServiceDetailClient } from "./ServiceDetailClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Service Job Details" };

export default async function ServiceJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ServiceDetailClient id={resolvedParams.id} />;
}

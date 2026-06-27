import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <div style={{ width: 200, height: 28, background: "var(--surface-2)", borderRadius: 6 }} />
          <div style={{ width: 140, height: 16, background: "var(--surface-2)", borderRadius: 4, marginTop: 6 }} />
        </div>
      </div>
      <div className="grid-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card" style={{ height: 120, background: "var(--surface-2)" }} />
        ))}
      </div>
    </div>
  );
}

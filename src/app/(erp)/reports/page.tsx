import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-subtitle">Business intelligence and analytics</p></div>
      </div>
      <div className="grid-3">
        {[
          { title: "Sales Report",    desc: "Revenue, orders, and customer analytics",   href: "/reports/sales",    color: "var(--primary)", bgColor: "var(--primary-muted)" },
          { title: "Purchase Report", desc: "PO history, supplier spend analysis",        href: "/reports/purchase", color: "var(--success)", bgColor: "var(--success-muted)" },
          { title: "Stock Report",    desc: "Inventory levels, movements, alerts",        href: "/reports/stock",    color: "var(--warning)", bgColor: "var(--accent-muted)" },
          { title: "HR Report",       desc: "Attendance, leave, payroll summary",         href: "/reports/hr",       color: "var(--accent)", bgColor: "var(--surface-3)" },
          { title: "Finance Report",  desc: "P&L, cash flow, expense breakdown",          href: "/reports/finance",  color: "var(--danger)", bgColor: "var(--danger-muted)" },
          { title: "Service Report",  desc: "Job completion rates, revenue from service", href: "/reports/service",  color: "var(--text-primary)", bgColor: "var(--surface-3)" },
        ].map((r) => (
          <a key={r.href} href={r.href} className="kpi-card" style={{ textDecoration: "none", cursor: "pointer" }}>
            <div className="kpi-icon" style={{ background: r.bgColor }}>
              <BarChart3 size={20} color={r.color} />
            </div>
            <h3 style={{ marginTop: "0.5rem" }}>{r.title}</h3>
            <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>{r.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

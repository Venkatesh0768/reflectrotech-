"use client";

import { useEffect, useState } from "react";
import { Plus, Wrench, Eye } from "lucide-react";
import Link from "next/link";

interface ServiceJob {
  id: number; jobNumber: string; status: string; deviceName: string; deviceModel?: string;
  estimatedCost?: string; finalCost?: string; receivedAt: string;
  customer: { id: number; name: string };
  assignedTo?: { id: string; fullName: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  received: "badge-slate", diagnosing: "badge-blue", waiting_parts: "badge-amber",
  in_repair: "badge-blue", ready: "badge-green", delivered: "badge-green", cancelled: "badge-red",
};

export function ServiceClient() {
  const [jobs, setJobs]       = useState<ServiceJob[]>([]);
  const [total, setTotal]     = useState(0);
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchJobs(s = status) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30", ...(s && { status: s }) });
      const res  = await fetch(`/api/service-jobs?${params}`);
      const json = await res.json();
      if (json.success) { setJobs(json.data); setTotal(json.meta.total); }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchJobs(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">Service Jobs</h1><p className="page-subtitle">{total} job{total !== 1 ? "s" : ""}</p></div>
        <Link href="/service/new" className="btn btn-primary btn-sm"><Plus size={15} /> New Job</Link>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <select className="form-select" style={{ width: "auto" }} value={status} onChange={(e) => { setStatus(e.target.value); fetchJobs(e.target.value); }}>
          <option value="">All Statuses</option>
          {["received","diagnosing","waiting_parts","in_repair","ready","delivered","cancelled"].map((s) => (
            <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Job #</th><th>Customer</th><th>Device</th><th>Assigned To</th><th>Status</th><th>Estimated</th><th>Received</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>)}</tr>)
            : jobs.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><Wrench size={40} className="empty-state-icon" /><h4>No service jobs</h4><Link href="/service/new" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}><Plus size={14} /> New Job</Link></div></td></tr>
            ) : jobs.map((j) => (
              <tr key={j.id}>
                <td style={{ fontWeight: 600, color: "var(--primary)" }}>{j.jobNumber}</td>
                <td>{j.customer.name}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{j.deviceName}</div>
                  {j.deviceModel && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{j.deviceModel}</div>}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{j.assignedTo?.fullName ?? "—"}</td>
                <td><span className={`badge ${STATUS_COLORS[j.status] ?? "badge-slate"}`} style={{ textTransform: "capitalize" }}>{j.status.replace("_", " ")}</span></td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>{j.estimatedCost ? `₹${Number(j.estimatedCost).toLocaleString("en-IN")}` : "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>{new Date(j.receivedAt).toLocaleDateString("en-IN")}</td>
                <td><Link href={`/service/${j.id}`} className="table-action-btn"><Eye size={14} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

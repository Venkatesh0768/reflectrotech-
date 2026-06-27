"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Truck, Eye } from "lucide-react";
import Link from "next/link";

interface PO { id: number; poNumber: string; status: string; orderDate: string; expectedDate?: string; totalAmount: string; supplier: { name: string }; }
interface Meta { total: number; page: number; pages: number; }

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-slate", sent: "badge-blue", partial: "badge-amber", received: "badge-green", cancelled: "badge-red",
};

export function PurchasingClient() {
  const [pos, setPOs]         = useState<PO[]>([]);
  const [meta, setMeta]       = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async (s = status, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(s && { status: s }) });
      const res  = await fetch(`/api/purchase-orders?${params}`);
      const json = await res.json();
      if (json.success) { setPOs(json.data); setMeta(json.meta); }
    } catch {}
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetch_(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">Purchase Orders</h1><p className="page-subtitle">{meta.total} orders</p></div>
        <Link href="/purchasing/new" className="btn btn-primary btn-sm"><Plus size={15} /> New PO</Link>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <select className="form-select" style={{ width: "auto" }} value={status} onChange={(e) => { setStatus(e.target.value); fetch_(e.target.value); }}>
          <option value="">All Statuses</option>
          {["draft","sent","partial","received","cancelled"].map((s) => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>PO #</th><th>Supplier</th><th>Order Date</th><th>Expected</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>)}</tr>)
            : pos.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><Truck size={40} className="empty-state-icon" /><h4>No purchase orders</h4><Link href="/purchasing/new" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}><Plus size={14} /> New PO</Link></div></td></tr>
            ) : pos.map((po) => (
              <tr key={po.id}>
                <td style={{ fontWeight: 600, color: "var(--primary)" }}>{po.poNumber}</td>
                <td>{po.supplier.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{new Date(po.orderDate).toLocaleDateString("en-IN")}</td>
                <td style={{ color: "var(--text-muted)" }}>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("en-IN") : "—"}</td>
                <td><span className={`badge ${STATUS_COLORS[po.status] ?? "badge-slate"}`} style={{ textTransform: "capitalize" }}>{po.status}</span></td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>₹{Number(po.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td><Link href={`/purchasing/${po.id}`} className="table-action-btn"><Eye size={14} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => fetch_(status, meta.page - 1)}>← Prev</button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Page {meta.page} of {meta.pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={meta.page >= meta.pages} onClick={() => fetch_(status, meta.page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

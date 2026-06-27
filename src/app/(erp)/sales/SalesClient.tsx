"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ShoppingCart, Eye, RefreshCw } from "lucide-react";
import Link from "next/link";

interface SalesOrder {
  id: number; orderNumber: string; status: string; paymentStatus: string;
  orderDate: string; totalAmount: string; paidAmount: string;
  customer: { id: number; name: string };
}
interface Meta { total: number; page: number; pages: number; }

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-slate", confirmed: "badge-blue", processing: "badge-amber",
  shipped: "badge-blue", delivered: "badge-green", cancelled: "badge-red", returned: "badge-red",
};
const PAY_COLORS: Record<string, string> = {
  pending: "badge-slate", partial: "badge-amber", paid: "badge-green",
  overdue: "badge-red", refunded: "badge-slate",
};

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function SalesClient() {
  const [orders, setOrders]   = useState<SalesOrder[]>([]);
  const [meta, setMeta]       = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchOrders = useCallback(async (q = search, s = status, page = 1) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ search: q, page: String(page), limit: "20", ...(s && { status: s }) });
      const res  = await fetch(`/api/sales-orders?${params}`);
      const json = await res.json();
      if (json.success) { setOrders(json.data); setMeta(json.meta); }
      else setError(json.error);
    } catch { setError("Failed to load orders"); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">{meta.total} order{meta.total !== 1 ? "s" : ""} total</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchOrders()}><RefreshCw size={15} /></button>
          <Link href="/sales/new" className="btn btn-primary btn-sm"><Plus size={15} /> New Order</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ maxWidth: 320 }}>
          <Search size={15} style={{ color: "var(--text-muted)" }} />
          <input placeholder="Order # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchOrders(search, status)} />
        </div>
        <select className="form-select" style={{ width: "auto" }} value={status} onChange={(e) => { setStatus(e.target.value); fetchOrders(search, e.target.value); }}>
          <option value="">All Statuses</option>
          {["draft","confirmed","processing","shipped","delivered","cancelled","returned"].map((s) => (
            <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Date</th><th>Status</th><th>Payment</th><th>Total</th><th>Paid</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <ShoppingCart size={40} className="empty-state-icon" />
                  <h4>No orders found</h4>
                  <p>Create your first sales order</p>
                  <Link href="/sales/new" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}><Plus size={14} /> New Order</Link>
                </div>
              </td></tr>
            ) : orders.map((o) => (
              <tr key={o.id}>
                <td><span style={{ fontWeight: 600, color: "var(--primary)" }}>{o.orderNumber}</span></td>
                <td>{o.customer.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{new Date(o.orderDate).toLocaleDateString("en-IN")}</td>
                <td><span className={`badge ${STATUS_COLORS[o.status] ?? "badge-slate"}`} style={{ textTransform: "capitalize" }}>{o.status}</span></td>
                <td><span className={`badge ${PAY_COLORS[o.paymentStatus] ?? "badge-slate"}`} style={{ textTransform: "capitalize" }}>{o.paymentStatus}</span></td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--success)" }}>{fmt(o.paidAmount)}</td>
                <td><Link href={`/sales/${o.id}`} className="table-action-btn" title="View"><Eye size={14} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => fetchOrders(search, status, meta.page - 1)}>← Prev</button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Page {meta.page} of {meta.pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={meta.page >= meta.pages} onClick={() => fetchOrders(search, status, meta.page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users, Eye, Edit2 } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: number; name: string; contactPerson?: string; email?: string;
  phone?: string; address?: string; creditLimit: string; isActive: boolean;
}
interface Meta { total: number; page: number; pages: number; }

export function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta]           = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name: "", contactPerson: "", email: "", phone: "", address: "", creditLimit: "0" });
  const [formError, setFormError] = useState("");

  const fetchCustomers = useCallback(async (q = search, page = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/customers?search=${q}&page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) { setCustomers(json.data); setMeta(json.meta); }
    } catch {}
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError("");
    try {
      const res  = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, creditLimit: parseFloat(form.creditLimit) || 0 }),
      });
      const json = await res.json();
      if (json.success) { setShowAdd(false); setForm({ name: "", contactPerson: "", email: "", phone: "", address: "", creditLimit: "0" }); fetchCustomers(); }
      else setFormError(json.error);
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{meta.total} customer{meta.total !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Customer</button>
      </div>

      <div className="search-bar" style={{ maxWidth: 360 }}>
        <Search size={15} style={{ color: "var(--text-muted)" }} />
        <input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchCustomers(search)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Credit Limit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>)}</tr>)
            : customers.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><Users size={40} className="empty-state-icon" /><h4>No customers</h4></div></td></tr>
            ) : customers.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.contactPerson ?? "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.email ?? "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.phone ?? "—"}</td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>₹{Number(c.creditLimit).toLocaleString("en-IN")}</td>
                <td><span className={`badge ${c.isActive ? "badge-green" : "badge-red"}`}>{c.isActive ? "Active" : "Inactive"}</span></td>
                <td><div style={{ display: "flex", gap: "0.25rem" }}>
                  <Link href={`/customers/${c.id}`} className="table-action-btn"><Eye size={14} /></Link>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => fetchCustomers(search, meta.page - 1)}>← Prev</button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Page {meta.page} of {meta.pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={meta.page >= meta.pages} onClick={() => fetchCustomers(search, meta.page + 1)}>Next →</button>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Customer</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {formError && <div className="alert alert-danger">{formError}</div>}
                <div className="grid-2">
                  <div className="form-group"><label className="form-label required">Name</label><input className="form-input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label">Address</label><textarea className="form-textarea" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Credit Limit (₹)</label><input className="form-input" type="number" min="0" step="0.01" value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Add Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


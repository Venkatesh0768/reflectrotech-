"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users2, Eye } from "lucide-react";
import Link from "next/link";

interface Supplier { id: number; name: string; contactPerson?: string; email?: string; phone?: string; taxNumber?: string; isActive: boolean; }
interface Meta { total: number; page: number; pages: number; }

export function SuppliersClient() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta]           = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name: "", contactPerson: "", email: "", phone: "", address: "", taxNumber: "" });
  const [formError, setFormError] = useState("");

  const fetchSuppliers = useCallback(async (q = search, page = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/suppliers?search=${q}&page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) { setSuppliers(json.data); setMeta(json.meta); }
    } catch {}
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError("");
    try {
      const res  = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setShowAdd(false); setForm({ name: "", contactPerson: "", email: "", phone: "", address: "", taxNumber: "" }); fetchSuppliers(); }
      else setFormError(json.error);
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">Suppliers</h1><p className="page-subtitle">{meta.total} supplier{meta.total !== 1 ? "s" : ""}</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Supplier</button>
      </div>

      <div className="search-bar" style={{ maxWidth: 360 }}>
        <Search size={15} style={{ color: "var(--text-muted)" }} />
        <input placeholder="Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchSuppliers(search)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>GST/Tax #</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>)}</tr>)
            : suppliers.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><Users2 size={40} className="empty-state-icon" /><h4>No suppliers</h4></div></td></tr>
            ) : suppliers.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{s.contactPerson ?? "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{s.email ?? "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{s.phone ?? "—"}</td>
                <td><code style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{s.taxNumber ?? "—"}</code></td>
                <td><span className={`badge ${s.isActive ? "badge-green" : "badge-red"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <Link href={`/suppliers/${s.id}`} className="table-action-btn"><Eye size={14} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => fetchSuppliers(search, meta.page - 1)}>← Prev</button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Page {meta.page} of {meta.pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={meta.page >= meta.pages} onClick={() => fetchSuppliers(search, meta.page + 1)}>Next →</button>
        </div>
      )}

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Supplier</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>✕</button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {formError && <div className="alert alert-danger">{formError}</div>}
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label required">Company Name</label><input className="form-input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">GST / Tax Number</label><input className="form-input" value={form.taxNumber} onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Add Supplier"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

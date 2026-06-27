"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Package, Edit2, Eye, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number; sku: string; name: string; description?: string;
  costPrice: string; sellingPrice: string; reorderLevel: number;
  isActive: boolean; createdAt: string;
  category?: { id: number; name: string } | null;
  unit?: { id: number; name: string; symbol: string } | null;
}

interface Meta { total: number; page: number; pages: number; limit: number; }

const STATUS_MAP: Record<string, string> = {
  draft: "badge-slate", confirmed: "badge-blue", processing: "badge-amber",
  shipped: "badge-blue", delivered: "badge-green", cancelled: "badge-red",
};

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function InventoryClient() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [meta, setMeta]           = useState<Meta>({ total: 0, page: 1, pages: 1, limit: 20 });
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const fetchProducts = useCallback(async (q = search, page = 1) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ search: q, page: String(page), limit: "20" });
      const res  = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (json.success) { setProducts(json.data); setMeta(json.meta); }
      else setError(json.error);
    } catch { setError("Failed to load products"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{meta.total} product{meta.total !== 1 ? "s" : ""} in catalogue</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchProducts()} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <Link href="/inventory/new" className="btn btn-primary btn-sm">
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <Search size={15} style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProducts(search)}
          />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchProducts(search)}>
          Search
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Reorder Lvl</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <Package size={40} className="empty-state-icon" />
                  <h4>No products found</h4>
                  <p>Add your first product to get started</p>
                  <Link href="/inventory/new" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    <Plus size={14} /> Add Product
                  </Link>
                </div>
              </td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td><code style={{ fontSize: "0.8125rem", color: "var(--primary)" }}>{p.sku}</code></td>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.description.slice(0, 40)}…</div>}
                </td>
                <td>{p.category?.name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td>{p.unit ? `${p.unit.name} (${p.unit.symbol})` : "—"}</td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(p.costPrice)}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--success)" }}>{fmt(p.sellingPrice)}</td>
                <td style={{ textAlign: "center" }}>{p.reorderLevel}</td>
                <td>
                  <span className={`badge ${p.isActive ? "badge-green" : "badge-red"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <Link href={`/inventory/${p.id}`} className="table-action-btn" title="View"><Eye size={14} /></Link>
                    <Link href={`/inventory/${p.id}/edit`} className="table-action-btn" title="Edit"><Edit2 size={14} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => fetchProducts(search, meta.page - 1)}>
            ← Prev
          </button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Page {meta.page} of {meta.pages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={meta.page >= meta.pages} onClick={() => fetchProducts(search, meta.page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

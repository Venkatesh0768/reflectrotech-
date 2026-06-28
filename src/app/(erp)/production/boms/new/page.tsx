"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface Product { id: number; name: string; sku: string; }

export default function NewBomPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    productId: "",
  });

  const [lines, setLines] = useState([{ rawMaterialId: "", quantity: "" }]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/products?limit=1000");
        const json = await res.json();
        if (json.success) setProducts(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId) return alert("Select a finished product");
    if (lines.some(l => !l.rawMaterialId || !l.quantity)) return alert("Fill out all raw material lines");
    
    setSaving(true);
    try {
      const res = await fetch("/api/boms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          productId: parseInt(form.productId),
          lines: lines.map(l => ({ rawMaterialId: parseInt(l.rawMaterialId), quantity: parseFloat(l.quantity) })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/production");
      } else {
        alert(data.error || "Failed to create BOM");
      }
    } catch (err) {
      alert("Error saving BOM");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading products...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Bill of Materials</h1>
          <p className="page-subtitle">Define raw materials needed for a finished product</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label required">BOM Name</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Standard PC Build" />
          </div>
          
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label required">Finished Product</label>
            <select className="form-select" required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
              <option value="">Select Finished Product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Description (Optional)</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Raw Materials (BOM Lines)</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLines([...lines, { rawMaterialId: "", quantity: "" }])}>
              <Plus size={14} /> Add Item
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label required">Raw Material</label>
                  <select className="form-select" required value={line.rawMaterialId} onChange={e => {
                    const newLines = [...lines];
                    newLines[i].rawMaterialId = e.target.value;
                    setLines(newLines);
                  }}>
                    <option value="">Select Material...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label required">Quantity Required</label>
                  <input className="form-input" type="number" step="0.01" required min="0.01" value={line.quantity} onChange={e => {
                    const newLines = [...lines];
                    newLines[i].quantity = e.target.value;
                    setLines(newLines);
                  }} />
                </div>
                {lines.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-icon" style={{ color: "var(--danger)", marginBottom: "4px" }}
                    onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <Link href="/production" className="btn btn-secondary"><X size={16} /> Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save BOM"}
          </button>
        </div>
      </form>
    </div>
  );
}

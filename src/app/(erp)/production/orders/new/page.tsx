"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Link from "next/link";

interface BOM { id: number; name: string; product: { name: string } }

export default function NewProductionOrderPage() {
  const router = useRouter();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    bomId: "",
    targetQuantity: "1",
    startDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    async function loadBoms() {
      setLoading(true);
      try {
        const res = await fetch("/api/boms?limit=1000");
        const json = await res.json();
        if (json.success) setBoms(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBoms();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bomId) return alert("Select a BOM");
    
    setSaving(true);
    try {
      const res = await fetch("/api/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bomId: parseInt(form.bomId),
          targetQuantity: parseFloat(form.targetQuantity),
          startDate: form.startDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/production");
      } else {
        alert(data.error || "Failed to create order");
      }
    } catch (err) {
      alert("Error saving order");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading BOMs...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Production Order</h1>
          <p className="page-subtitle">Schedule manufacturing of a finished product</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
        
        <div className="form-group">
          <label className="form-label required">Bill of Materials</label>
          <select className="form-select" required value={form.bomId} onChange={e => setForm({...form, bomId: e.target.value})}>
            <option value="">Select BOM...</option>
            {boms.map(b => <option key={b.id} value={b.id}>{b.name} (Produces: {b.product?.name})</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label required">Target Quantity</label>
          <input className="form-input" type="number" step="0.01" min="0.01" required value={form.targetQuantity} onChange={e => setForm({...form, targetQuantity: e.target.value})} />
        </div>

        <div className="form-group">
          <label className="form-label required">Start Date</label>
          <input className="form-input" type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <Link href="/production" className="btn btn-secondary"><X size={16} /> Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

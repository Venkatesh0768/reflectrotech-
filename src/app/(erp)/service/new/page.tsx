"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Link from "next/link";

interface Customer { id: number; name: string; email: string; phone?: string; }

export default function NewServiceJobPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    deviceName: "",
    deviceModel: "",
    serialNumber: "",
    problemDesc: "",
    estimatedCost: "",
    warrantyPeriod: "",
  });

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      try {
        const res = await fetch("/api/customers?limit=1000");
        const json = await res.json();
        if (json.success) setCustomers(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) return alert("Please select a customer");
    
    setSaving(true);
    try {
      const payload: any = {
        customerId: parseInt(form.customerId),
        deviceName: form.deviceName,
        problemDesc: form.problemDesc,
      };
      
      if (form.deviceModel) payload.deviceModel = form.deviceModel;
      if (form.serialNumber) payload.serialNumber = form.serialNumber;
      if (form.estimatedCost) payload.estimatedCost = parseFloat(form.estimatedCost);
      if (form.warrantyPeriod) payload.warrantyPeriod = parseInt(form.warrantyPeriod);

      const res = await fetch("/api/service-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.success) {
        router.push("/service");
      } else {
        alert(data.error || "Failed to create service job");
      }
    } catch (err) {
      alert("Error saving service job");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading customers...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Service Job</h1>
          <p className="page-subtitle">Register a device for repair or service</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
        
        <div className="form-group">
          <label className="form-label required">Customer</label>
          <select className="form-select" required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
            <option value="">Select Customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label required">Device Name / Type</label>
            <input className="form-input" required value={form.deviceName} onChange={e => setForm({...form, deviceName: e.target.value})} placeholder="e.g. iPhone 13, AC Unit" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Device Model (Optional)</label>
            <input className="form-input" value={form.deviceModel} onChange={e => setForm({...form, deviceModel: e.target.value})} placeholder="e.g. A2633" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Serial Number (Optional)</label>
          <input className="form-input" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} placeholder="e.g. SN-123456789" />
        </div>

        <div className="form-group">
          <label className="form-label required">Problem Description</label>
          <textarea className="form-input" required rows={4} value={form.problemDesc} onChange={e => setForm({...form, problemDesc: e.target.value})} placeholder="Describe the issue reported by the customer..." />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Estimated Cost (₹) (Optional)</label>
            <input className="form-input" type="number" step="0.01" min="0" value={form.estimatedCost} onChange={e => setForm({...form, estimatedCost: e.target.value})} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Warranty Period (Days) (Optional)</label>
            <input className="form-input" type="number" min="0" value={form.warrantyPeriod} onChange={e => setForm({...form, warrantyPeriod: e.target.value})} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <Link href="/service" className="btn btn-secondary"><X size={16} /> Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}

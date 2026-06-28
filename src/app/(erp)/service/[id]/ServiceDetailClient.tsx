"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

interface ServiceJob {
  id: number;
  jobNumber: string;
  status: string;
  deviceName: string;
  deviceModel?: string;
  serialNumber?: string;
  problemDesc: string;
  diagnosisNotes?: string;
  estimatedCost?: string;
  finalCost?: string;
  warrantyPeriod?: number;
  receivedAt: string;
  completedAt?: string;
  customer: { id: number; name: string; phone?: string; email?: string };
  assignedTo?: { id: string; fullName: string };
  parts: any[];
}

const STATUSES = ["received", "diagnosing", "waiting_parts", "in_repair", "ready", "delivered", "cancelled"];

export function ServiceDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [job, setJob] = useState<ServiceJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    status: "",
    diagnosisNotes: "",
    estimatedCost: "",
    finalCost: "",
  });

  async function fetchJob() {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-jobs/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.replace("/404");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setJob(json.data);
        setForm({
          status: json.data.status,
          diagnosisNotes: json.data.diagnosisNotes || "",
          estimatedCost: json.data.estimatedCost || "",
          finalCost: json.data.finalCost || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { status: form.status, diagnosisNotes: form.diagnosisNotes };
      if (form.estimatedCost) payload.estimatedCost = parseFloat(form.estimatedCost);
      if (form.finalCost) payload.finalCost = parseFloat(form.finalCost);

      const res = await fetch(`/api/service-jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert("Service job updated successfully");
        fetchJob();
      } else {
        alert(data.error || "Failed to update");
      }
    } catch (err) {
      alert("Error updating service job");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading job details...</div>;
  if (!job) return <div style={{ padding: "2rem", textAlign: "center" }}>Job not found.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <Link href="/service" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            <ChevronLeft size={16} /> Back to Service Jobs
          </Link>
          <h1 className="page-title">{job.jobNumber}</h1>
          <p className="page-subtitle">Service and Repair details</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
        
        {/* Left Column: Details & Edit Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Device Information</h3>
            <div className="grid-2">
              <div><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Device Name</label><div style={{ fontWeight: 500 }}>{job.deviceName}</div></div>
              <div><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Model</label><div>{job.deviceModel || "—"}</div></div>
              <div><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Serial Number</label><div>{job.serialNumber || "—"}</div></div>
              <div><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Warranty Period</label><div>{job.warrantyPeriod ? `${job.warrantyPeriod} days` : "None"}</div></div>
            </div>
            
            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Reported Problem</label>
              <div style={{ padding: "0.75rem", background: "var(--surface-3)", borderRadius: "var(--radius)", marginTop: "0.25rem" }}>
                {job.problemDesc}
              </div>
            </div>
          </div>

          <form className="card" onSubmit={handleUpdate}>
            <h3 style={{ marginBottom: "1rem" }}>Update Status & Diagnosis</h3>
            
            <div className="grid-2" style={{ marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Diagnosis Notes (Internal)</label>
              <textarea className="form-input" rows={3} value={form.diagnosisNotes} onChange={e => setForm({...form, diagnosisNotes: e.target.value})} placeholder="Technician notes, required parts, etc." />
            </div>

            <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label className="form-label">Estimated Cost (₹)</label>
                <input className="form-input" type="number" step="0.01" value={form.estimatedCost} onChange={e => setForm({...form, estimatedCost: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Final Cost (₹)</label>
                <input className="form-input" type="number" step="0.01" value={form.finalCost} onChange={e => setForm({...form, finalCost: e.target.value})} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? "Updating..." : "Update Job"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Meta Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Customer</h3>
            <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{job.customer.name}</div>
            {job.customer.phone && <div style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>📞 {job.customer.phone}</div>}
            {job.customer.email && <div style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>✉️ {job.customer.email}</div>}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Job Timeline</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Received At</label><div>{new Date(job.receivedAt).toLocaleString("en-IN")}</div></div>
              {job.completedAt && (
                <div><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Completed At</label><div>{new Date(job.completedAt).toLocaleString("en-IN")}</div></div>
              )}
              <div style={{ marginTop: "0.5rem" }}><label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Assigned To</label>
                <div>{job.assignedTo ? job.assignedTo.fullName : "Unassigned"}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Link from "next/link";

export default function OnboardEmployeePage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    profileId: "",
    designation: "",
    department: "",
    joinDate: new Date().toISOString().slice(0, 10),
    baseSalary: "",
    bankAccount: "",
    nationalId: "",
    emergencyContact: "",
  });

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const res = await fetch("/api/users?limit=1000");
        const json = await res.json();
        if (json.success) setUsers(json.data.users);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.profileId) return alert("Please select a user profile");
    
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: form.profileId,
          designation: form.designation,
          department: form.department,
          joinDate: form.joinDate,
          baseSalary: parseFloat(form.baseSalary),
          bankAccount: form.bankAccount || undefined,
          nationalId: form.nationalId || undefined,
          emergencyContact: form.emergencyContact || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/hrm");
      } else {
        alert(data.error || "Failed to add employee");
      }
    } catch (err) {
      alert("Error adding employee");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading users...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Onboard Employee</h1>
          <p className="page-subtitle">Link a user profile to their HR records</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
        
        <div className="form-group">
          <label className="form-label required">System User Profile</label>
          <select className="form-select" required value={form.profileId} onChange={e => setForm({...form, profileId: e.target.value})}>
            <option value="">Select User Profile...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
          </select>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            The user must exist in the system first. If they don't, go to Settings &gt; Users to create them.
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label required">Department</label>
            <input className="form-input" required value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Sales, Engineering" />
          </div>
          
          <div className="form-group">
            <label className="form-label required">Designation</label>
            <input className="form-input" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Software Engineer" />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label required">Join Date</label>
            <input className="form-input" type="date" required value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label required">Base Salary (₹)</label>
            <input className="form-input" type="number" step="1000" min="0" required value={form.baseSalary} onChange={e => setForm({...form, baseSalary: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Bank Account Info (Optional)</label>
          <input className="form-input" value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} placeholder="e.g. Account No, IFSC" />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">National ID / PAN (Optional)</label>
            <input className="form-input" value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact (Optional)</label>
            <input className="form-input" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} placeholder="Name & Phone" />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <Link href="/hrm" className="btn btn-secondary"><X size={16} /> Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Settings, Building2, Users, Bell, Shield, Database } from "lucide-react";

const SECTIONS = [
  { id: "company",       label: "Company Info",    icon: <Building2 size={16} /> },
  { id: "users",         label: "User Management", icon: <Users size={16} /> },
  { id: "notifications", label: "Notifications",   icon: <Bell size={16} /> },
  { id: "security",      label: "Security",         icon: <Shield size={16} /> },
  { id: "system",        label: "System",           icon: <Database size={16} /> },
] as const;

type Section = typeof SECTIONS[number]["id"];

export function SettingsClient() {
  const [section, setSection] = useState<Section>("company");
  
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", full_name: "", role: "employee" });

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users?limit=100");
      const json = await res.json();
      if (json.success) setUsers(json.data.users);
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setUsersLoading(false);
    }
  }

  async function updateRole(userId: string, newRole: string) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch {
      alert("Error updating role");
    }
  }

  async function toggleStatus(userId: string, currentStatus: boolean) {
    if (currentStatus) {
      if (!confirm("Are you sure you want to deactivate this user?")) return;
      try {
        const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
        if (res.ok) fetchUsers();
      } catch { alert("Error deactivating user"); }
    } else {
      alert("Reactivating users is currently managed via Supabase Admin.");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        alert("User created successfully!");
        setShowCreateUser(false);
        setUserForm({ email: "", password: "", full_name: "", role: "employee" });
        fetchUsers();
      } else {
        alert(data.error || "Failed to create user");
      }
    } catch {
      alert("Error creating user");
    } finally {
      setCreatingUser(false);
    }
  }

  import("react").then((m) => {
    m.useEffect(() => {
      if (section === "users") fetchUsers();
    }, [section]);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">Settings</h1><p className="page-subtitle">Manage system configuration and preferences</p></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.25rem", alignItems: "start" }}>
        {/* Nav */}
        <div className="card" style={{ padding: "0.5rem" }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`nav-item${section === s.id ? " active" : ""}`}
              style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: 2 }}
              onClick={() => setSection(s.id)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {section === "company" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3>Company Information</h3>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" defaultValue="R.F. Electrotech" /></div>
                <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" placeholder="e.g. 09ABCDE1234F1Z5" /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue="+91 9205009707" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue="info@rfelectrotech.com" /></div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label">Address</label><textarea className="form-textarea" defaultValue="Plot No 106, Sector Ecotech 12, Greater Noida, G. B. Nagar, U.P." /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {section === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ marginBottom: "0.25rem" }}>User Management</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Manage system users, roles, and access levels.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateUser(!showCreateUser)}>
                  {showCreateUser ? "Cancel" : "+ Create User"}
                </button>
              </div>

              {showCreateUser && (
                <form className="card" onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem", background: "var(--surface-2)" }}>
                  <h4 style={{ margin: 0 }}>Create New User</h4>
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label required">Full Name</label><input className="form-input" required value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label required">Email</label><input className="form-input" type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label required">Password</label><input className="form-input" type="password" minLength={8} required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>
                    <div className="form-group">
                      <label className="form-label required">Role</label>
                      <select className="form-select" required value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn btn-primary" disabled={creatingUser}>
                      {creatingUser ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              )}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Loading users...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No users found</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                          <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                          <td>
                            <select 
                              className="form-select" 
                              style={{ width: "120px", padding: "0.25rem 0.5rem", height: "auto" }}
                              value={u.role}
                              onChange={(e) => updateRole(u.id, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="employee">Employee</option>
                            </select>
                          </td>
                          <td>
                            <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => toggleStatus(u.id, u.isActive)}
                              disabled={!u.isActive}
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div>
              <h3 style={{ marginBottom: "1rem" }}>Notification Preferences</h3>
              {[
                "Low stock alerts",
                "New sales order created",
                "Purchase order received",
                "Leave request pending",
                "Service job overdue",
              ].map((item) => (
                <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.875rem" }}>{item}</span>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
                </div>
              ))}
            </div>
          )}

          {section === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3>Security Settings</h3>
              <div className="alert alert-info">Authentication is managed by Supabase Auth with JWT tokens. Session refresh is handled automatically via SSR middleware.</div>
              <div className="form-group"><label className="form-label">Session Timeout</label>
                <select className="form-select">
                  <option>1 hour</option><option>4 hours</option><option>8 hours</option><option>24 hours</option>
                </select>
              </div>
            </div>
          )}

          {section === "system" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3>System Information</h3>
              <div className="table-wrap">
                <table>
                  <tbody>
                    {[
                      ["Framework",    "Next.js 16 (App Router)"],
                      ["Database",     "PostgreSQL via Supabase"],
                      ["ORM",          "Prisma 6"],
                      ["Auth",         "Supabase Auth (SSR)"],
                      ["UI Library",   "Tailwind CSS 4 + Custom CSS"],
                      ["Charts",       "Recharts 2"],
                      ["Forms",        "React Hook Form + Zod"],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ fontWeight: 500, width: 160 }}>{k}</td>
                        <td style={{ color: "var(--text-secondary)" }}><code style={{ fontSize: "0.8125rem" }}>{v}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

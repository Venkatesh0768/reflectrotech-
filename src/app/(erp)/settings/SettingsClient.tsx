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
            <div>
              <h3 style={{ marginBottom: "1rem" }}>User Management</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>Manage system users and their roles. Navigate to Admin panel in Supabase for full user management.</p>
              <div className="alert alert-info">
                User creation and role assignment is handled via the <strong>/api/auth/signup</strong> endpoint. Admins can upgrade roles via <strong>/api/users</strong>.
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

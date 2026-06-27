"use client";

import { useEffect, useState } from "react";
import { Users2, Plus, Search } from "lucide-react";
import Link from "next/link";

interface Employee {
  id: number; designation: string; department: string; joinDate: string; baseSalary: string;
  profile: { id: string; fullName: string; email: string; phone?: string; role: string; isActive: boolean; };
}

const TABS = ["Employees", "Leaves", "Payroll"] as const;
type Tab = typeof TABS[number];

interface Leave {
  id: number; leaveType: string; startDate: string; endDate: string; days: number; status: string; reason?: string;
  employee: { profile: { fullName: string } };
}

const LEAVE_COLORS: Record<string, string> = { pending: "badge-amber", approved: "badge-green", rejected: "badge-red", cancelled: "badge-slate" };

export function HRMClient() {
  const [tab, setTab]               = useState<Tab>("Employees");
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [leaves, setLeaves]         = useState<Leave[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [empRes, leaveRes] = await Promise.all([
          fetch("/api/employees").then((r) => r.json()),
          fetch("/api/leaves").then((r) => r.json()),
        ]);
        if (empRes.success)   setEmployees(empRes.data);
        if (leaveRes.success) setLeaves(leaveRes.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const filteredEmp = employees.filter((e) =>
    !search || e.profile.fullName.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">HRM &amp; Payroll</h1><p className="page-subtitle">{employees.length} employee{employees.length !== 1 ? "s" : ""} on record</p></div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/hrm/onboard" className="btn btn-primary btn-sm"><Plus size={15} /> Add Employee</Link>
        </div>
      </div>

      <div className="tabs">{(["Employees","Leaves","Payroll"] as Tab[]).map((t) => <button key={t} className={`tab-item${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === "Employees" && (
        <>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={15} style={{ color: "var(--text-muted)" }} />
            <input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Department</th><th>Designation</th><th>Join Date</th><th>Salary</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} /></td>)}</tr>)
                : filteredEmp.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><Users2 size={40} className="empty-state-icon" /><h4>No employees found</h4></div></td></tr>
                ) : filteredEmp.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div className="avatar avatar-sm">{emp.profile.fullName[0]}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{emp.profile.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{emp.profile.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td style={{ color: "var(--text-muted)" }}>{new Date(emp.joinDate).toLocaleDateString("en-IN")}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>₹{Number(emp.baseSalary).toLocaleString("en-IN")}</td>
                    <td><span className="badge badge-blue" style={{ textTransform: "capitalize" }}>{emp.profile.role}</span></td>
                    <td><span className={`badge ${emp.profile.isActive ? "badge-green" : "badge-red"}`}>{emp.profile.isActive ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Leaves" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h4>No leave requests</h4></div></td></tr>
              ) : leaves.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 500 }}>{l.employee.profile.fullName}</td>
                  <td><span className="badge badge-blue" style={{ textTransform: "capitalize" }}>{l.leaveType}</span></td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(l.startDate).toLocaleDateString("en-IN")}</td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(l.endDate).toLocaleDateString("en-IN")}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{l.days}</td>
                  <td><span className={`badge ${LEAVE_COLORS[l.status] ?? "badge-slate"}`} style={{ textTransform: "capitalize" }}>{l.status}</span></td>
                  <td style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{l.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Payroll" && (
        <div className="card">
          <div className="empty-state" style={{ padding: "3rem" }}>
            <Users2 size={40} className="empty-state-icon" />
            <h4>Payroll Processing</h4>
            <p>Monthly payroll will be processed here. Coming in the next sprint.</p>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingDown, Plus, RefreshCw } from "lucide-react";

interface Payment { id: number; referenceType: string; amount: string; method: string; paidAt: string; notes?: string; }
interface Expense { id: number; title: string; amount: string; category: string; method: string; expenseDate: string; }

const TABS = ["Overview", "Payments", "Expenses"] as const;
type Tab = typeof TABS[number];

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function FinanceClient() {
  const [tab, setTab]             = useState<Tab>("Overview");
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [expForm, setExpForm]     = useState({ title: "", amount: "", category: "Office", method: "cash" as const, expenseDate: new Date().toISOString().slice(0,10), notes: "" });

  async function fetchPayments() {
    setLoading(true);
    try { const r = await fetch("/api/payments"); const j = await r.json(); if (j.success) setPayments(j.data); } catch {}
    finally { setLoading(false); }
  }
  async function fetchExpenses() {
    setLoading(true);
    try { const r = await fetch("/api/expenses"); const j = await r.json(); if (j.success) setExpenses(j.data); } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchPayments(); fetchExpenses(); }, []);

  const totalIn  = payments.filter((p) => p.referenceType === "sales_order").reduce((s, p) => s + Number(p.amount), 0);
  const totalOut = payments.filter((p) => p.referenceType === "purchase_order").reduce((s, p) => s + Number(p.amount), 0) + expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res  = await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expForm, amount: parseFloat(expForm.amount) }),
      });
      const json = await res.json();
      if (json.success) { setShowExpense(false); fetchExpenses(); }
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div><h1 className="page-title">Finance</h1><p className="page-subtitle">Payments, expenses &amp; P&amp;L overview</p></div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { fetchPayments(); fetchExpenses(); }}><RefreshCw size={15} /></button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpense(true)}><Plus size={15} /> Add Expense</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#10b98122" }}><DollarSign size={18} color="#10b981" /></div>
          <div className="kpi-value" style={{ color: "var(--success)" }}>{fmt(totalIn)}</div>
          <div className="kpi-label">Total Receipts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#ef444422" }}><TrendingDown size={18} color="#ef4444" /></div>
          <div className="kpi-value" style={{ color: "var(--danger)" }}>{fmt(totalOut)}</div>
          <div className="kpi-label">Total Payments & Expenses</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "var(--primary-muted)" }}><DollarSign size={18} color="var(--primary)" /></div>
          <div className="kpi-value" style={{ color: totalIn - totalOut >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(totalIn - totalOut)}</div>
          <div className="kpi-label">Net Balance</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab-item${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Overview" && (
        <div className="card">
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
            Switch to Payments or Expenses tab to view detailed records.
          </p>
        </div>
      )}

      {tab === "Payments" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Amount</th><th>Method</th><th>Date</th><th>Notes</th></tr></thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><DollarSign size={40} className="empty-state-icon" /><h4>No payments recorded</h4></div></td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td><span className={`badge ${p.referenceType === "sales_order" ? "badge-green" : "badge-amber"}`}>{p.referenceType === "sales_order" ? "Receipt" : "Payment"}</span></td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmt(p.amount)}</td>
                  <td style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{p.method.replace("_", " ")}</td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(p.paidAt).toLocaleDateString("en-IN")}</td>
                  <td style={{ color: "var(--text-muted)" }}>{p.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Expenses" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><TrendingDown size={40} className="empty-state-icon" /><h4>No expenses recorded</h4><button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowExpense(true)}><Plus size={14} /> Add Expense</button></div></td></tr>
              ) : expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 500 }}>{e.title}</td>
                  <td><span className="badge badge-slate">{e.category}</span></td>
                  <td style={{ fontWeight: 600, color: "var(--danger)", fontVariantNumeric: "tabular-nums" }}>{fmt(e.amount)}</td>
                  <td style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{e.method.replace("_", " ")}</td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(e.expenseDate).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpense && (
        <div className="modal-backdrop" onClick={() => setShowExpense(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Expense</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowExpense(false)}>✕</button></div>
            <form onSubmit={handleAddExpense}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label required">Title</label><input className="form-input" required value={expForm.title} onChange={(e) => setExpForm((f) => ({ ...f, title: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label required">Amount (₹)</label><input className="form-input" type="number" min="0" step="0.01" required value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Category</label>
                    <select className="form-select" value={expForm.category} onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}>
                      {["Office","Utilities","Raw Material","Transport","Maintenance","Salary","Other"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Method</label>
                    <select className="form-select" value={expForm.method} onChange={(e) => setExpForm((f) => ({ ...f, method: e.target.value as any }))}>
                      {["cash","bank_transfer","cheque","credit_card","online"].map((m) => <option key={m} value={m} style={{ textTransform: "capitalize" }}>{m.replace("_"," ")}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label required">Date</label><input className="form-input" type="date" required value={expForm.expenseDate} onChange={(e) => setExpForm((f) => ({ ...f, expenseDate: e.target.value }))} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpense(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

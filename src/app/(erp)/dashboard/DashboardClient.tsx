"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Truck, Wrench, Users, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DashboardData {
  kpis: {
    revenueMTD: number;
    revenueChange: string | null;
    activeOrders: number;
    openPOs: number;
    lowStockCount: number;
    openServiceJobs: number;
    pendingLeaves: number;
  };
  revenueChart: { date: string; revenue: number }[];
  topProducts: { name: string; revenue: number }[];
  orderStatus: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--text-muted)", confirmed: "var(--primary)", processing: "var(--warning)",
  shipped: "var(--accent)", delivered: "var(--success)", cancelled: "var(--danger)", returned: "var(--danger)",
};

const CHART_COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--accent)", "var(--danger)"];

function fmt(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function KpiCard({
  label, value, icon, change, color, sub,
}: {
  label: string; value: string; icon: React.ReactNode;
  change?: string | null; color: string; sub?: string;
}) {
  const isUp = change && parseFloat(change) >= 0;
  return (
    <div className="kpi-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="kpi-icon" style={{ background: color + "22" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {change && (
          <span className={`kpi-change ${isUp ? "up" : "down"}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(parseFloat(change))}%
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => { if (j.success) setData(j.data); else setError(j.error); })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long" });

  if (loading) return <DashboardLoadingState />;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!data)   return null;

  const { kpis, revenueChart, topProducts, orderStatus } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here&apos;s what&apos;s happening at RF Electrotech today.</p>
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", padding: "0.375rem 0.75rem", background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <KpiCard
          label={`Revenue — ${monthName}`}
          value={fmt(kpis.revenueMTD)}
          icon={<TrendingUp size={18} />}
          change={kpis.revenueChange}
          color="var(--primary)"
          sub="vs last month"
        />
        <KpiCard
          label="Active Sales Orders"
          value={kpis.activeOrders.toString()}
          icon={<ShoppingCart size={18} />}
          color="var(--success)"
          sub="confirmed + processing + shipped"
        />
        <KpiCard
          label="Open Purchase Orders"
          value={kpis.openPOs.toString()}
          icon={<Truck size={18} />}
          color="var(--warning)"
          sub="pending with suppliers"
        />
        <KpiCard
          label="Low Stock Alerts"
          value={kpis.lowStockCount.toString()}
          icon={<AlertTriangle size={18} />}
          color={kpis.lowStockCount > 0 ? "var(--danger)" : "var(--success)"}
          sub="below reorder level"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid-3">
        <KpiCard
          label="Open Service Jobs"
          value={kpis.openServiceJobs.toString()}
          icon={<Wrench size={18} />}
          color="var(--accent)"
        />
        <KpiCard
          label="Pending Leave Requests"
          value={kpis.pendingLeaves.toString()}
          icon={<Users size={18} />}
          color="var(--warning)"
        />
        <KpiCard
          label="Total SKUs in Inventory"
          value="—"
          icon={<Package size={18} />}
          color="var(--success)"
          sub="view inventory for details"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
        {/* Revenue chart */}
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem" }}>Revenue — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--text-muted)", fontSize: 12 }}
                itemStyle={{ color: "var(--text-primary)" }}
                formatter={(v: number) => [fmt(v), "Revenue"]}
              />
              <Line
                type="monotone" dataKey="revenue"
                stroke="var(--primary)" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order status donut */}
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem" }}>Order Status</h3>
          {orderStatus.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {orderStatus.map((entry, i) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "capitalize" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem" }}>Top 5 Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}
                formatter={(v: number) => [fmt(v), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Loading…</p>
        </div>
      </div>
      <div className="grid-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card" style={{ height: 120 }}>
            <div style={{ width: 40, height: 40, background: "var(--surface-3)", borderRadius: 8 }} />
            <div style={{ width: "60%", height: 28, background: "var(--surface-3)", borderRadius: 6, marginTop: 8 }} />
            <div style={{ width: "80%", height: 14, background: "var(--surface-3)", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

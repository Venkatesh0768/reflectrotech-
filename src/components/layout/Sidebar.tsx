"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users,
  DollarSign, Factory, Wrench, Users2, BarChart3,
  Settings, CircuitBoard, ChevronLeft,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",      icon: <LayoutDashboard size={18} />, section: "MAIN" },
  { href: "/inventory",   label: "Inventory",       icon: <Package size={18} />,         section: "OPERATIONS" },
  { href: "/sales",       label: "Sales Orders",    icon: <ShoppingCart size={18} /> },
  { href: "/customers",   label: "Customers",       icon: <Users size={18} /> },
  { href: "/purchasing",  label: "Purchasing",      icon: <Truck size={18} /> },
  { href: "/suppliers",   label: "Suppliers",       icon: <Users2 size={18} /> },
  { href: "/production",  label: "Production",      icon: <Factory size={18} />,         section: "MANUFACTURING" },
  { href: "/service",     label: "Service Jobs",    icon: <Wrench size={18} /> },
  { href: "/finance",     label: "Finance",         icon: <DollarSign size={18} />,      section: "FINANCE & HR" },
  { href: "/hrm",         label: "HRM & Payroll",   icon: <Users2 size={18} /> },
  { href: "/reports",     label: "Reports",         icon: <BarChart3 size={18} />,       section: "SYSTEM" },
  { href: "/settings",    label: "Settings",        icon: <Settings size={18} /> },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={`erp-sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <CircuitBoard size={18} />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <div>RF Electrotech</div>
            <div className="sidebar-logo-sub">ERP System</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <div key={item.href}>
              {item.section && !collapsed && (
                <div className="nav-section-label">{item.section}</div>
              )}
              <Link href={item.href} className={`nav-item${isActive ? " active" : ""}`} title={collapsed ? item.label : undefined}>
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
                {!collapsed && item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="btn btn-ghost btn-sm"
        style={{
          margin: "0.75rem",
          justifyContent: "center",
          borderTop: "1px solid var(--border)",
          borderRadius: 0,
          paddingTop: "0.75rem",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={16}
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
        {!collapsed && <span style={{ marginLeft: 4 }}>Collapse</span>}
      </button>
    </aside>
  );
}

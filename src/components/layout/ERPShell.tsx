"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface ERPShellProps {
  children: React.ReactNode;
  user: { name: string; role: string; initials: string } | null;
}

export function ERPShell({ children, user }: ERPShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className={`erp-main${collapsed ? " collapsed" : ""}`}>
        <Header user={user} />
        <main className="erp-content">{children}</main>
      </div>
    </div>
  );
}

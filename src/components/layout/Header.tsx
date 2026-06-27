"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Search, LogOut, User, ChevronDown, Sun, Moon } from "lucide-react";

interface HeaderProps {
  user: { name: string; role: string; initials: string } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <header className="erp-header" style={{ backdropFilter: "none", background: "var(--surface)" }}>
      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 360, flex: 1 }}>
        <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input placeholder="Search anything…" aria-label="Global search" />
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            theme === "dark" ? <Sun size={18} /> : <Moon size={18} />
          ) : (
            <div style={{ width: 18, height: 18 }} />
          )}
        </button>

        {/* Notifications */}
        <button className="btn btn-ghost btn-icon" aria-label="Notifications" style={{ position: "relative" }}>
          <Bell size={18} />
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--danger)", border: "2px solid var(--surface)",
          }} />
        </button>

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <button
            id="user-menu-toggle"
            className="btn btn-ghost btn-sm"
            onClick={() => setMenuOpen((v) => !v)}
            style={{ gap: "0.5rem" }}
          >
            <div className="avatar avatar-sm">
              {user?.initials ?? "U"}
            </div>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                {user?.name ?? "User"}
              </span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                {user?.role ?? "—"}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          </button>

          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)",
                zIndex: 50, minWidth: 180, padding: "0.375rem",
              }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "flex-start", gap: "0.625rem" }}
                  onClick={() => { setMenuOpen(false); router.push("/settings/profile"); }}
                >
                  <User size={15} /> My Profile
                </button>
                <div className="divider" style={{ margin: "0.25rem 0" }} />
                <button
                  id="logout-btn"
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "flex-start", gap: "0.625rem", color: "var(--danger)" }}
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

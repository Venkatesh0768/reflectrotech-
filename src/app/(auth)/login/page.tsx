"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CircuitBoard, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

// Inner component — uses useSearchParams so it must be in Suspense
function LoginForm() {

  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/dashboard";

  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const busy = isSubmitting || isPending;

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.error ?? "Login failed. Please try again.");
        return;
      }
      startTransition(() => router.replace(nextPath));
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{
            width: 44, height: 44,
            background: "var(--primary)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CircuitBoard size={24} color="var(--bg)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--text-primary)" }}>
              RF Electrotech
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ERP Management System</div>
          </div>
        </div>

        <h1 style={{ fontSize: "1.375rem", marginBottom: "0.375rem" }}>Welcome back</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.75rem" }}>
          Sign in to your account to continue
        </p>

        {serverError && (
          <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label required" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`form-input${errors.email ? " error" : ""}`}
              placeholder="you@rfelectrotech.com"
              {...register("email")}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className={`form-input${errors.password ? " error" : ""}`}
                placeholder="••••••••"
                style={{ paddingRight: "2.75rem" }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", display: "flex",
                }}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={busy}
            className="btn btn-primary btn-lg"
            style={{ marginTop: "0.5rem", justifyContent: "center", width: "100%" }}
          >
            {busy ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <div className="divider" style={{ margin: "1.5rem 0" }} />

        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 500 }}>
            Contact your administrator
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-bg"><div className="auth-card" style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading…</div></div>}>
      <LoginForm />
    </Suspense>
  );
}

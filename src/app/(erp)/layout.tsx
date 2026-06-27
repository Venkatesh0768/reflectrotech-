import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ERPShell } from "@/components/layout/ERPShell";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { template: "%s | RF Electrotech ERP", default: "RF Electrotech ERP" },
  description: "RF Electrotech Enterprise Resource Planning System",
};

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  // Verify session server-side (middleware already did this, but belt-and-suspenders)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile for header display
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  const headerUser = profile
    ? { name: profile.fullName, role: profile.role, initials }
    : null;

  return (
    <ERPShell user={headerUser}>{children}</ERPShell>
  );
}

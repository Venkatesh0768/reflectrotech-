import { redirect } from "next/navigation";

// Middleware handles the root redirect (/  →  /login or /dashboard)
// but in case someone bypasses it, redirect here too.
export default function RootPage() {
  redirect("/dashboard");
}

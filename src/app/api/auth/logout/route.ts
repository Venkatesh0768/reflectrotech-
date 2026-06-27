/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears the session cookie.
 * Authenticated — requires a valid session.
 */
import { createClient } from "@/lib/supabase/server";
import { unauthorized } from "@/lib/utils/auth";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true, data: { message: "Logged out" } });
}

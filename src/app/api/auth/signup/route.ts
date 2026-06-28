/**
 * POST /api/auth/signup
 *
 * Registers a new user via Supabase Auth.
 * The handle_new_user DB trigger auto-creates the profiles row,
 * which Prisma then reads for subsequent queries.
 *
 * Body: { email, password, full_name, role? }
 * Public — no auth required.
 */
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import type { SignupBody } from "@/types/auth";

const VALID_ROLES = ["admin", "manager", "employee"] as const;

export async function POST(request: NextRequest) {
  const profile = await requireRole("admin");
  if (isResponse(profile)) return profile;

  let body: SignupBody;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { email, password, full_name, role = "employee" } = body;

  if (!email || !password || !full_name) {
    return badRequest("email, password, and full_name are required");
  }
  if (password.length < 8) {
    return badRequest("Password must be at least 8 characters");
  }
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return badRequest(`role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.status ?? 400 }
    );
  }

  return Response.json(
    {
      success: true,
      data: {
        user: { id: data.user?.id, email: data.user?.email },
      },
    },
    { status: 201 }
  );
}

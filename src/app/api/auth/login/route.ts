/**
 * POST /api/auth/login
 *
 * Signs in a user with email + password via Supabase Auth.
 * Profile data (role, name, etc.) is fetched from Prisma.
 *
 * Body: { email, password }
 * Public — no auth required.
 */
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { badRequest, toProfile } from "@/lib/utils/auth";
import type { LoginBody } from "@/types/auth";

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { email, password } = body;

  if (!email || !password) {
    return badRequest("email and password are required");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.status ?? 401 }
    );
  }

  // Fetch full profile from Prisma
  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });

  if (profile && !profile.isActive) {
    await supabase.auth.signOut();
    return Response.json(
      { success: false, error: "Account is deactivated" },
      { status: 403 }
    );
  }

  return Response.json({
    success: true,
    data: {
      user: {
        id: data.user.id,
        email: data.user.email,
        ...(profile ? toProfile(profile) : {}),
      },
      session: { expires_at: data.session.expires_at },
    },
  });
}

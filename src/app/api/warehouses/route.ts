/** GET /api/warehouses  POST /api/warehouses */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({ name: z.string().min(1), location: z.string().optional() });

export async function GET() {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const wh = await prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return Response.json({ success: true, data: wh });
}

export async function POST(req: NextRequest) {
  const profile = await requireRole("admin");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  const wh = await prisma.warehouse.create({ data: parsed.data });
  return Response.json({ success: true, data: wh }, { status: 201 });
}

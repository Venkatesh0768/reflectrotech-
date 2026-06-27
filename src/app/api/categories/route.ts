/** GET /api/categories  POST /api/categories */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional(),
});

export async function GET() {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const cats = await prisma.category.findMany({ include: { children: true }, orderBy: { name: "asc" } });
  return Response.json({ success: true, data: cats });
}

export async function POST(req: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  const cat = await prisma.category.create({ data: parsed.data });
  return Response.json({ success: true, data: cat }, { status: 201 });
}

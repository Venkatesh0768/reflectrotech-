/**
 * GET  /api/suppliers  POST /api/suppliers
 */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  name:          z.string().min(1),
  contactPerson: z.string().optional(),
  email:         z.string().email().optional().or(z.literal("")),
  phone:         z.string().optional(),
  address:       z.string().optional(),
  taxNumber:     z.string().optional(),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const where  = {
    isActive: true,
    ...(search && { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { contactPerson: { contains: search, mode: "insensitive" as const } }] }),
  };
  
  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ 
      where, 
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" } 
    }),
    prisma.supplier.count({ where }),
  ]);
  
  return Response.json({ success: true, data: suppliers, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  try {
    const s = await prisma.supplier.create({ data: parsed.data });
    return Response.json({ success: true, data: s }, { status: 201 });
  } catch { return internalError(); }
}

/**
 * GET  /api/customers  — paginated list with search
 * POST /api/customers  — create customer
 */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const CreateSchema = z.object({
  name:          z.string().min(1),
  contactPerson: z.string().optional(),
  email:         z.string().email().optional().or(z.literal("")),
  phone:         z.string().optional(),
  address:       z.string().optional(),
  taxNumber:     z.string().optional(),
  creditLimit:   z.number().nonnegative().default(0),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name:          { contains: search, mode: "insensitive" as const } },
        { contactPerson: { contains: search, mode: "insensitive" as const } },
        { email:         { contains: search, mode: "insensitive" as const } },
        { phone:         { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return Response.json({ success: true, data: customers, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  try {
    const customer = await prisma.customer.create({ data: parsed.data });
    return Response.json({ success: true, data: customer }, { status: 201 });
  } catch {
    return internalError();
  }
}

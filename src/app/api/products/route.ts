/**
 * GET  /api/products        — paginated list with search + category filter
 * POST /api/products        — create product (manager+)
 */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const CreateSchema = z.object({
  sku:          z.string().min(1),
  name:         z.string().min(1),
  description:  z.string().optional(),
  categoryId:   z.number().int().positive().optional(),
  unitId:       z.number().int().positive().optional(),
  costPrice:    z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
  isSerialized: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const { searchParams } = request.nextUrl;
  const search     = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId");
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku:  { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { categoryId: parseInt(categoryId) }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } }, unit: { select: { id: true, symbol: true, name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ success: true, data: products, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  try {
    const product = await prisma.product.create({
      data: { ...parsed.data, createdById: profile.id },
      include: { category: true, unit: true },
    });
    return Response.json({ success: true, data: product }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return badRequest("SKU already exists");
    return internalError();
  }
}

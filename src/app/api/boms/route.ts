import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const CreateSchema = z.object({
  productId:   z.number().int().positive(),
  name:        z.string().min(1),
  description: z.string().optional(),
  lines:       z.array(z.object({
    rawMaterialId: z.number().int().positive(),
    quantity:      z.number().positive(),
  })).min(1),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const { searchParams } = request.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const [boms, total] = await Promise.all([
    prisma.billOfMaterial.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true } },
        lines: { include: { rawMaterial: { select: { id: true, name: true, sku: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.billOfMaterial.count(),
  ]);

  return Response.json({ success: true, data: boms, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { lines, ...rest } = parsed.data;

  try {
    const bom = await prisma.billOfMaterial.create({
      data: {
        ...rest,
        lines: {
          create: lines.map((l) => ({ rawMaterialId: l.rawMaterialId, quantity: l.quantity })),
        },
      },
      include: { product: true, lines: true },
    });
    return Response.json({ success: true, data: bom }, { status: 201 });
  } catch (err: any) {
    return internalError();
  }
}

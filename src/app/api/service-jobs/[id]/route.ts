import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError, notFound } from "@/lib/utils/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["received", "diagnosing", "waiting_parts", "in_repair", "ready", "delivered", "cancelled"]).optional(),
  diagnosisNotes: z.string().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  finalCost: z.number().nonnegative().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) return badRequest("Invalid ID");

  try {
    const job = await prisma.serviceJob.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        assignedTo: { select: { id: true, fullName: true } },
        parts: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });
    if (!job) return notFound();
    return Response.json({ success: true, data: job });
  } catch (err: any) {
    return internalError();
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) return badRequest("Invalid ID");

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { status, diagnosisNotes, estimatedCost, finalCost } = parsed.data;

  try {
    const updateData: any = {
      ...(status && { status }),
      ...(diagnosisNotes !== undefined && { diagnosisNotes }),
      ...(estimatedCost !== undefined && { estimatedCost }),
      ...(finalCost !== undefined && { finalCost }),
    };

    if (status === "ready" || status === "delivered") {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.serviceJob.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    return Response.json({ success: true, data: updated });
  } catch (err: any) {
    return internalError();
  }
}

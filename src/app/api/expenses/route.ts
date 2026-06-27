/** GET /api/expenses  POST /api/expenses */
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isResponse, badRequest, internalError } from "@/lib/utils/auth";
import { z } from "zod";

const Schema = z.object({
  title:       z.string().min(1),
  amount:      z.number().positive(),
  category:    z.string().min(1),
  method:      z.enum(["cash","bank_transfer","cheque","credit_card","online"]),
  expenseDate: z.string(),
  notes:       z.string().optional(),
  receiptUrl:  z.string().url().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const profile = await requireRole("employee");
  if (isResponse(profile)) return profile;
  const { searchParams } = request.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { expenseDate: "desc" } }),
    prisma.expense.count(),
  ]);
  return Response.json({ success: true, data: expenses, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const profile = await requireRole("manager");
  if (isResponse(profile)) return profile;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);
  try {
    const expense = await prisma.expense.create({ data: { ...parsed.data, expenseDate: new Date(parsed.data.expenseDate) } });
    return Response.json({ success: true, data: expense }, { status: 201 });
  } catch { return internalError(); }
}

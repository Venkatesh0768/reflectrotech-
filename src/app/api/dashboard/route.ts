/**
 * GET /api/dashboard
 * Returns all KPIs and chart data for the main dashboard.
 * Requires: authenticated user (any role).
 */
import { getAuthenticatedProfile, isResponse, unauthorized } from "@/lib/utils/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profile = await getAuthenticatedProfile();
  if (!profile) return unauthorized();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenueMTD,
    totalRevenueLastMonth,
    activeOrders,
    openPOs,
    lowStockRaw,
    openServiceJobs,
    pendingLeaves,
    revenueByDay,
    topProducts,
    orderStatusBreakdown,
  ] = await Promise.all([
    // Revenue this month
    prisma.salesOrder.aggregate({
      where: { orderDate: { gte: startOfMonth }, status: { notIn: ["cancelled", "returned"] } },
      _sum: { totalAmount: true },
    }),
    // Revenue last month
    prisma.salesOrder.aggregate({
      where: { orderDate: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ["cancelled", "returned"] } },
      _sum: { totalAmount: true },
    }),
    // Active sales orders
    prisma.salesOrder.count({ where: { status: { in: ["confirmed", "processing", "shipped"] } } }),
    // Open purchase orders
    prisma.purchaseOrder.count({ where: { status: { in: ["draft", "sent", "partial"] } } }),
    // Low stock: stockItems where quantity <= product.reorderLevel
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM stock_items si
      JOIN products p ON p.id = si.product_id
      WHERE si.quantity <= p.reorder_level
      AND p.is_active = true
    `,
    // Open service jobs
    prisma.serviceJob.count({ where: { status: { in: ["received", "diagnosing", "waiting_parts", "in_repair", "ready"] } } }),
    // Pending leave approvals
    prisma.leave.count({ where: { status: "pending" } }),
    // Revenue by day for last 30 days (simplified)
    prisma.salesOrder.groupBy({
      by: ["orderDate"],
      where: { orderDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: { notIn: ["cancelled"] } },
      _sum: { totalAmount: true },
      orderBy: { orderDate: "asc" },
    }),
    // Top 5 products by revenue
    prisma.salesOrderLine.groupBy({
      by: ["productId"],
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    }),
    // Order status breakdown
    prisma.salesOrder.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const revMTD       = Number(totalRevenueMTD._sum.totalAmount ?? 0);
  const revLast      = Number(totalRevenueLastMonth._sum.totalAmount ?? 0);
  const revChange    = revLast > 0 ? (((revMTD - revLast) / revLast) * 100).toFixed(1) : null;
  const lowStockCount = Number(lowStockRaw[0]?.count ?? 0);


  // Enrich top products with names
  const productIds = topProducts.map((p) => p.productId);
  const productNames = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const nameMap = Object.fromEntries(productNames.map((p) => [p.id, p.name]));

  return Response.json({
    success: true,
    data: {
      kpis: {
        revenueMTD:     revMTD,
        revenueChange:  revChange,
        activeOrders,
        openPOs,
        lowStockCount,
        openServiceJobs,
        pendingLeaves,
      },
      revenueChart: revenueByDay.map((r) => ({
        date:    r.orderDate.toISOString().slice(0, 10),
        revenue: Number(r._sum.totalAmount ?? 0),
      })),
      topProducts: topProducts.map((p) => ({
        name:    nameMap[p.productId] ?? `Product #${p.productId}`,
        revenue: Number(p._sum.totalPrice ?? 0),
      })),
      orderStatus: orderStatusBreakdown.map((s) => ({
        status: s.status,
        count:  s._count.id,
      })),
    },
  });
}

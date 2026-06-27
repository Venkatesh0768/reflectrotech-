import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit2, FileText, CheckCircle, Package } from "lucide-react";

export const metadata = { title: "Sales Order Details" };

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-slate", confirmed: "badge-blue", processing: "badge-amber",
  shipped: "badge-blue", delivered: "badge-green", cancelled: "badge-red", returned: "badge-red",
};

export default async function SalesOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: {
        include: {
          product: {
            select: { name: true, sku: true }
          }
        }
      },
      createdBy: { select: { fullName: true } }
    }
  });

  if (!order) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1000 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 className="page-title">{order.orderNumber}</h1>
            <span className={`badge ${STATUS_COLORS[order.status] ?? "badge-slate"}`} style={{ textTransform: "capitalize" }}>
              {order.status}
            </span>
          </div>
          <p className="page-subtitle">
            Customer: <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{order.customer.name}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/sales" className="btn btn-secondary btn-sm">
            <ArrowLeft size={15} /> Back
          </Link>
          {/* <Link href={`/sales/${order.id}/edit`} className="btn btn-primary btn-sm">
            <Edit2 size={15} /> Edit Order
          </Link> */}
        </div>
      </div>

      <div className="grid-3">
        {/* Main Details */}
        <div className="card" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <FileText size={18} color="var(--text-muted)" /> Order Information
          </h3>
          <div className="divider" style={{ margin: 0 }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Order Date</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{new Date(order.orderDate).toLocaleDateString("en-IN")}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Due Date</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{order.dueDate ? new Date(order.dueDate).toLocaleDateString("en-IN") : "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Payment Status</div>
              <div style={{ fontSize: "0.875rem", textTransform: "capitalize" }}>{order.paymentStatus}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Internal Notes</div>
              <div style={{ fontSize: "0.875rem" }}>{order.notes || "—"}</div>
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, marginTop: "1rem" }}>
            <Package size={18} color="var(--text-muted)" /> Line Items
          </h3>
          <div className="table-wrap">
            <table style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Discount</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{line.product.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {line.product.sku}</div>
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(line.quantity)}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(Number(line.unitPrice))}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(line.discount)}%</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmt(Number(line.totalPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>Financial Summary</h3>
            <div className="divider" style={{ margin: 0 }} />

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(Number(order.subtotal))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Discount</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--danger)" }}>-{fmt(Number(order.discountAmount))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Tax</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>+{fmt(Number(order.taxAmount))}</span>
            </div>

            <div className="divider" style={{ margin: 0 }} />

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.125rem" }}>
              <span>Total Amount</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--success)" }}>{fmt(Number(order.totalAmount))}</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "1rem", margin: 0, marginBottom: "1rem" }}>System Audit</h3>
            <div className="divider" style={{ margin: 0, marginBottom: "1rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Created By</div>
                <div style={{ fontSize: "0.875rem" }}>{order.createdBy?.fullName || "System"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Created At</div>
                <div style={{ fontSize: "0.875rem" }}>{new Date(order.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

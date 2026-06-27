import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, MapPin, Truck } from "lucide-react";

export const metadata = { title: "Supplier Profile" };

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      }
    }
  });

  if (!supplier) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1000 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 className="page-title">{supplier.name}</h1>
            <span className={`badge ${supplier.isActive ? "badge-green" : "badge-red"}`}>
              {supplier.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="page-subtitle">
            Contact Person: <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{supplier.contactPerson || "—"}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/suppliers" className="btn btn-secondary btn-sm">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
      </div>

      <div className="grid-3">
        {/* Main Details */}
        <div className="card" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Building2 size={18} color="var(--text-muted)" /> Supplier Information
          </h3>
          <div className="divider" style={{ margin: 0 }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}>
                 Email
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{supplier.email || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}>
                 <Phone size={12}/> Phone
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{supplier.phone || "—"}</div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} /> Address
              </div>
              <div style={{ fontSize: "0.875rem" }}>{supplier.address || "—"}</div>
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, marginTop: "1rem" }}>
            <Truck size={18} color="var(--text-muted)" /> Recent Purchase Orders
          </h3>
          <div className="table-wrap">
            <table style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {supplier.purchaseOrders.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No purchase orders found</td></tr>
                ) : supplier.purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <Link href={`/purchasing/${po.id}`} style={{ fontWeight: 500, color: "var(--primary)", textDecoration: "none" }}>
                        {po.poNumber}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{new Date(po.orderDate).toLocaleDateString("en-IN")}</td>
                    <td><span className="badge badge-slate" style={{ textTransform: "capitalize" }}>{po.status}</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmt(Number(po.totalAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>Legal Information</h3>
            <div className="divider" style={{ margin: 0 }} />

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", alignItems: "center" }}>
              <span>Tax / GST #</span>
              <code style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{supplier.taxNumber || "—"}</code>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "1rem", margin: 0, marginBottom: "1rem" }}>System Audit</h3>
            <div className="divider" style={{ margin: 0, marginBottom: "1rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Supplier ID</div>
                <div style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>SUPP-{supplier.id}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Created At</div>
                <div style={{ fontSize: "0.875rem" }}>{new Date(supplier.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, Receipt } from "lucide-react";

export const metadata = { title: "Customer Profile" };

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      }
    }
  });

  if (!customer) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1000 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 className="page-title">{customer.name}</h1>
            <span className={`badge ${customer.isActive ? "badge-green" : "badge-red"}`}>
              {customer.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="page-subtitle">
            Contact Person: <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{customer.contactPerson || "—"}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/customers" className="btn btn-secondary btn-sm">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
      </div>

      <div className="grid-3">
        {/* Main Details */}
        <div className="card" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <User size={18} color="var(--text-muted)" /> Profile Information
          </h3>
          <div className="divider" style={{ margin: 0 }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}>
                 Email
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{customer.email || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}>
                 <Phone size={12}/> Phone
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{customer.phone || "—"}</div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} /> Address
              </div>
              <div style={{ fontSize: "0.875rem" }}>{customer.address || "—"}</div>
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, marginTop: "1rem" }}>
            <Receipt size={18} color="var(--text-muted)" /> Recent Sales Orders
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
                {customer.salesOrders.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No sales orders found</td></tr>
                ) : customer.salesOrders.map((so) => (
                  <tr key={so.id}>
                    <td>
                      <Link href={`/sales/${so.id}`} style={{ fontWeight: 500, color: "var(--primary)", textDecoration: "none" }}>
                        {so.orderNumber}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{new Date(so.orderDate).toLocaleDateString("en-IN")}</td>
                    <td><span className="badge badge-slate" style={{ textTransform: "capitalize" }}>{so.status}</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmt(Number(so.totalAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>Financial & Legal</h3>
            <div className="divider" style={{ margin: 0 }} />

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", alignItems: "center" }}>
              <span>Credit Limit</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "1.125rem", fontWeight: 600, color: "var(--primary)" }}>{fmt(Number(customer.creditLimit))}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", alignItems: "center" }}>
              <span>Tax / GST #</span>
              <code style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{customer.taxNumber || "—"}</code>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "1rem", margin: 0, marginBottom: "1rem" }}>System Audit</h3>
            <div className="divider" style={{ margin: 0, marginBottom: "1rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Customer ID</div>
                <div style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>CUST-{customer.id}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Created At</div>
                <div style={{ fontSize: "0.875rem" }}>{new Date(customer.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

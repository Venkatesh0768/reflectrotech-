import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit2, Package, CheckCircle, XCircle } from "lucide-react";

export const metadata = { title: "Product Details | Inventory" };

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      unit: true,
      createdBy: { select: { fullName: true } }
    }
  });

  if (!product) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 900 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 className="page-title">{product.name}</h1>
            <span className={`badge ${product.isActive ? "badge-green" : "badge-red"}`}>
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="page-subtitle">SKU: <code style={{ color: "var(--primary)" }}>{product.sku}</code></p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/inventory" className="btn btn-secondary btn-sm">
            <ArrowLeft size={15} /> Back
          </Link>
          <Link href={`/inventory/${product.id}/edit`} className="btn btn-primary btn-sm">
            <Edit2 size={15} /> Edit Product
          </Link>
        </div>
      </div>

      <div className="grid-3">
        {/* Main Details */}
        <div className="card" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Package size={18} color="var(--text-muted)" /> Basic Information
          </h3>
          <div className="divider" style={{ margin: 0 }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Description</div>
              <div style={{ fontSize: "0.875rem" }}>{product.description || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Category</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{product.category?.name || "Uncategorized"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Unit of Measure</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{product.unit ? `${product.unit.name} (${product.unit.symbol})` : "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Serialized Tracking</div>
              <div style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {product.isSerialized ? <CheckCircle size={15} color="var(--success)" /> : <XCircle size={15} color="var(--text-muted)" />}
                {product.isSerialized ? "Yes, tracks individual serial numbers" : "No"}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Rules */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", margin: 0 }}>Pricing & Inventory</h3>
          <div className="divider" style={{ margin: 0 }} />

          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Selling Price</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--success)" }}>{fmt(Number(product.sellingPrice))}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Cost Price</div>
            <div style={{ fontSize: "1rem", fontWeight: 500 }}>{fmt(Number(product.costPrice))}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Reorder Level</div>
            <div style={{ fontSize: "1rem", fontWeight: 500 }}>{product.reorderLevel} units</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", margin: 0, marginBottom: "1rem" }}>System Audit</h3>
        <div className="divider" style={{ margin: 0, marginBottom: "1rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Created By</div>
            <div style={{ fontSize: "0.875rem" }}>{product.createdBy?.fullName || "System"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Created At</div>
            <div style={{ fontSize: "0.875rem" }}>{new Date(product.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Last Updated</div>
            <div style={{ fontSize: "0.875rem" }}>{new Date(product.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional().or(z.literal("")),
  unitId: z.number().int().positive().optional().or(z.literal("")),
  costPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(0),
  isSerialized: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormClientProps {
  initialData?: ProductFormData & { id: number };
  categories: { id: number; name: string }[];
  units: { id: number; name: string; symbol: string }[];
}

export function ProductFormClient({ initialData, categories, units }: ProductFormClientProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || { costPrice: 0, sellingPrice: 0, reorderLevel: 10, isSerialized: false },
  });

  const busy = isSubmitting || isPending;

  async function onSubmit(data: ProductFormData) {
    setServerError("");
    // Clean up empty string IDs to undefined
    const payload = {
      ...data,
      categoryId: data.categoryId === "" ? undefined : data.categoryId,
      unitId: data.unitId === "" ? undefined : data.unitId,
    };

    try {
      const url = initialData ? `/api/products/${initialData.id}` : "/api/products";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.error ?? `Failed to ${initialData ? "update" : "create"} product`);
        return;
      }
      startTransition(() => {
        router.push("/inventory");
        router.refresh();
      });
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 800 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{initialData ? "Edit Product" : "Add Product"}</h1>
          <p className="page-subtitle">{initialData ? `Editing ${initialData.sku}` : "Create a new item in the inventory"}</p>
        </div>
        <Link href="/inventory" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} /> Back to Inventory
        </Link>
      </div>

      {serverError && <div className="alert alert-danger">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label required">SKU (Stock Keeping Unit)</label>
            <input className={`form-input${errors.sku ? " error" : ""}`} placeholder="e.g. PCB-001" {...register("sku")} />
            {errors.sku && <span className="form-error">{errors.sku.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label required">Product Name</label>
            <input className={`form-input${errors.name ? " error" : ""}`} placeholder="e.g. High-Temp Resistor" {...register("name")} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Detailed product description..." {...register("description")} />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" {...register("categoryId", { setValueAs: v => v === "" ? "" : parseInt(v) })}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <span className="form-error">{errors.categoryId.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Unit of Measure</label>
            <select className="form-select" {...register("unitId", { setValueAs: v => v === "" ? "" : parseInt(v) })}>
              <option value="">-- Select Unit --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
            </select>
            {errors.unitId && <span className="form-error">{errors.unitId.message}</span>}
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label required">Cost Price (₹)</label>
            <input type="number" step="0.01" className={`form-input${errors.costPrice ? " error" : ""}`} {...register("costPrice", { valueAsNumber: true })} />
            {errors.costPrice && <span className="form-error">{errors.costPrice.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label required">Selling Price (₹)</label>
            <input type="number" step="0.01" className={`form-input${errors.sellingPrice ? " error" : ""}`} {...register("sellingPrice", { valueAsNumber: true })} />
            {errors.sellingPrice && <span className="form-error">{errors.sellingPrice.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label required">Reorder Level</label>
            <input type="number" className={`form-input${errors.reorderLevel ? " error" : ""}`} {...register("reorderLevel", { valueAsNumber: true })} />
            {errors.reorderLevel && <span className="form-error">{errors.reorderLevel.message}</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
          <input type="checkbox" id="isSerialized" {...register("isSerialized")} style={{ width: 16, height: 16 }} />
          <label htmlFor="isSerialized" className="form-label" style={{ cursor: "pointer", margin: 0 }}>
            This product is serialized (each unit has a unique serial number)
          </label>
        </div>

        <div className="divider" style={{ margin: 0 }} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <Link href="/inventory" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {initialData ? "Update Product" : "Save Product"}</>}
          </button>
        </div>

      </form>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const LineSchema = z.object({
  productId:  z.number().int().positive("Select a product"),
  quantity:   z.number().positive("Must be > 0"),
  unitPrice:  z.number().nonnegative("Must be >= 0"),
  discount:   z.number().min(0).max(100).default(0),
});

const CreateSchema = z.object({
  customerId:     z.number({ required_error: "Select a customer" }).int().positive("Select a customer"),
  orderDate:      z.string().min(1, "Order date is required"),
  dueDate:        z.string().optional().or(z.literal("")),
  taxAmount:      z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  notes:          z.string().optional(),
  lines:          z.array(LineSchema).min(1, "At least one product line is required"),
});

type FormData = z.infer<typeof CreateSchema>;

interface SalesOrderFormClientProps {
  customers: { id: number; name: string }[];
  products: { id: number; name: string; sku: string; sellingPrice: number }[];
}

export function SalesOrderFormClient({ customers, products }: SalesOrderFormClientProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(CreateSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split("T")[0],
      taxAmount: 0,
      discountAmount: 0,
      lines: [{ productId: 0 as any, quantity: 1, unitPrice: 0, discount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const busy = isSubmitting || isPending;

  // Watch values for live calculations
  const watchLines = watch("lines");
  const taxAmount = watch("taxAmount") || 0;
  const discountAmount = watch("discountAmount") || 0;

  // Calculate Subtotal dynamically
  const subtotal = watchLines.reduce((sum, line) => {
    const q = line.quantity || 0;
    const p = line.unitPrice || 0;
    const d = line.discount || 0;
    return sum + (q * p * (1 - d / 100));
  }, 0);

  const total = subtotal - discountAmount + taxAmount;

  // Handle product selection to auto-fill unit price
  const handleProductSelect = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`lines.${index}.unitPrice`, Number(product.sellingPrice));
    }
  };

  async function onSubmit(data: FormData) {
    setServerError("");
    // Clean up dueDate if empty
    const payload = {
      ...data,
      dueDate: data.dueDate === "" ? undefined : data.dueDate,
    };

    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.error ?? "Failed to create order");
        return;
      }
      startTransition(() => {
        router.push("/sales");
        router.refresh();
      });
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  function fmt(n: number) {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 1000 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">New Sales Order</h1>
          <p className="page-subtitle">Create a new order for a customer</p>
        </div>
        <Link href="/sales" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} /> Back to Sales
        </Link>
      </div>

      {serverError && <div className="alert alert-danger">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Top Section: Customer & Dates */}
        <div className="card grid-3">
          <div className="form-group">
            <label className="form-label required">Customer</label>
            <select 
              className={`form-select${errors.customerId ? " error" : ""}`} 
              {...register("customerId", { valueAsNumber: true })}
            >
              <option value="0">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customerId && <span className="form-error">{errors.customerId.message}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label required">Order Date</label>
            <input type="date" className={`form-input${errors.orderDate ? " error" : ""}`} {...register("orderDate")} />
            {errors.orderDate && <span className="form-error">{errors.orderDate.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className={`form-input${errors.dueDate ? " error" : ""}`} {...register("dueDate")} />
            {errors.dueDate && <span className="form-error">{errors.dueDate.message}</span>}
          </div>
        </div>

        {/* Line Items Section */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Line Items
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ productId: 0 as any, quantity: 1, unitPrice: 0, discount: 0 })}>
              <Plus size={14} /> Add Product
            </button>
          </h3>
          
          <div className="table-wrap">
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Product</th>
                  <th style={{ width: "15%" }}>Qty</th>
                  <th style={{ width: "20%" }}>Unit Price (₹)</th>
                  <th style={{ width: "15%" }}>Disc. (%)</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Total</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const q = watchLines[index]?.quantity || 0;
                  const p = watchLines[index]?.unitPrice || 0;
                  const d = watchLines[index]?.discount || 0;
                  const lineTotal = q * p * (1 - d / 100);

                  return (
                    <tr key={field.id}>
                      <td>
                        <select 
                          className={`form-select${errors.lines?.[index]?.productId ? " error" : ""}`}
                          {...register(`lines.${index}.productId`, { valueAsNumber: true })}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setValue(`lines.${index}.productId`, val);
                            handleProductSelect(index, val);
                          }}
                        >
                          <option value="0">-- Select --</option>
                          {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" step="0.01" className={`form-input${errors.lines?.[index]?.quantity ? " error" : ""}`} {...register(`lines.${index}.quantity`, { valueAsNumber: true })} />
                      </td>
                      <td>
                        <input type="number" step="0.01" className={`form-input${errors.lines?.[index]?.unitPrice ? " error" : ""}`} {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })} />
                      </td>
                      <td>
                        <input type="number" step="0.01" max="100" className={`form-input${errors.lines?.[index]?.discount ? " error" : ""}`} {...register(`lines.${index}.discount`, { valueAsNumber: true })} />
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                        {fmt(lineTotal)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => remove(index)} style={{ color: "var(--danger)", padding: 4 }} disabled={fields.length === 1}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {errors.lines?.root && <span className="form-error" style={{ display: "block", marginTop: "0.5rem" }}>{errors.lines.root.message}</span>}
        </div>

        {/* Totals & Notes Section */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="form-group">
              <label className="form-label">Internal Notes (Optional)</label>
              <textarea className="form-textarea" placeholder="Add any special instructions or notes..." rows={4} {...register("notes")} />
            </div>
          </div>

          <div className="card" style={{ width: 350 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Subtotal</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(subtotal)}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-secondary)" }}>Discount (₹)</span>
                <input type="number" step="0.01" className="form-input" style={{ width: 100, textAlign: "right", padding: "0.25rem 0.5rem" }} {...register("discountAmount", { valueAsNumber: true })} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-secondary)" }}>Tax (₹)</span>
                <input type="number" step="0.01" className="form-input" style={{ width: 100, textAlign: "right", padding: "0.25rem 0.5rem" }} {...register("taxAmount", { valueAsNumber: true })} />
              </div>

              <div className="divider" style={{ margin: "0.5rem 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.25rem" }}>
                <span>Total Amount</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--success)" }}>{fmt(total)}</span>
              </div>
            </div>

            <div className="divider" style={{ margin: "1.25rem 0" }} />

            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy || watchLines.length === 0}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Creating Order...</> : <><Save size={16} /> Create Sales Order</>}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

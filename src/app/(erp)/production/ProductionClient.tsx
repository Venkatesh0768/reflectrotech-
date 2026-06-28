"use client";

import { useEffect, useState } from "react";
import { Plus, Factory, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";

type Tab = "Orders" | "BOMs";

export function ProductionClient() {
  const [tab, setTab] = useState<Tab>("Orders");
  const [boms, setBoms] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [bomPage, setBomPage] = useState(1);
  const [bomTotalPages, setBomTotalPages] = useState(1);
  
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);

  async function fetchBoms(p = bomPage) {
    setLoading(true);
    try {
      const res = await fetch(`/api/boms?page=${p}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setBoms(json.data);
        setBomTotalPages(json.meta.pages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders(p = orderPage) {
    setLoading(true);
    try {
      const res = await fetch(`/api/production-orders?page=${p}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setOrderTotalPages(json.meta.pages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBoms();
    fetchOrders();
  }, []);

  async function handleCompleteOrder(id: number) {
    if (!confirm("Are you sure you want to complete this order? Raw materials will be deducted and finished goods will be added to inventory.")) return;
    try {
      const res = await fetch(`/api/production-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Order completed successfully!");
        fetchOrders(orderPage);
      } else {
        alert(data.error || "Failed to complete order.");
      }
    } catch (e) {
      alert("Error completing order");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Production & Manufacturing</h1>
          <p className="page-subtitle">Manage Bill of Materials and Production Orders</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {tab === "BOMs" ? (
            <Link href="/production/boms/new" className="btn btn-primary btn-sm">
              <Plus size={15} /> Create BOM
            </Link>
          ) : (
            <Link href="/production/orders/new" className="btn btn-primary btn-sm">
              <Plus size={15} /> Create Production Order
            </Link>
          )}
        </div>
      </div>

      <div className="tabs">
        {(["Orders", "BOMs"] as Tab[]).map((t) => (
          <button key={t} className={`tab-item${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Orders" && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Finished Product</th>
                  <th>Target Qty</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Factory size={40} className="empty-state-icon" />
                        <h4>No production orders found</h4>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 500 }}>{order.orderNumber}</td>
                      <td>{order.bom?.product?.name || "Unknown"}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{order.targetQuantity}</td>
                      <td>
                        <span className={`badge ${order.status === "completed" ? "badge-green" : order.status === "in_progress" ? "badge-blue" : "badge-slate"}`} style={{ textTransform: "capitalize" }}>
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{new Date(order.startDate).toLocaleDateString("en-IN")}</td>
                      <td>
                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleCompleteOrder(order.id)}>Complete</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={(p) => { setOrderPage(p); fetchOrders(p); }} />
        </>
      )}

      {tab === "BOMs" && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>BOM Name</th>
                  <th>Finished Product</th>
                  <th>Description</th>
                  <th>Items (Raw Materials)</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {loading && boms.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Loading...</td></tr>
                ) : boms.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <ClipboardList size={40} className="empty-state-icon" />
                        <h4>No Bill of Materials found</h4>
                      </div>
                    </td>
                  </tr>
                ) : (
                  boms.map((bom) => (
                    <tr key={bom.id}>
                      <td style={{ fontWeight: 500 }}>{bom.name}</td>
                      <td>{bom.product?.name || "Unknown"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{bom.description || "—"}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {bom.lines?.map((l: any) => (
                            <span key={l.id} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                              • {l.rawMaterial?.name} ({l.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{new Date(bom.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={bomPage} totalPages={bomTotalPages} onPageChange={(p) => { setBomPage(p); fetchBoms(p); }} />
        </>
      )}
    </div>
  );
}

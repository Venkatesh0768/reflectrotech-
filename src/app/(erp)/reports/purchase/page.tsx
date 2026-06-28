"use client";

import { ReportClient } from "@/components/ui/ReportClient";

export default function PurchaseReportPage() {
  const columns = [
    { key: "poNumber", label: "PO #" },
    { key: "supplier", label: "Supplier", render: (val: any) => val?.name || "—" },
    { key: "status", label: "Status" },
    { key: "orderDate", label: "Date", render: (val: string) => new Date(val).toLocaleDateString("en-IN") },
    { key: "totalAmount", label: "Total (₹)" },
  ];

  const formatExportData = (data: any[]) => {
    return data.map((item) => ({
      "PO Number": item.poNumber,
      "Supplier": item.supplier?.name || "",
      "Status": item.status,
      "Date": new Date(item.orderDate).toLocaleDateString("en-IN"),
      "Total Amount": item.totalAmount,
    }));
  };

  return (
    <ReportClient
      title="Purchase Report"
      subtitle="Overview of all purchase orders"
      endpoint="/api/purchase-orders"
      columns={columns}
      formatExportData={formatExportData}
    />
  );
}

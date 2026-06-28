"use client";

import { ReportClient } from "@/components/ui/ReportClient";

export default function SalesReportPage() {
  const columns = [
    { key: "orderNumber", label: "Order #" },
    { key: "customer", label: "Customer", render: (val: any) => val?.name || "—" },
    { key: "status", label: "Status" },
    { key: "orderDate", label: "Date", render: (val: string) => new Date(val).toLocaleDateString("en-IN") },
    { key: "totalAmount", label: "Total (₹)" },
  ];

  const formatExportData = (data: any[]) => {
    return data.map((item) => ({
      "Order Number": item.orderNumber,
      "Customer": item.customer?.name || "",
      "Status": item.status,
      "Date": new Date(item.orderDate).toLocaleDateString("en-IN"),
      "Total Amount": item.totalAmount,
    }));
  };

  return (
    <ReportClient
      title="Sales Report"
      subtitle="Overview of all sales orders"
      endpoint="/api/sales-orders"
      columns={columns}
      formatExportData={formatExportData}
    />
  );
}

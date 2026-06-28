"use client";

import { ReportClient } from "@/components/ui/ReportClient";

export default function FinanceReportPage() {
  const columns = [
    { key: "referenceType", label: "Type", render: (val: string) => val === "sales_order" ? "Receipt" : "Payment" },
    { key: "amount", label: "Amount (₹)" },
    { key: "method", label: "Method", render: (val: string) => val.replace("_", " ") },
    { key: "paidAt", label: "Date", render: (val: string) => new Date(val).toLocaleDateString("en-IN") },
  ];

  const formatExportData = (data: any[]) => {
    return data.map((item) => ({
      "Type": item.referenceType === "sales_order" ? "Receipt" : "Payment",
      "Amount": item.amount,
      "Method": item.method,
      "Date": new Date(item.paidAt).toLocaleDateString("en-IN"),
      "Notes": item.notes || "",
    }));
  };

  return (
    <ReportClient
      title="Finance Report"
      subtitle="Payments and receipts ledger"
      endpoint="/api/payments"
      columns={columns}
      formatExportData={formatExportData}
    />
  );
}

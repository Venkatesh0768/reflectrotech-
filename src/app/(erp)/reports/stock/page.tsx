"use client";

import { ReportClient } from "@/components/ui/ReportClient";

export default function StockReportPage() {
  const columns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Product Name" },
    { key: "category", label: "Category", render: (val: any) => val?.name || "—" },
    { key: "costPrice", label: "Cost (₹)" },
    { key: "sellingPrice", label: "Selling Price (₹)" },
  ];

  const formatExportData = (data: any[]) => {
    return data.map((item) => ({
      "SKU": item.sku,
      "Product Name": item.name,
      "Category": item.category?.name || "",
      "Cost Price": item.costPrice,
      "Selling Price": item.sellingPrice,
    }));
  };

  return (
    <ReportClient
      title="Stock Report"
      subtitle="Inventory product analysis"
      endpoint="/api/products"
      columns={columns}
      formatExportData={formatExportData}
    />
  );
}

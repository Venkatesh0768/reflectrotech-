"use client";

import { ReportClient } from "@/components/ui/ReportClient";

export default function ServiceReportPage() {
  const columns = [
    { key: "jobNumber", label: "Job #" },
    { key: "customer", label: "Customer", render: (val: any) => val?.name || "—" },
    { key: "deviceName", label: "Device" },
    { key: "status", label: "Status", render: (val: string) => val.replace("_", " ") },
    { key: "receivedAt", label: "Received", render: (val: string) => new Date(val).toLocaleDateString("en-IN") },
  ];

  const formatExportData = (data: any[]) => {
    return data.map((item) => ({
      "Job Number": item.jobNumber,
      "Customer": item.customer?.name || "",
      "Device Name": item.deviceName,
      "Device Model": item.deviceModel || "",
      "Status": item.status,
      "Received Date": new Date(item.receivedAt).toLocaleDateString("en-IN"),
      "Estimated Cost": item.estimatedCost || "0",
    }));
  };

  return (
    <ReportClient
      title="Service Jobs Report"
      subtitle="Analysis of all service and repair jobs"
      endpoint="/api/service-jobs"
      columns={columns}
      formatExportData={formatExportData}
    />
  );
}

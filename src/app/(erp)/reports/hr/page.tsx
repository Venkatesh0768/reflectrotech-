"use client";

import { ReportClient } from "@/components/ui/ReportClient";

export default function HRReportPage() {
  const columns = [
    { key: "profile", label: "Name", render: (val: any) => val?.fullName || "—" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "joinDate", label: "Join Date", render: (val: string) => new Date(val).toLocaleDateString("en-IN") },
    { key: "baseSalary", label: "Base Salary (₹)" },
  ];

  const formatExportData = (data: any[]) => {
    return data.map((item) => ({
      "Name": item.profile?.fullName || "",
      "Email": item.profile?.email || "",
      "Department": item.department,
      "Designation": item.designation,
      "Join Date": new Date(item.joinDate).toLocaleDateString("en-IN"),
      "Base Salary": item.baseSalary,
    }));
  };

  return (
    <ReportClient
      title="HR Report"
      subtitle="Employee directory and salary analysis"
      endpoint="/api/employees"
      columns={columns}
      formatExportData={formatExportData}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";
import { Pagination } from "@/components/ui/Pagination";

interface Column {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface ReportClientProps {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: Column[];
  formatExportData: (data: any[]) => any[];
}

export function ReportClient({ title, subtitle, endpoint, columns, formatExportData }: ReportClientProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchData(p = page) {
    setLoading(true);
    try {
      const res = await fetch(`${endpoint}?page=${p}&limit=50`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.meta) setTotalPages(json.meta.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleExport() {
    try {
      // Fetch all data for export if possible, or just export current page if backend doesn't support massive limits
      // For simplicity, we fetch a large limit for export
      const res = await fetch(`${endpoint}?limit=1000`);
      const json = await res.json();
      if (json.success) {
        const formatted = formatExportData(json.data);
        exportToExcel(formatted, `${title.replace(/\s+/g, "_")}_Export`);
      }
    } catch (err) {
      alert("Failed to export data");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleExport}>
          <Download size={15} /> Export to Excel
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j}>
                      <div style={{ height: 14, background: "var(--surface-3)", borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchData(p); }} />
    </div>
  );
}

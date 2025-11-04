import { Download } from "lucide-react";
import { Button } from "./ui/button";
import { exportToCSV } from "../lib/csv-export";

interface DataTableProps {
  data: any[];
  title?: string;
  downloadFilename?: string;
  maxHeight?: string;
}

export function DataTable({
  data,
  title,
  downloadFilename = "data",
  maxHeight = "600px",
}: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-accent/40 border border-border rounded-lg p-8 text-center">
        <p className="text-foreground/60">No data available</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const handleDownload = () => {
    exportToCSV(data, downloadFilename, columns);
  };

  return (
    <div className="bg-accent/40 border border-border rounded-lg overflow-hidden">
      {(title || downloadFilename) && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="bg-accent/60 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border"
                >
                  {formatColumnName(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-accent/40 transition-colors border-b border-border/50"
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="px-4 py-3 text-sm text-foreground/80"
                  >
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-accent/20 border-t border-border text-sm text-foreground/60 text-center">
        Showing {data.length} {data.length === 1 ? "row" : "rows"}
      </div>
    </div>
  );
}

function formatColumnName(column: string): string {
  return column
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();
}

function formatCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-foreground/40">—</span>;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? (
      value.join(", ")
    ) : (
      <span className="text-foreground/40">—</span>
    );
  }

  if (typeof value === "object") {
    return (
      <span className="text-xs bg-accent/60 px-2 py-1 rounded">
        {JSON.stringify(value)}
      </span>
    );
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 underline"
      >
        {value.length > 50 ? `${value.substring(0, 50)}...` : value}
      </a>
    );
  }

  const stringValue = String(value);
  return stringValue.length > 100
    ? `${stringValue.substring(0, 100)}...`
    : stringValue;
}

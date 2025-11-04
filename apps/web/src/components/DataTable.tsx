import { Download, Settings2, X } from "lucide-react";
import { Button } from "./ui/button";
import { exportToCSV } from "../lib/csv-export";
import { useState, useEffect } from "react";

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
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];

  // Initialize selected columns to all columns on first render only
  useEffect(() => {
    if (allColumns.length > 0 && !initialized) {
      setSelectedColumns(allColumns);
      setInitialized(true);
    }
  }, [allColumns.length, initialized]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-4">
          <Settings2 className="w-8 h-8 text-cyan-400/60" />
        </div>
        <p className="text-foreground/60 text-sm sm:text-base">
          No data available
        </p>
      </div>
    );
  }

  const visibleColumns =
    selectedColumns.length > 0 ? selectedColumns : allColumns;

  // Filter out rows where all selected columns are null/empty
  const filteredData = data.filter((row) => {
    return visibleColumns.some((column) => {
      const value = row[column];
      return value !== null && value !== undefined && value !== "";
    });
  });

  const handleDownload = () => {
    exportToCSV(filteredData, downloadFilename, visibleColumns);
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(allColumns);
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  return (
    <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl overflow-hidden">
      {(title || downloadFilename) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-border bg-accent/20">
          {title && (
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
              {title}
            </h3>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              variant="outline"
              size="sm"
              className={`text-xs sm:text-sm ${showColumnSelector ? "bg-accent border-cyan-500/40" : ""}`}
            >
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              disabled={selectedColumns.length === 0}
              className="text-xs sm:text-sm"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Download CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </div>
      )}

      {showColumnSelector && (
        <div className="bg-accent/60 backdrop-blur-sm border-b border-border p-3 sm:p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-cyan-400" />
              Select Columns
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={selectAllColumns}
                className="text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded hover:bg-cyan-500/10"
              >
                Select All
              </button>
              <span className="text-foreground/40">|</span>
              <button
                onClick={deselectAllColumns}
                className="text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded hover:bg-cyan-500/10"
              >
                Deselect All
              </button>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="ml-2 p-1.5 text-foreground/60 hover:text-foreground hover:bg-accent/60 rounded transition-colors"
                aria-label="Close column selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {allColumns.map((column, index) => (
              <label
                key={column}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent/40 p-2 rounded-lg transition-all duration-200 animate-in fade-in-0 slide-in-from-left-2"
                style={{
                  animationDelay: `${index * 20}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                  className="w-4 h-4 rounded border-border bg-background/40 text-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-sm truncate">
                  {formatColumnName(column)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div
        className="overflow-x-auto overflow-y-auto custom-scrollbar"
        style={{ maxHeight }}
      >
        <table className="w-full min-w-[600px]">
          <thead className="bg-accent/60 backdrop-blur-sm sticky top-0 z-10">
            <tr className="border-b-2 border-cyan-500/20">
              {visibleColumns.map((column) => (
                <th
                  key={column}
                  className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-foreground/90 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6 whitespace-nowrap"
                >
                  {formatColumnName(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-accent/40 transition-all duration-200 border-b border-border/50 last:border-0 group animate-in fade-in-0 slide-in-from-bottom-2"
                style={{
                  animationDelay: `${Math.min(rowIndex * 30, 300)}ms`,
                  animationFillMode: "backwards",
                }}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-foreground/80 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6 group-hover:text-foreground transition-colors"
                  >
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 sm:p-4 bg-accent/20 backdrop-blur-sm border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-foreground/60">
          <div className="flex items-center justify-center gap-1">
            <span className="font-semibold text-foreground/80">
              {filteredData.length}
            </span>
            <span>{filteredData.length === 1 ? "row" : "rows"}</span>
          </div>
          {filteredData.length < data.length && (
            <span className="text-foreground/40 text-center">
              • {data.length - filteredData.length} hidden with empty values
            </span>
          )}
          {selectedColumns.length < allColumns.length && (
            <span className="text-cyan-400/80 text-center">
              • {selectedColumns.length} of {allColumns.length} columns visible
            </span>
          )}
        </div>
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

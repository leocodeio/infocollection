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
      <div className="bg-accent/40 border border-border rounded-lg p-8 text-center">
        <p className="text-foreground/60">No data available</p>
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
    <div className="bg-accent/40 border border-border rounded-lg overflow-hidden">
      {(title || downloadFilename) && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <div className="flex gap-2 ml-auto">
            <Button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              variant="outline"
              size="sm"
              className={showColumnSelector ? "bg-accent" : ""}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Columns
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              disabled={selectedColumns.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>
      )}

      {showColumnSelector && (
        <div className="bg-accent/60 border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Select Columns</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllColumns}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Select All
              </button>
              <span className="text-foreground/40">|</span>
              <button
                onClick={deselectAllColumns}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Deselect All
              </button>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="ml-2 text-foreground/60 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allColumns.map((column) => (
              <label
                key={column}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent/40 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                  className="w-4 h-4 rounded border-border bg-background/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <span className="text-sm">{formatColumnName(column)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="bg-accent/60 sticky top-0">
            <tr>
              {visibleColumns.map((column) => (
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
            {filteredData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-accent/40 transition-colors border-b border-border/50"
              >
                {visibleColumns.map((column) => (
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
        Showing {filteredData.length}{" "}
        {filteredData.length === 1 ? "row" : "rows"}
        {filteredData.length < data.length && (
          <span className="ml-2 text-foreground/40">
            ({data.length - filteredData.length} hidden with empty values)
          </span>
        )}
        {selectedColumns.length < allColumns.length && (
          <span className="ml-2">
            ({selectedColumns.length} of {allColumns.length} columns visible)
          </span>
        )}
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

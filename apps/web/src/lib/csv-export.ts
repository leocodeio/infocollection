/**
 * Convert data to CSV format and trigger download
 */
export function exportToCSV(
  data: any[],
  filename: string,
  headers?: string[],
): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Extract headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(csvHeaders.map((header) => escapeCSVValue(header)).join(","));

  // Add data rows
  for (const row of data) {
    const values = csvHeaders.map((header) => {
      const value = row[header];
      return escapeCSVValue(value);
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Escape CSV value to handle special characters
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Convert arrays and objects to JSON string
  if (Array.isArray(value)) {
    value = value.join("; ");
  } else if (typeof value === "object") {
    value = JSON.stringify(value);
  } else {
    value = String(value);
  }

  // Escape double quotes and wrap in quotes if contains special characters
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    value = `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Flatten nested query results for CSV export
 */
export function flattenQueryResults(results: any[]): any[] {
  return results.map((result) => {
    // Parse data if it's a string
    let parsedData = result;
    if (typeof result === "string") {
      try {
        parsedData = JSON.parse(result);
      } catch {
        parsedData = result;
      }
    }

    // Flatten nested objects
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(parsedData)) {
      if (Array.isArray(value)) {
        flattened[key] = value.join("; ");
      } else if (typeof value === "object" && value !== null) {
        // For nested objects, create dot notation keys
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          flattened[`${key}.${nestedKey}`] = nestedValue;
        }
      } else {
        flattened[key] = value;
      }
    }

    return flattened;
  });
}

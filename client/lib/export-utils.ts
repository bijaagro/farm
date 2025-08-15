export interface ExportColumn<T = any> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, row: T) => string;
}

export interface ExportConfig<T = any> {
  filename: string;
  columns: ExportColumn<T>[];
  data: T[];
}

/**
 * Escapes CSV values to handle quotes and commas properly
 */
const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (
    stringValue.includes('"') ||
    stringValue.includes(",") ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Gets the value from an object using a key path (supports nested keys like 'user.name')
 */
const getNestedValue = (obj: any, key: string): any => {
  return key.split(".").reduce((current, prop) => current?.[prop], obj);
};

/**
 * Exports data to CSV format
 */
export const exportToCSV = <T = any>(config: ExportConfig<T>): void => {
  try {
    const { filename, columns, data } = config;

    // Create headers
    const headers = columns.map((col) => col.header);

    // Create rows
    const rows = data.map((row) => {
      return columns.map((col) => {
        let value: any;

        if (typeof col.key === "string" && col.key.includes(".")) {
          value = getNestedValue(row, col.key);
        } else {
          value = (row as any)[col.key];
        }

        // Apply custom formatter if provided
        if (col.formatter) {
          value = col.formatter(value, row);
        }

        return escapeCsvValue(value);
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("CSV export error:", error);
    throw new Error("Failed to export CSV file");
  }
};

/**
 * Exports data to JSON format
 */
export const exportToJSON = <T = any>(config: ExportConfig<T>): void => {
  try {
    const { filename, data } = config;

    const jsonContent = JSON.stringify(data, null, 2);

    // Create and download file
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename.replace(".csv", ".json"));
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("JSON export error:", error);
    throw new Error("Failed to export JSON file");
  }
};

/**
 * Creates a filename with current date
 */
export const createExportFilename = (
  prefix: string,
  extension: string = "csv",
): string => {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}-${date}.${extension}`;
};

/**
 * Common formatters for different data types
 */
export const formatters = {
  date: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  },

  currency: (
    value: any,
    locale: string = "en-IN",
    currency: string = "INR",
  ) => {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(Number(value));
  },

  boolean: (value: any) => {
    if (value === null || value === undefined) return "";
    return value ? "Yes" : "No";
  },

  capitalize: (value: any) => {
    if (!value) return "";
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  },

  replaceUnderscore: (value: any) => {
    if (!value) return "";
    return String(value).replace(/_/g, " ");
  },
};

import { ExportConfig, formatters, createExportFilename } from "./export-utils";
import { ExpenseRecord } from "@shared/expense-types";
import { AnimalRecord } from "@shared/animal-types";

// Task interface (copied from WorkTracker to avoid import issues)
interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  taskType: string;
  priority: string;
  status: string;
  dueDate: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Export configuration for expense records
 */
export const createExpenseExportConfig = (): Omit<
  ExportConfig<ExpenseRecord>,
  "data"
> => ({
  filename: createExportFilename("bija-expenses"),
  columns: [
    { key: "date", header: "Date" },
    { key: "type", header: "Type" },
    { key: "description", header: "Description" },
    {
      key: "amount",
      header: "Amount",
      formatter: (value) => formatters.currency(value),
    },
    { key: "paidBy", header: "Paid By" },
    { key: "category", header: "Category" },
    { key: "subCategory", header: "Sub-Category" },
    { key: "source", header: "Source" },
    { key: "notes", header: "Notes" },
  ],
});

/**
 * Export configuration for task records
 */
export const createTaskExportConfig = (): Omit<ExportConfig<Task>, "data"> => ({
  filename: createExportFilename("bija-tasks"),
  columns: [
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
    {
      key: "category",
      header: "Category",
      formatter: (value) =>
        formatters.replaceUnderscore(formatters.capitalize(value)),
    },
    {
      key: "taskType",
      header: "Task Type",
      formatter: (value) =>
        formatters.replaceUnderscore(formatters.capitalize(value)),
    },
    { key: "priority", header: "Priority", formatter: formatters.capitalize },
    {
      key: "status",
      header: "Status",
      formatter: (value) =>
        formatters.replaceUnderscore(formatters.capitalize(value)),
    },
    { key: "dueDate", header: "Due Date", formatter: formatters.date },
    { key: "assignedTo", header: "Assigned To" },
    { key: "notes", header: "Notes" },
    { key: "createdAt", header: "Created Date", formatter: formatters.date },
    {
      key: "completedAt",
      header: "Completed Date",
      formatter: (value) => (value ? formatters.date(value) : ""),
    },
  ],
});

/**
 * Export configuration for animal records
 */
export const createAnimalExportConfig = (): Omit<
  ExportConfig<AnimalRecord>,
  "data"
> => ({
  filename: createExportFilename("bija-animals"),
  columns: [
    { key: "name", header: "Name" },
    { key: "type", header: "Type", formatter: formatters.capitalize },
    { key: "breed", header: "Breed" },
    { key: "gender", header: "Gender", formatter: formatters.capitalize },
    { key: "dateOfBirth", header: "Date of Birth", formatter: formatters.date },
    { key: "currentWeight", header: "Current Weight (kg)" },
    {
      key: "status",
      header: "Status",
      formatter: (value) => {
        const statusMap: Record<string, string> = {
          active: "Active",
          sold: "Sold",
          ready_to_sell: "Ready to Sell",
          dead: "Dead",
        };
        return statusMap[value] || formatters.capitalize(value);
      },
    },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      formatter: (value) => (value ? formatters.currency(value) : ""),
    },
    {
      key: "salePrice",
      header: "Sale Price",
      formatter: (value) => (value ? formatters.currency(value) : ""),
    },
    {
      key: "purchaseDate",
      header: "Purchase Date",
      formatter: formatters.date,
    },
    { key: "saleDate", header: "Sale Date", formatter: formatters.date },
    { key: "deathDate", header: "Death Date", formatter: formatters.date },
    { key: "markings", header: "Markings" },
    { key: "createdAt", header: "Created Date", formatter: formatters.date },
  ],
});

/**
 * Generic export configuration creator for custom data types
 */
export const createCustomExportConfig = <T = any>(
  filename: string,
  columns: Array<{
    key: keyof T | string;
    header: string;
    formatter?: (value: any, row: T) => string;
  }>,
): Omit<ExportConfig<T>, "data"> => ({
  filename: createExportFilename(filename),
  columns,
});

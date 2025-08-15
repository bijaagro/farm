import { ExpenseRecord, CategoryManagementData } from "@shared/expense-types";
import { apiGet, apiPost, apiPut, apiDelete, apiCall } from "./api-config";

// Get all expenses
export const fetchExpenses = async (): Promise<ExpenseRecord[]> => {
  const data = await apiGet("/expenses");
  console.log("API Response - Total records:", data.length);
  console.log(
    "API Response - Max ID:",
    Math.max(...data.map((item: any) => parseInt(item.id) || 0)),
  );
  console.log(
    "API Response - Has ID 321:",
    data.some((item: any) => item.id === "321"),
  );

  // Debug first few dates
  console.log(
    "First 3 dates from API:",
    data.slice(0, 3).map((item: any) => ({
      id: item.id,
      originalDate: item.date,
      parsedDate: new Date(item.date).toLocaleDateString("en-US"),
    })),
  );

  return data;
};

// Add new expense
export const createExpense = async (
  expense: Omit<ExpenseRecord, "id">,
): Promise<ExpenseRecord> => {
  return apiPost("/expenses", expense);
};

// Update existing expense
export const updateExpense = async (
  id: string,
  expense: ExpenseRecord,
): Promise<ExpenseRecord> => {
  return apiPut(`/expenses/${id}`, expense);
};

// Delete expense
export const deleteExpense = async (id: string): Promise<void> => {
  return apiDelete(`/expenses/${id}`);
};

// Import multiple expenses
export const importExpenses = async (
  expenses: ExpenseRecord[],
): Promise<{ message: string; count: number }> => {
  return apiPost("/expenses/import", expenses);
};

// Bulk delete expenses
export const bulkDeleteExpenses = async (
  ids: string[],
): Promise<{ message: string; deletedCount: number }> => {
  return apiPost("/expenses/bulk-delete", { ids });
};

// Create backup
export const createBackup = async (): Promise<Blob> => {
  const response = await apiCall("/expenses/backup");
  return response.blob();
};

// Category Management
export const fetchCategories = async (): Promise<CategoryManagementData> => {
  return apiGet("/expenses/categories");
};

export const saveCategories = async (
  data: CategoryManagementData,
): Promise<void> => {
  await apiPost("/expenses/categories", data);
};

export const populateCategories = async (): Promise<{
  message: string;
  count: number;
  categories: CategoryManagementData;
}> => {
  return apiPost("/expenses/populate-categories", {});
};

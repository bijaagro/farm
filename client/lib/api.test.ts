import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import API functions
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  exportToCSV,
  fetchCategories,
  saveCategories,
} from "./api";

describe("Client API Functions", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Expense API Functions", () => {
    it("fetchExpenses should make GET request to correct endpoint", async () => {
      const mockExpenses = [
        {
          id: "1",
          date: "2024-01-15",
          type: "Expense",
          description: "Test expense",
          amount: 100,
          paidBy: "Test User",
          category: "Test Category",
          subCategory: "Test Sub",
          source: "Test Source",
          notes: "Test notes",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExpenses,
      });

      const result = await fetchExpenses();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/expenses?t="),
      );
      expect(result).toEqual(mockExpenses);
    });

    it("createExpense should make POST request with correct data", async () => {
      const newExpense = {
        date: "2024-01-15",
        type: "Expense" as const,
        description: "New test expense",
        amount: 150,
        paidBy: "Test User",
        category: "Test Category",
        subCategory: "Test Sub",
        source: "Test Source",
        notes: "Test notes",
      };

      const mockCreatedExpense = { ...newExpense, id: "123" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedExpense,
      });

      const result = await createExpense(newExpense);

      expect(mockFetch).toHaveBeenCalledWith("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      });
      expect(result).toEqual(mockCreatedExpense);
    });

    it("updateExpense should make PUT request with correct data", async () => {
      const updatedExpense = {
        id: "123",
        date: "2024-01-15",
        type: "Expense" as const,
        description: "Updated test expense",
        amount: 200,
        paidBy: "Test User",
        category: "Test Category",
        subCategory: "Test Sub",
        source: "Test Source",
        notes: "Updated notes",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedExpense,
      });

      const result = await updateExpense("123", updatedExpense);

      expect(mockFetch).toHaveBeenCalledWith("/api/expenses/123", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedExpense),
      });
      expect(result).toEqual(updatedExpense);
    });

    it("deleteExpense should make DELETE request to correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteExpense("123");

      expect(mockFetch).toHaveBeenCalledWith("/api/expenses/123", {
        method: "DELETE",
      });
    });

    it("should handle API errors correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchExpenses()).rejects.toThrow("Failed to fetch expenses");
    });
  });

  describe("Category API Functions", () => {
    it("fetchCategories should make GET request to categories endpoint", async () => {
      const mockCategories = {
        categories: [
          {
            id: "1",
            name: "Test Category",
            subCategories: ["Sub1", "Sub2"],
            createdAt: "2024-01-15T00:00:00Z",
          },
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const result = await fetchCategories();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/expenses/categories?t="),
      );
      expect(result).toEqual(mockCategories);
    });

    it("saveCategories should make POST request with category data", async () => {
      const categoryData = {
        categories: [
          {
            id: "1",
            name: "Test Category",
            subCategories: ["Sub1", "Sub2"],
            createdAt: "2024-01-15T00:00:00Z",
          },
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await saveCategories(categoryData);

      expect(mockFetch).toHaveBeenCalledWith("/api/expenses/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error when fetch fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchExpenses()).rejects.toThrow("Network error");
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchExpenses()).rejects.toThrow("Failed to fetch expenses");
    });
  });
});

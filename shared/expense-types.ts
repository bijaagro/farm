export interface ExpenseRecord {
  id: string;
  date: date;
  type: "Expense" | "Income";
  description: string;
  amount: number;
  paidBy: string;
  category: string;
  subCategory: string;
  source: string;
  notes: string;
}

export interface ExpenseFormData {
  date: date;
  type: "Expense" | "Income";
  description: string;
  amount: string;
  paidBy: string;
  category: string;
  subCategory: string;
  source: string;
  notes: string;
}

export interface ExpenseFilters {
  search: string;
  type: string;
  category: string;
  paidBy: string;
  source: string;
  dateFrom: string;
  dateTo: string;
}

export interface ExpenseSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryChartData {
  category: string;
  amount: number;
  count: number;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryConfig {
  id: string;
  name: string;
  subCategories: string[];
  createdAt: string;
}

export interface CategoryManagementData {
  categories: CategoryConfig[];
  lastUpdated: string;
}

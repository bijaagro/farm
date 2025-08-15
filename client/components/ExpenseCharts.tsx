import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExpenseRecord,
  CategoryChartData,
  MonthlyChartData,
} from "@shared/expense-types";

interface ExpenseChartsProps {
  expenses: ExpenseRecord[];
}

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#84CC16",
  "#6366F1",
];

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Category breakdown for expenses (filter out invalid records)
  const expenseCategoryData: CategoryChartData[] = useMemo(() => {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenses
      .filter(
        (expense) =>
          expense.type === "Expense" &&
          expense.amount > 0 &&
          expense.description &&
          expense.description.trim() !== "" &&
          expense.description !== "No description" &&
          expense.category !== "Other",
      )
      .forEach((expense) => {
        const existing = categoryMap.get(expense.category) || {
          amount: 0,
          count: 0,
        };
        categoryMap.set(expense.category, {
          amount: existing.amount + expense.amount,
          count: existing.count + 1,
        });
      });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Monthly expenses tracking (last 12 months)
  const monthlyData: MonthlyChartData[] = useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    // Calculate date range for last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expense.type === "Expense" &&
          expenseDate >= twelveMonthsAgo &&
          expense.amount > 0 &&
          expense.description &&
          expense.description.trim() !== "" &&
          expense.description !== "No description"
        );
      })
      .forEach((expense) => {
        const month = new Date(expense.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });

        const existing = monthMap.get(month) || { income: 0, expenses: 0 };
        existing.expenses += expense.amount;
        monthMap.set(month, existing);
      });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
      }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
      );
  }, [expenses]);

  // Top spending categories for pie chart
  const topCategories = expenseCategoryData.slice(0, 8);
  const otherCategories = expenseCategoryData.slice(8);
  const pieData = [
    ...topCategories,
    ...(otherCategories.length > 0
      ? [
          {
            category: "Other",
            amount: otherCategories.reduce((sum, cat) => sum + cat.amount, 0),
            count: otherCategories.reduce((sum, cat) => sum + cat.count, 0),
          },
        ]
      : []),
  ];

  // Sub-category breakdown by category
  const subCategoryData = useMemo(() => {
    const categorySubMap = new Map<
      string,
      Map<string, { amount: number; count: number }>
    >();

    expenses
      .filter(
        (expense) =>
          expense.type === "Expense" &&
          expense.amount > 0 &&
          expense.description &&
          expense.description.trim() !== "" &&
          expense.description !== "No description" &&
          expense.category !== "Other" &&
          expense.subCategory &&
          expense.subCategory.trim() !== "",
      )
      .forEach((expense) => {
        if (!categorySubMap.has(expense.category)) {
          categorySubMap.set(expense.category, new Map());
        }

        const subMap = categorySubMap.get(expense.category)!;
        const existing = subMap.get(expense.subCategory) || {
          amount: 0,
          count: 0,
        };
        subMap.set(expense.subCategory, {
          amount: existing.amount + expense.amount,
          count: existing.count + 1,
        });
      });

    // Convert to array format for charts
    const result: {
      category: string;
      subCategories: {
        subCategory: string;
        amount: number;
        count: number;
        fill: string;
      }[];
    }[] = [];

    Array.from(categorySubMap.entries()).forEach(
      ([category, subMap], categoryIndex) => {
        const subCategories = Array.from(subMap.entries())
          .map(([subCategory, data], subIndex) => ({
            subCategory,
            amount: data.amount,
            count: data.count,
            fill: COLORS[(categoryIndex * 3 + subIndex) % COLORS.length],
          }))
          .sort((a, b) => b.amount - a.amount);

        if (subCategories.length > 0) {
          result.push({ category, subCategories });
        }
      },
    );

    return result.sort((a, b) => {
      const totalA = a.subCategories.reduce((sum, sub) => sum + sub.amount, 0);
      const totalB = b.subCategories.reduce((sum, sub) => sum + sub.amount, 0);
      return totalB - totalA;
    });
  }, [expenses]);

  // State for selected category in sub-category breakdown
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.category}</p>
          <p>Amount: {formatCurrency(data.amount)}</p>
          <p>Transactions: {data.count}</p>
          <p>
            Percentage:{" "}
            {(
              (data.amount /
                expenseCategoryData.reduce((sum, cat) => sum + cat.amount, 0)) *
              100
            ).toFixed(1)}
            %
          </p>
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-slate-500">No data available for charts</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Expenses Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses Tracking</CardTitle>
          <CardDescription>
            Track your spending patterns over the last 12 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={formatCurrency}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Categories Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>
            Breakdown of your spending categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="amount"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sub-Category Breakdown by Category */}
      {subCategoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sub-Category Breakdown by Category</CardTitle>
            <CardDescription>
              Select a category to view its sub-category breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Category Selection Dropdown */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-slate-700 min-w-fit">
                  Select Category:
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Choose a category to view breakdown" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategoryData.map((categoryData) => (
                      <SelectItem
                        key={categoryData.category}
                        value={categoryData.category}
                      >
                        {categoryData.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Category Breakdown */}
              {selectedCategory &&
                (() => {
                  const categoryData = subCategoryData.find(
                    (data) => data.category === selectedCategory,
                  );

                  if (!categoryData) return null;

                  const totalCategoryAmount = categoryData.subCategories.reduce(
                    (sum, sub) => sum + sub.amount,
                    0,
                  );

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800 text-lg">
                          {categoryData.category}
                        </h4>
                        <span className="text-lg text-slate-600 font-medium">
                          {formatCurrency(totalCategoryAmount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <div>
                          <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                              <Pie
                                data={categoryData.subCategories}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ subCategory, amount }) => {
                                  const percentage =
                                    (amount / totalCategoryAmount) * 100;
                                  return percentage > 5
                                    ? `${subCategory} ${percentage.toFixed(0)}%`
                                    : "";
                                }}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="amount"
                              >
                                {categoryData.subCategories.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.fill}
                                    />
                                  ),
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(value: number, name: string) => [
                                  formatCurrency(value),
                                  "Amount",
                                ]}
                                labelFormatter={(label) => `${label}`}
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #ccc",
                                  borderRadius: "8px",
                                  boxShadow:
                                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend and Details */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-slate-700 text-sm uppercase tracking-wider">
                            Sub-Category Breakdown
                          </h5>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {categoryData.subCategories
                              .sort((a, b) => b.amount - a.amount)
                              .map((sub, index) => {
                                const percentage =
                                  (sub.amount / totalCategoryAmount) * 100;
                                return (
                                  <div
                                    key={sub.subCategory}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: sub.fill }}
                                      />
                                      <div className="min-w-0">
                                        <div className="font-medium text-slate-800 text-sm truncate">
                                          {sub.subCategory}
                                        </div>
                                        <div className="text-xs text-slate-600">
                                          {sub.count} transaction
                                          {sub.count !== 1 ? "s" : ""}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-slate-800 text-sm">
                                        {formatCurrency(sub.amount)}
                                      </div>
                                      <div className="text-xs text-slate-600">
                                        {percentage.toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {!selectedCategory && (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-lg font-medium mb-2">
                    No category selected
                  </div>
                  <div className="text-sm">
                    Choose a category from the dropdown above to view its
                    breakdown
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {expenseCategoryData[0]?.category || "N/A"}
            </div>
            <p className="text-sm text-slate-600">
              {expenseCategoryData[0]
                ? formatCurrency(expenseCategoryData[0].amount)
                : "$0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(
                expenses.length > 0
                  ? expenses.reduce((sum, exp) => sum + exp.amount, 0) /
                      expenses.length
                  : 0,
              )}
            </div>
            <p className="text-sm text-slate-600">
              Across {expenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {expenseCategoryData.length}
            </div>
            <p className="text-sm text-slate-600">Unique spending categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

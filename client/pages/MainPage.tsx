import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Calculator,
  Clipboard,
  IndianRupee,
  Heart,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Beef,
  Stethoscope,
  Receipt,
  Baby,
  PawPrint,
  Rabbit,
  Bird,
} from "lucide-react";
import { ExpenseRecord } from "@shared/expense-types";
import * as api from "@/lib/api";
import { Task, fetchTasks } from "@/lib/task-api";
import {
  AnimalRecord,
  fetchAnimals,
  fetchBreedingRecords,
} from "@/lib/animal-api";
import { getApiConfig } from "@/lib/api-config";

export default function MainPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [hasBreedingData, setHasBreedingData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [breedingLoading, setBreedingLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [animalStats, setAnimalStats] = useState({
    totalAnimals: 0,
    totalGoats: 0,
    totalSheep: 0,
    totalKids: 0,
    activeAnimals: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.fetchExpenses();
        setExpenses(data);

        const totalIncome = data
          .filter((expense) => expense.type === "Income")
          .reduce((sum, expense) => sum + expense.amount, 0);

        const totalExpenses = data
          .filter((expense) => expense.type === "Expense")
          .reduce((sum, expense) => sum + expense.amount, 0);

        setStats({
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          transactionCount: data.length,
        });
      } catch (error) {
        console.error("Error loading expense stats:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadTasks = async () => {
      try {
        const taskData = await fetchTasks();

        // Filter and sort tasks to get next 3 upcoming items
        const upcomingTasks = taskData
          .filter((task) => task.status !== "completed")
          .sort((a, b) => {
            // Sort by due date, then by priority
            const dateComparison =
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (dateComparison !== 0) return dateComparison;

            // Priority sorting: high = 0, medium = 1, low = 2
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .slice(0, 3);

        setTasks(upcomingTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
        setTasks([]); // Set empty array on error
      } finally {
        setTasksLoading(false);
      }
    };

    const loadAnimals = async () => {
      try {
        const animalData = await fetchAnimals();
        setAnimals(animalData);

        // Calculate animal statistics
        const activeAnimals = animalData.filter(
          (animal) => animal.status !== "sold" && animal.status !== "dead",
        );
        const goats = activeAnimals.filter((animal) => animal.type === "goat");
        const sheep = activeAnimals.filter((animal) => animal.type === "sheep");

        // Calculate kids (animals less than 3 months old)
        const now = new Date();
        const threeMonthsAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate(),
        );
        const kids = activeAnimals.filter((animal) => {
          if (!animal.dateOfBirth) return false;
          return new Date(animal.dateOfBirth) > threeMonthsAgo;
        });

        setAnimalStats({
          totalAnimals: activeAnimals.length,
          totalGoats: goats.length,
          totalSheep: sheep.length,
          totalKids: kids.length,
          activeAnimals: activeAnimals.length,
        });
      } catch (error) {
        console.error("Error loading animals:", error);
        setAnimals([]);
        setAnimalStats({
          totalAnimals: 0,
          totalGoats: 0,
          totalSheep: 0,
          totalKids: 0,
          activeAnimals: 0,
        });
      } finally {
        setAnimalsLoading(false);
      }
    };

    const loadBreedingData = async () => {
      try {
        const breedingRecords = await fetchBreedingRecords();
        setHasBreedingData(breedingRecords.length > 0);
      } catch (error) {
        console.error("Error loading breeding data:", error);
        setHasBreedingData(false);
      } finally {
        setBreedingLoading(false);
      }
    };

    loadStats();
    loadTasks();
    loadAnimals();
    loadBreedingData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `${diffDays} days`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const apiConfig = getApiConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Demo Mode Banner */}
      {apiConfig.mockMode && (
        <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-orange-800">
              <span className="text-sm font-medium">
                🎭 Demo Mode: Using sample data (Backend not connected)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header with Logo */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-6">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F483f6e241d954aec88a0b40782122459%2F5254047a2582477b8e206724ecfff5b8?format=webp&width=800"
              alt="Bija Farms Logo"
              className="h-20 w-auto"
            />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                Bija Farms Management
              </h1>
              <p className="text-green-600 text-lg">
                Integrated farming solutions for modern agriculture
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Expense Tracker Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <IndianRupee className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-800">
                      Bija Expense Tracker
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Track farm finances and manage budgets
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="animate-pulse">
                    <div className="h-4 bg-blue-200 rounded mb-2 w-24"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-8 bg-blue-200 rounded"></div>
                      <div className="h-8 bg-blue-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    Financial Overview:
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-700 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Income</span>
                      </div>
                      <div className="text-lg font-bold text-green-800">
                        {formatCurrency(stats.totalIncome)}
                      </div>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-700 mb-1">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xs font-medium">Expenses</span>
                      </div>
                      <div className="text-lg font-bold text-red-800">
                        {formatCurrency(stats.totalExpenses)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Balance:
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold ${stats.balance >= 0 ? "text-green-700" : "text-red-700"}`}
                      >
                        {formatCurrency(stats.balance)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Transactions:
                        </span>
                      </div>
                      <div className="text-sm font-bold text-blue-700">
                        {stats.transactionCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Link to="/expense-tracker">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3">
                    Open Expense Tracker
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Work Tracker Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-800">
                      Bija Work Tracker
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Manage goat & sheep health tasks
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {tasksLoading ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="animate-pulse">
                    <div className="h-4 bg-green-200 rounded mb-3 w-32"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-green-200 rounded"></div>
                      <div className="h-8 bg-green-200 rounded"></div>
                      <div className="h-8 bg-green-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">
                    Next 3 Work Items:
                  </h4>
                  {tasks.length === 0 ? (
                    <div className="text-center py-4">
                      <Clipboard className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-green-600">
                        No upcoming tasks
                      </p>
                      <p className="text-xs text-green-500">All caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="bg-white/60 p-3 rounded-lg border border-green-100"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                                >
                                  {task.priority}
                                </span>
                                <span className="text-xs text-green-600 font-medium">
                                  {formatDueDate(task.dueDate)}
                                </span>
                              </div>
                              <h5 className="text-sm font-medium text-green-800 truncate">
                                {task.title}
                              </h5>
                              <p className="text-xs text-green-600 truncate">
                                {task.category} • {task.taskType}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-green-200 text-center">
                    <span className="text-xs text-green-600">
                      {tasks.length > 0
                        ? "View all tasks in Work Tracker"
                        : "Add new tasks in Work Tracker"}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Link to="/work-tracker">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3">
                    Open Work Tracker
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Animal Tracker Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-300 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <PawPrint className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-800">
                      Bija Animal Tracker
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Comprehensive livestock management
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {animalsLoading ? (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                  <div className="animate-pulse">
                    <div className="h-4 bg-purple-200 rounded mb-3 w-32"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 bg-purple-200 rounded"></div>
                      <div className="h-16 bg-purple-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="h-16 bg-purple-200 rounded"></div>
                      <div className="h-16 bg-purple-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3">
                    Livestock Overview (Active Animals):
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-purple-700 mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Total Animals
                        </span>
                      </div>
                      <div className="text-xl font-bold text-purple-800">
                        {animalStats.totalAnimals}
                      </div>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-purple-700 mb-1">
                        <Baby className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Kids (&lt;3 months)
                        </span>
                      </div>
                      <div className="text-xl font-bold text-purple-800">
                        {animalStats.totalKids}
                      </div>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-purple-700 mb-1">
                        <PawPrint className="h-4 w-4" />
                        <span className="text-xs font-medium">Goats</span>
                      </div>
                      <div className="text-xl font-bold text-purple-800">
                        {animalStats.totalGoats}
                      </div>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-purple-700 mb-1">
                        <PawPrint className="h-4 w-4" />
                        <span className="text-xs font-medium">Sheep</span>
                      </div>
                      <div className="text-xl font-bold text-purple-800">
                        {animalStats.totalSheep}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200 text-center">
                    <span className="text-xs text-purple-600">
                      {animalStats.totalAnimals > 0
                        ? `${animalStats.totalAnimals} active animals (excluding sold/dead)`
                        : "No animals found - add your first livestock!"}
                    </span>
                    {animalStats.totalAnimals > 0 &&
                      hasBreedingData &&
                      !breedingLoading && (
                        <div className="mt-2">
                          <Link
                            to="/breeding-history"
                            className="text-xs text-pink-600 hover:text-pink-700 underline font-medium"
                          >
                            📋 View Breeding History
                          </Link>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Link to="/animal-tracker">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3">
                    Open Animal Tracker
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-green-200">
            © 2024 Bija Farms. Integrated farming solutions for sustainable
            agriculture.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Check,
  Clock,
  Stethoscope,
  Heart,
  AlertTriangle,
  ArrowLeft,
  Beef,
  Syringe,
  Thermometer,
  ShieldCheck,
  Search,
  Tractor,
  Sprout,
  Droplets,
  Scissors,
  Wrench,
  Users,
  Edit,
  Trash2,
  Save,
  X,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "@/components/ui/pagination";
import { ExportCSVButton } from "@/components/ExportButton";
import { createTaskExportConfig } from "@/lib/export-configs";
import * as taskApi from "@/lib/task-api";

interface Task {
  id: string;
  title: string;
  description: string;
  category:
    | "animal-health"
    | "crop-management"
    | "equipment"
    | "irrigation"
    | "harvesting"
    | "maintenance"
    | "general";
  taskType:
    | "vaccination"
    | "checkup"
    | "treatment"
    | "feeding"
    | "cleaning"
    | "planting"
    | "watering"
    | "fertilizing"
    | "harvesting"
    | "equipment-maintenance"
    | "repair"
    | "inspection"
    | "other";
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  completedAt?: string;
}

const taskTypeColors = {
  vaccination: "bg-blue-100 text-blue-800 border-blue-200",
  checkup: "bg-green-100 text-green-800 border-green-200",
  treatment: "bg-red-100 text-red-800 border-red-200",
  feeding: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cleaning: "bg-purple-100 text-purple-800 border-purple-200",
  planting: "bg-emerald-100 text-emerald-800 border-emerald-200",
  watering: "bg-cyan-100 text-cyan-800 border-cyan-200",
  fertilizing: "bg-lime-100 text-lime-800 border-lime-200",
  harvesting: "bg-orange-100 text-orange-800 border-orange-200",
  "equipment-maintenance": "bg-slate-100 text-slate-800 border-slate-200",
  repair: "bg-rose-100 text-rose-800 border-rose-200",
  inspection: "bg-indigo-100 text-indigo-800 border-indigo-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
};

export default function WorkTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Pagination for filtered tasks
  const tasksPagination = usePagination(filteredTasks, 10);

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general" as Task["category"],
    taskType: "other" as Task["taskType"],
    priority: "medium" as Task["priority"],
    dueDate: "",
    assignedTo: "",
    notes: "",
  });

  // Load tasks from API on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const data = await taskApi.fetchTasks();
        console.log("Loaded tasks from API:", data.length);
        setTasks(data);
        setFilteredTasks(data);
      } catch (error) {
        console.error("Error loading tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [toast]);

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((task) => task.category === filterCategory);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, filterStatus, filterCategory]);

  const addTask = async () => {
    if (!newTask.title || !newTask.dueDate || !newTask.assignedTo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const createdTask = await taskApi.createTask({
      ...newTask,
      status: "pending",
    });

    const updatedTasks = [createdTask, ...tasks];
    setTasks(updatedTasks);

    toast({
      title: "Success",
      description: "Task added successfully",
    });

    setNewTask({
      title: "",
      description: "",
      category: "general",
      taskType: "other",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      notes: "",
    });
    setIsAddDialogOpen(false);
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"],
  ) => {
    try {
      const updateData: Partial<Task> = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completedAt = new Date().toISOString().split("T")[0];
      }

      const updatedTask = await taskApi.updateTask(taskId, updateData);
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? updatedTask : task,
      );

      setTasks(updatedTasks);

      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const updated = await taskApi.updateTask(updatedTask.id, updatedTask);
      const updatedTasks = tasks.map((task) =>
        task.id === updatedTask.id ? updated : task,
      );

      setTasks(updatedTasks);
      setIsEditDialogOpen(false);
      setEditingTask(null);

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await taskApi.deleteTask(taskId);
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const getTaskIcon = (taskType: Task["taskType"]) => {
    switch (taskType) {
      case "vaccination":
        return <Syringe className="h-4 w-4" />;
      case "checkup":
        return <Stethoscope className="h-4 w-4" />;
      case "treatment":
        return <Heart className="h-4 w-4" />;
      case "feeding":
        return <Beef className="h-4 w-4" />;
      case "cleaning":
        return <ShieldCheck className="h-4 w-4" />;
      case "planting":
        return <Sprout className="h-4 w-4" />;
      case "watering":
        return <Droplets className="h-4 w-4" />;
      case "fertilizing":
        return <Sprout className="h-4 w-4" />;
      case "harvesting":
        return <Scissors className="h-4 w-4" />;
      case "equipment-maintenance":
        return <Wrench className="h-4 w-4" />;
      case "repair":
        return <Wrench className="h-4 w-4" />;
      case "inspection":
        return <Search className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const pendingTasks = filteredTasks.filter(
    (task) => task.status === "pending",
  );
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "in-progress",
  );
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "completed",
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Main
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F483f6e241d954aec88a0b40782122459%2F5254047a2582477b8e206724ecfff5b8?format=webp&width=800"
                  alt="Bija Farms Logo"
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-3xl font-bold text-green-800">
                    Bija Work Tracker
                  </h1>
                  <p className="text-green-600">
                    Complete Farm Task Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {pendingTasks.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {inProgressTasks.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {completedTasks.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {tasks.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="animal-health">Animal Health</SelectItem>
                    <SelectItem value="crop-management">
                      Crop Management
                    </SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new farm task for any agricultural activity
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newTask.title}
                          onChange={(e) =>
                            setNewTask({ ...newTask, title: e.target.value })
                          }
                          placeholder="Task title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              description: e.target.value,
                            })
                          }
                          placeholder="Task description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newTask.category}
                            onValueChange={(value: Task["category"]) =>
                              setNewTask({ ...newTask, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="animal-health">
                                Animal Health
                              </SelectItem>
                              <SelectItem value="crop-management">
                                Crop Management
                              </SelectItem>
                              <SelectItem value="equipment">
                                Equipment
                              </SelectItem>
                              <SelectItem value="irrigation">
                                Irrigation
                              </SelectItem>
                              <SelectItem value="harvesting">
                                Harvesting
                              </SelectItem>
                              <SelectItem value="maintenance">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="taskType">Task Type</Label>
                          <Select
                            value={newTask.taskType}
                            onValueChange={(value: Task["taskType"]) =>
                              setNewTask({ ...newTask, taskType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vaccination">
                                Vaccination
                              </SelectItem>
                              <SelectItem value="checkup">
                                Health Checkup
                              </SelectItem>
                              <SelectItem value="treatment">
                                Treatment
                              </SelectItem>
                              <SelectItem value="feeding">Feeding</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                              <SelectItem value="planting">Planting</SelectItem>
                              <SelectItem value="watering">Watering</SelectItem>
                              <SelectItem value="fertilizing">
                                Fertilizing
                              </SelectItem>
                              <SelectItem value="harvesting">
                                Harvesting
                              </SelectItem>
                              <SelectItem value="equipment-maintenance">
                                Equipment Maintenance
                              </SelectItem>
                              <SelectItem value="repair">Repair</SelectItem>
                              <SelectItem value="inspection">
                                Inspection
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value: Task["priority"]) =>
                              setNewTask({ ...newTask, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="dueDate">Due Date *</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                dueDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="assignedTo">Assigned To *</Label>
                        <Input
                          id="assignedTo"
                          value={newTask.assignedTo}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              assignedTo: e.target.value,
                            })
                          }
                          placeholder="Person responsible"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newTask.notes}
                          onChange={(e) =>
                            setNewTask({ ...newTask, notes: e.target.value })
                          }
                          placeholder="Additional notes"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={addTask}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Add Task
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <ExportCSVButton
                  data={filteredTasks}
                  config={createTaskExportConfig()}
                  disabled={filteredTasks.length === 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-4">
              <div className="grid gap-4">
                {filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No tasks found. Add your first farm task!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  tasksPagination.data.map((task) => (
                    <Card
                      key={task.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {task.title}
                              </h3>
                              {getStatusIcon(task.status)}
                            </div>
                            {task.description && (
                              <p className="text-gray-600 mb-3">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge
                                className={taskTypeColors[task.taskType]}
                                variant="outline"
                              >
                                {getTaskIcon(task.taskType)}
                                <span className="ml-1 capitalize">
                                  {task.taskType}
                                </span>
                              </Badge>
                              <Badge
                                className={priorityColors[task.priority]}
                                variant="outline"
                              >
                                <span className="capitalize">
                                  {task.priority} Priority
                                </span>
                              </Badge>
                              <Badge variant="outline">
                                <Tractor className="h-3 w-3 mr-1" />
                                {task.category.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                              <div>Assigned to: {task.assignedTo}</div>
                              {task.notes && <div>Notes: {task.notes}</div>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="flex gap-2 mb-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTask(task)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {task.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateTaskStatus(task.id, "in-progress")
                                }
                              >
                                Start
                              </Button>
                            )}
                            {task.status === "in-progress" && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  updateTaskStatus(task.id, "completed")
                                }
                              >
                                Complete
                              </Button>
                            )}
                            {task.status === "completed" &&
                              task.completedAt && (
                                <div className="text-xs text-green-600">
                                  Completed:{" "}
                                  {new Date(
                                    task.completedAt,
                                  ).toLocaleDateString()}
                                </div>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {filteredTasks.length > 0 && (
                <Pagination
                  currentPage={tasksPagination.pagination.page}
                  totalPages={tasksPagination.totalPages}
                  totalItems={tasksPagination.pagination.total}
                  pageSize={tasksPagination.pagination.pageSize}
                  onPageChange={tasksPagination.goToPage}
                  onPageSizeChange={tasksPagination.changePageSize}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid gap-4">
              {pendingTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow border-l-4 border-l-orange-400"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {task.title}
                          </h3>
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                        {task.description && (
                          <p className="text-gray-600 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge
                            className={taskTypeColors[task.taskType]}
                            variant="outline"
                          >
                            {getTaskIcon(task.taskType)}
                            <span className="ml-1 capitalize">
                              {task.taskType}
                            </span>
                          </Badge>
                          <Badge
                            className={priorityColors[task.priority]}
                            variant="outline"
                          >
                            <span className="capitalize">
                              {task.priority} Priority
                            </span>
                          </Badge>
                          <Badge variant="outline">
                            <Tractor className="h-3 w-3 mr-1" />
                            {task.category.replace("-", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div>Assigned to: {task.assignedTo}</div>
                          {task.notes && <div>Notes: {task.notes}</div>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, "in-progress")}
                      >
                        Start Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="grid gap-4">
              {inProgressTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow border-l-4 border-l-blue-400"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {task.title}
                          </h3>
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        {task.description && (
                          <p className="text-gray-600 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge
                            className={taskTypeColors[task.taskType]}
                            variant="outline"
                          >
                            {getTaskIcon(task.taskType)}
                            <span className="ml-1 capitalize">
                              {task.taskType}
                            </span>
                          </Badge>
                          <Badge
                            className={priorityColors[task.priority]}
                            variant="outline"
                          >
                            <span className="capitalize">
                              {task.priority} Priority
                            </span>
                          </Badge>
                          <Badge variant="outline">
                            <Tractor className="h-3 w-3 mr-1" />
                            {task.category.replace("-", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div>Assigned to: {task.assignedTo}</div>
                          {task.notes && <div>Notes: {task.notes}</div>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateTaskStatus(task.id, "completed")}
                      >
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4">
              {completedTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow border-l-4 border-l-green-400"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {task.title}
                          </h3>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        {task.description && (
                          <p className="text-gray-600 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge
                            className={taskTypeColors[task.taskType]}
                            variant="outline"
                          >
                            {getTaskIcon(task.taskType)}
                            <span className="ml-1 capitalize">
                              {task.taskType}
                            </span>
                          </Badge>
                          <Badge
                            className={priorityColors[task.priority]}
                            variant="outline"
                          >
                            <span className="capitalize">
                              {task.priority} Priority
                            </span>
                          </Badge>
                          <Badge variant="outline">
                            <Tractor className="h-3 w-3 mr-1" />
                            {task.category.replace("-", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div>Assigned to: {task.assignedTo}</div>
                          {task.completedAt && (
                            <div className="text-green-600 font-medium">
                              Completed:{" "}
                              {new Date(task.completedAt).toLocaleDateString()}
                            </div>
                          )}
                          {task.notes && <div>Notes: {task.notes}</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the task details below.
              </DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTask.description}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                    placeholder="Task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(value: Task["priority"]) =>
                        setEditingTask({ ...editingTask, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-dueDate">Due Date *</Label>
                    <Input
                      id="edit-dueDate"
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-assignedTo">Assigned To *</Label>
                  <Input
                    id="edit-assignedTo"
                    value={editingTask.assignedTo}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        assignedTo: e.target.value,
                      })
                    }
                    placeholder="Person responsible"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingTask.notes}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, notes: e.target.value })
                    }
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleUpdateTask(editingTask)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingTask(null);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

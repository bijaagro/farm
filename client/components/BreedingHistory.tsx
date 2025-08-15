import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pagination } from "@/components/ui/pagination";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Baby,
  Heart,
  Users,
  BarChart3,
  Download,
  ArrowLeft,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { ExportCSVButton } from "@/components/ExportButton";
import {
  AnimalRecord,
  BreedingRecord,
  AnimalGender,
} from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";

interface BreedingStats {
  totalBreedings: number;
  successfulBreedings: number;
  totalOffspring: number;
  averageKidsPerBreeding: number;
  mortalityRate: number;
  activePregnancies: number;
  maleOffspringCount: number;
  femaleOffspringCount: number;
}

interface BreedingFilters {
  search: string;
  motherId: string;
  fatherId: string;
  method: string;
  status: string;
  year: string;
  dateFrom: string;
  dateTo: string;
}

export default function BreedingHistory() {
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BreedingStats | null>(null);
  const [filters, setFilters] = useState<BreedingFilters>({
    search: "",
    motherId: "all",
    fatherId: "all",
    method: "all",
    status: "all",
    year: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedRecord, setSelectedRecord] = useState<BreedingRecord | null>(
    null,
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(
    null,
  );
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const { toast } = useToast();

  // Pagination for breeding records
  const {
    data: paginatedRecords,
    pagination,
    hasNextPage,
    hasPreviousPage,
    totalPages,
    goToPage,
    changePageSize,
  } = usePagination(filteredRecords, 10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [breedingRecords, filters]);

  useEffect(() => {
    if (breedingRecords.length > 0) {
      calculateStats();
    }
  }, [breedingRecords]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [animalsData, breedingData] = await Promise.all([
        animalApi.fetchAnimals(),
        animalApi.fetchBreedingRecords(),
      ]);
      setAnimals(animalsData);
      setBreedingRecords(breedingData);
    } catch (error) {
      console.error("Error loading breeding data:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = breedingRecords;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((record) => {
        const mother = animals.find((a) => a.id === record.motherId);
        const father = animals.find((a) => a.id === record.fatherId);
        return (
          mother?.name.toLowerCase().includes(searchLower) ||
          father?.name.toLowerCase().includes(searchLower) ||
          record.veterinarianName?.toLowerCase().includes(searchLower) ||
          record.notes?.toLowerCase().includes(searchLower)
        );
      });
    }

    if (filters.motherId && filters.motherId !== "all") {
      filtered = filtered.filter(
        (record) => record.motherId === filters.motherId,
      );
    }

    if (filters.fatherId && filters.fatherId !== "all") {
      filtered = filtered.filter(
        (record) => record.fatherId === filters.fatherId,
      );
    }

    if (filters.method && filters.method !== "all") {
      filtered = filtered.filter(
        (record) => record.breedingMethod === filters.method,
      );
    }

    if (filters.year && filters.year !== "all") {
      filtered = filtered.filter((record) => {
        const year = new Date(
          record.actualDeliveryDate || record.breedingDate,
        ).getFullYear();
        return year.toString() === filters.year;
      });
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(
          record.actualDeliveryDate || record.breedingDate,
        );
        return recordDate >= new Date(filters.dateFrom);
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(
          record.actualDeliveryDate || record.breedingDate,
        );
        return recordDate <= new Date(filters.dateTo);
      });
    }

    setFilteredRecords(filtered);
  };

  const calculateStats = () => {
    const totalBreedings = breedingRecords.length;
    const successfulBreedings = breedingRecords.filter(
      (r) => r.totalKids && r.totalKids > 0,
    ).length;
    const totalOffspring = breedingRecords.reduce(
      (sum, r) => sum + (r.totalKids || 0),
      0,
    );
    const maleOffspringCount = breedingRecords.reduce(
      (sum, r) => sum + (r.maleKids || 0),
      0,
    );
    const femaleOffspringCount = breedingRecords.reduce(
      (sum, r) => sum + (r.femaleKids || 0),
      0,
    );

    // Calculate mortality rate
    const totalBirths = breedingRecords.reduce((sum, record) => {
      if (record.kidDetails) {
        return sum + record.kidDetails.length;
      }
      return sum + (record.totalKids || 0);
    }, 0);

    const deaths = breedingRecords.reduce((sum, record) => {
      if (record.kidDetails) {
        return (
          sum +
          record.kidDetails.filter((kidId) => {
            const kidAnimal = getAnimalById(kidId);
            return kidAnimal?.status === "dead";
          }).length
        );
      }
      return sum;
    }, 0);

    const mortalityRate = totalBirths > 0 ? (deaths / totalBirths) * 100 : 0;

    const calculatedStats: BreedingStats = {
      totalBreedings,
      successfulBreedings,
      totalOffspring,
      averageKidsPerBreeding:
        totalBreedings > 0 ? totalOffspring / totalBreedings : 0,
      mortalityRate,
      activePregnancies: 0, // Would need additional data to track pregnancies
      maleOffspringCount,
      femaleOffspringCount,
    };

    setStats(calculatedStats);
  };

  const getAnimalName = (animalId?: string) => {
    if (!animalId) return "Unknown";
    const animal = animals.find((a) => a.id === animalId);
    return animal ? animal.name : "Unknown";
  };

  const getAnimalById = (animalId: string): AnimalRecord | undefined => {
    return animals.find((a) => a.id === animalId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBreedingStatus = (record: BreedingRecord) => {
    if (record.actualDeliveryDate) {
      return {
        status: "completed",
        label: "Delivered",
        color: "bg-green-100 text-green-800",
      };
    }
    if (record.expectedDeliveryDate) {
      const expected = new Date(record.expectedDeliveryDate);
      const now = new Date();
      if (now > expected) {
        return {
          status: "overdue",
          label: "Overdue",
          color: "bg-red-100 text-red-800",
        };
      }
      return {
        status: "pregnant",
        label: "Pregnant",
        color: "bg-blue-100 text-blue-800",
      };
    }
    return {
      status: "bred",
      label: "Bred",
      color: "bg-yellow-100 text-yellow-800",
    };
  };

  // Chart data
  const monthlyBreedingData = breedingRecords.reduce(
    (acc, record) => {
      const date = new Date(record.actualDeliveryDate || record.breedingDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!acc[monthYear]) {
        acc[monthYear] = { month: monthYear, breedings: 0, offspring: 0 };
      }
      acc[monthYear].breedings += 1;
      acc[monthYear].offspring += record.totalKids || 0;

      return acc;
    },
    {} as Record<
      string,
      { month: string; breedings: number; offspring: number }
    >,
  );

  const chartData = Object.values(monthlyBreedingData).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const genderDistributionData = [
    { name: "Male", value: stats?.maleOffspringCount || 0, color: "#3B82F6" },
    {
      name: "Female",
      value: stats?.femaleOffspringCount || 0,
      color: "#EC4899",
    },
  ];

  const uniqueYears = [
    ...new Set(
      breedingRecords.map((r) =>
        new Date(r.actualDeliveryDate || r.breedingDate).getFullYear(),
      ),
    ),
  ].sort((a, b) => b - a);

  const breedingExportConfig = {
    filename: "breeding-history",
    columns: [
      { header: "Date", key: "date" },
      { header: "Mother", key: "mother" },
      { header: "Father", key: "father" },
      { header: "Method", key: "method" },
      { header: "Total Kids", key: "totalKids" },
      { header: "Male Kids", key: "maleKids" },
      { header: "Female Kids", key: "femaleKids" },
      { header: "Status", key: "status" },
      { header: "Veterinarian", key: "veterinarian" },
      { header: "Complications", key: "complications" },
    ],
  };

  const exportData = filteredRecords.map((record) => ({
    date: formatDate(record.actualDeliveryDate || record.breedingDate),
    mother: getAnimalName(record.motherId),
    father: getAnimalName(record.fatherId),
    method: record.breedingMethod || "Unknown",
    totalKids: record.totalKids || 0,
    maleKids: record.maleKids || 0,
    femaleKids: record.femaleKids || 0,
    status: getBreedingStatus(record).label,
    veterinarian: record.veterinarianName || "",
    complications: record.complications || "",
  }));

  const handleViewRecord = (record: BreedingRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleEditRecord = (record: BreedingRecord) => {
    setEditingRecord({ ...record });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;

    try {
      await animalApi.updateBreedingRecord(editingRecord.id, editingRecord);
      toast({
        title: "Success",
        description: "Breeding record updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      await loadData(); // Refresh the data
    } catch (error) {
      console.error("Error updating breeding record:", error);
      toast({
        title: "Error",
        description: "Failed to update breeding record. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading breeding history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/animals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Animals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Breeding History & Analytics
            </h1>
            <p className="text-slate-600">
              Comprehensive breeding tracking and performance analysis
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Total Breedings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {stats.totalBreedings}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {stats.successfulBreedings}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                  <Baby className="h-4 w-4" />
                  Total Offspring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.totalOffspring}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Kids/Breeding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">
                  {stats.averageKidsPerBreeding.toFixed(1)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-pink-800 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Male Offspring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-900">
                  {stats.maleOffspringCount}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cyan-800 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Female Offspring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-900">
                  {stats.femaleOffspringCount}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`bg-gradient-to-br border ${
                stats.mortalityRate > 10
                  ? "from-red-50 to-red-100 border-red-200"
                  : "from-yellow-50 to-yellow-100 border-yellow-200"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle
                  className={`text-sm font-medium flex items-center gap-2 ${
                    stats.mortalityRate > 10
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Mortality Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    stats.mortalityRate > 10
                      ? "text-red-900"
                      : "text-yellow-900"
                  }`}
                >
                  {stats.mortalityRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {stats.totalBreedings > 0
                    ? (
                        (stats.successfulBreedings / stats.totalBreedings) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Collapsible
              open={isFiltersExpanded}
              onOpenChange={setIsFiltersExpanded}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-0 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Filters & Search</h3>
                  </div>
                  {isFiltersExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by animal name, vet..."
                        value={filters.search}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            search: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mother</Label>
                    <Select
                      value={filters.motherId}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, motherId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All mothers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All mothers</SelectItem>
                        {animals
                          .filter((a) => a.gender === "female")
                          .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.name} ({animal.breed})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Father</Label>
                    <Select
                      value={filters.fatherId}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, fatherId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All fathers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All fathers</SelectItem>
                        {animals
                          .filter((a) => a.gender === "male")
                          .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.name} ({animal.breed})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select
                      value={filters.method}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All methods</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="artificial_insemination">
                          AI
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={filters.year}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, year: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All years</SelectItem>
                        {uniqueYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateFrom: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateTo: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFilters({
                          search: "",
                          motherId: "all",
                          fatherId: "all",
                          method: "all",
                          status: "all",
                          year: "all",
                          dateFrom: "",
                          dateTo: "",
                        })
                      }
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="records" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <ExportCSVButton
              data={exportData}
              config={breedingExportConfig}
              disabled={filteredRecords.length === 0}
              className="ml-4"
            />
          </div>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>
                  Breeding Records ({filteredRecords.length})
                </CardTitle>
                <CardDescription>
                  Detailed breeding history and birth records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Mother</TableHead>
                        <TableHead>Father</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Offspring</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRecords.map((record) => {
                        const breedingStatus = getBreedingStatus(record);
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              {formatDate(
                                record.actualDeliveryDate ||
                                  record.breedingDate,
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {getAnimalName(record.motherId)}
                            </TableCell>
                            <TableCell>
                              {getAnimalName(record.fatherId)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {record.breedingMethod ===
                                "artificial_insemination"
                                  ? "AI"
                                  : "Natural"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {record.totalKids || 0}
                                </span>
                                {(record.maleKids || 0) > 0 && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {record.maleKids}♂
                                  </Badge>
                                )}
                                {(record.femaleKids || 0) > 0 && (
                                  <Badge className="bg-pink-100 text-pink-800">
                                    {record.femaleKids}♀
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={breedingStatus.color}>
                                {breedingStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewRecord(record)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRecord(record)}
                                  title="Edit Record"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {filteredRecords.length > 0 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={totalPages}
                    totalItems={pagination.total}
                    pageSize={pagination.pageSize}
                    onPageChange={goToPage}
                    onPageSizeChange={changePageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Breeding Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Breeding Trends</CardTitle>
                  <CardDescription>
                    Breedings and offspring over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="breedings"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name="Breedings"
                      />
                      <Line
                        type="monotone"
                        dataKey="offspring"
                        stroke="#EC4899"
                        strokeWidth={2}
                        name="Offspring"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Offspring Gender Distribution</CardTitle>
                  <CardDescription>
                    Male vs Female offspring ratio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {genderDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Breeding Method Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Breeding Method Distribution</CardTitle>
                  <CardDescription>
                    Natural vs Artificial Insemination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          method: "Natural",
                          count: breedingRecords.filter(
                            (r) => r.breedingMethod === "natural",
                          ).length,
                        },
                        {
                          method: "AI",
                          count: breedingRecords.filter(
                            (r) =>
                              r.breedingMethod === "artificial_insemination",
                          ).length,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performing Mothers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Mothers</CardTitle>
                  <CardDescription>Mothers with most offspring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {animals
                      .filter((a) => a.gender === "female")
                      .map((mother) => ({
                        ...mother,
                        totalOffspring: breedingRecords
                          .filter((r) => r.motherId === mother.id)
                          .reduce((sum, r) => sum + (r.totalKids || 0), 0),
                      }))
                      .filter((m) => m.totalOffspring > 0)
                      .sort((a, b) => b.totalOffspring - a.totalOffspring)
                      .slice(0, 5)
                      .map((mother) => (
                        <div
                          key={mother.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{mother.name}</p>
                            <p className="text-sm text-gray-600">
                              {mother.breed}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {mother.totalOffspring} kids
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Breeding Calendar</CardTitle>
                <CardDescription>
                  Timeline view of breeding events and expected deliveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRecords
                    .sort(
                      (a, b) =>
                        new Date(
                          b.actualDeliveryDate ||
                            b.expectedDeliveryDate ||
                            b.breedingDate,
                        ).getTime() -
                        new Date(
                          a.actualDeliveryDate ||
                            a.expectedDeliveryDate ||
                            a.breedingDate,
                        ).getTime(),
                    )
                    .map((record) => {
                      const breedingStatus = getBreedingStatus(record);
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex flex-col items-center">
                            <Calendar className="h-6 w-6 text-gray-600 mb-1" />
                            <Badge
                              className={breedingStatus.color}
                              variant="secondary"
                            >
                              {breedingStatus.label}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {getAnimalName(record.motherId)} ×{" "}
                                  {getAnimalName(record.fatherId)}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {record.breedingDate &&
                                    `Bred: ${formatDate(record.breedingDate)}`}
                                  {record.expectedDeliveryDate &&
                                    ` • Expected: ${formatDate(record.expectedDeliveryDate)}`}
                                  {record.actualDeliveryDate &&
                                    ` • Delivered: ${formatDate(record.actualDeliveryDate)}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {record.totalKids || 0} kids
                                </p>
                                <div className="flex gap-1">
                                  {(record.maleKids || 0) > 0 && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      {record.maleKids}♂
                                    </Badge>
                                  )}
                                  {(record.femaleKids || 0) > 0 && (
                                    <Badge className="bg-pink-100 text-pink-800 text-xs">
                                      {record.femaleKids}♀
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {record.complications && (
                              <p className="text-sm text-red-600 mt-2">
                                ⚠️ Complications: {record.complications}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Record Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Breeding Record Details</DialogTitle>
              <DialogDescription>
                View detailed information about this breeding record
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Mother</Label>
                    <p className="mt-1">
                      {getAnimalName(selectedRecord.motherId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Father</Label>
                    <p className="mt-1">
                      {getAnimalName(selectedRecord.fatherId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Breeding Date</Label>
                    <p className="mt-1">
                      {selectedRecord.breedingDate
                        ? formatDate(selectedRecord.breedingDate)
                        : "Not recorded"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Delivery Date</Label>
                    <p className="mt-1">
                      {selectedRecord.actualDeliveryDate
                        ? formatDate(selectedRecord.actualDeliveryDate)
                        : "Not delivered"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Method</Label>
                    <p className="mt-1">
                      {selectedRecord.breedingMethod ===
                      "artificial_insemination"
                        ? "Artificial Insemination"
                        : "Natural"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Kids</Label>
                    <p className="mt-1">{selectedRecord.totalKids || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Male Kids</Label>
                    <p className="mt-1">{selectedRecord.maleKids || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Female Kids</Label>
                    <p className="mt-1">{selectedRecord.femaleKids || 0}</p>
                  </div>
                </div>

                {selectedRecord.veterinarianName && (
                  <div>
                    <Label className="text-sm font-medium">Veterinarian</Label>
                    <p className="mt-1">{selectedRecord.veterinarianName}</p>
                  </div>
                )}

                {selectedRecord.complications && (
                  <div>
                    <Label className="text-sm font-medium">Complications</Label>
                    <p className="mt-1 text-red-600">
                      {selectedRecord.complications}
                    </p>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="mt-1">{selectedRecord.notes}</p>
                  </div>
                )}

                {selectedRecord.kidDetails &&
                  selectedRecord.kidDetails.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Kid Details</Label>
                      <div className="mt-2 space-y-2">
                        {selectedRecord.kidDetails.map((kidId, index) => {
                          const kidAnimal = getAnimalById(kidId);
                          return (
                            <div
                              key={index}
                              className="border rounded p-3 bg-gray-50"
                            >
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <strong>Name:</strong>{" "}
                                  {kidAnimal?.name ||
                                    `Kid ${index + 1} (${kidId})`}
                                </div>
                                <div>
                                  <strong>Gender:</strong>{" "}
                                  {kidAnimal?.gender || "Unknown"}
                                </div>
                                <div>
                                  <strong>Current Weight:</strong>{" "}
                                  {kidAnimal?.currentWeight
                                    ? `${kidAnimal.currentWeight} kg`
                                    : "Not recorded"}
                                </div>
                                <div>
                                  <strong>Status:</strong>{" "}
                                  {kidAnimal?.status || "Unknown"}
                                </div>
                                {kidAnimal?.breed && (
                                  <div>
                                    <strong>Breed:</strong> {kidAnimal.breed}
                                  </div>
                                )}
                                {kidAnimal?.dateOfBirth && (
                                  <div>
                                    <strong>Date of Birth:</strong>{" "}
                                    {formatDate(kidAnimal.dateOfBirth)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Record Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Breeding Record</DialogTitle>
              <DialogDescription>
                Update the breeding record information
              </DialogDescription>
            </DialogHeader>
            {editingRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mother</Label>
                    <Select
                      value={editingRecord.motherId}
                      onValueChange={(value) =>
                        setEditingRecord((prev) =>
                          prev ? { ...prev, motherId: value } : null,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {animals
                          .filter((a) => a.gender === "female")
                          .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.name} ({animal.breed})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Father</Label>
                    <Select
                      value={editingRecord.fatherId || "unknown"}
                      onValueChange={(value) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                fatherId:
                                  value === "unknown" ? undefined : value,
                              }
                            : null,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">
                          Unknown/No Record
                        </SelectItem>
                        {animals
                          .filter((a) => a.gender === "male")
                          .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.name} ({animal.breed})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Breeding Date</Label>
                    <Input
                      type="date"
                      value={editingRecord.breedingDate}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? { ...prev, breedingDate: e.target.value }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Expected Delivery Date</Label>
                    <Input
                      type="date"
                      value={editingRecord.expectedDeliveryDate || ""}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                expectedDeliveryDate:
                                  e.target.value || undefined,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Actual Delivery Date</Label>
                    <Input
                      type="date"
                      value={editingRecord.actualDeliveryDate || ""}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                actualDeliveryDate: e.target.value || undefined,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Breeding Method</Label>
                    <Select
                      value={editingRecord.breedingMethod || "natural"}
                      onValueChange={(value) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                breedingMethod: value as
                                  | "natural"
                                  | "artificial_insemination",
                              }
                            : null,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="artificial_insemination">
                          Artificial Insemination
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Total Kids</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingRecord.totalKids || ""}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                totalKids: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Male Kids</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingRecord.maleKids || ""}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                maleKids: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Female Kids</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingRecord.femaleKids || ""}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                femaleKids: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Veterinarian</Label>
                    <Input
                      value={editingRecord.veterinarianName || ""}
                      onChange={(e) =>
                        setEditingRecord((prev) =>
                          prev
                            ? {
                                ...prev,
                                veterinarianName: e.target.value || undefined,
                              }
                            : null,
                        )
                      }
                      placeholder="Veterinarian name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Complications</Label>
                  <Textarea
                    value={editingRecord.complications || ""}
                    onChange={(e) =>
                      setEditingRecord((prev) =>
                        prev
                          ? {
                              ...prev,
                              complications: e.target.value || undefined,
                            }
                          : null,
                      )
                    }
                    placeholder="Any complications during breeding or delivery"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={editingRecord.notes || ""}
                    onChange={(e) =>
                      setEditingRecord((prev) =>
                        prev
                          ? {
                              ...prev,
                              notes: e.target.value || undefined,
                            }
                          : null,
                      )
                    }
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRecord}>Update Record</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

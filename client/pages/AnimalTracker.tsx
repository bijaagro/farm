import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Heart,
  Weight,
  Baby,
  Stethoscope,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronDown,
  ChevronUp,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "@/components/ui/pagination";
import { ExportCSVButton } from "@/components/ExportButton";
import { createAnimalExportConfig } from "@/lib/export-configs";
import {
  AnimalRecord,
  AnimalFilters,
  AnimalSummary,
  AnimalType,
  AnimalGender,
  AnimalStatus,
} from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";
import AnimalForm from "@/components/AnimalForm";
import AnimalView from "@/components/AnimalView";
import BulkHealthRecordsManager from "@/components/BulkHealthRecordsManager";
import HealthRecordsOverview from "@/components/HealthRecordsOverview";
import BreedingManager from "@/components/BreedingManager";

export default function AnimalTracker() {
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<AnimalRecord[]>([]);
  const [summary, setSummary] = useState<AnimalSummary | null>(null);
  const [filters, setFilters] = useState<AnimalFilters>({
    search: "",
    type: "",
    gender: "",
    status: "",
    breed: "",
    ageRange: "",
    weightRange: "",
  });
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<AnimalRecord | null>(null);
  const [viewingAnimal, setViewingAnimal] = useState<AnimalRecord | null>(null);
  const [isHealthSectionExpanded, setIsHealthSectionExpanded] = useState(false);
  const [hasBreedingData, setHasBreedingData] = useState(false);
  const [breedingLoading, setBreedingLoading] = useState(true);
  const { toast } = useToast();

  // Pagination for filtered animals
  const animalsPagination = usePagination(filteredAnimals, 12);

  // Load animals and summary on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [animalsData, summaryData, breedingRecords] = await Promise.all([
          animalApi.fetchAnimals(),
          animalApi.fetchAnimalSummary(),
          animalApi.fetchBreedingRecords(),
        ]);
        setAnimals(animalsData);
        setFilteredAnimals(animalsData);
        setSummary(summaryData);
        setHasBreedingData(breedingRecords.length > 0);
      } catch (error) {
        console.error("Error loading animal data:", error);
        toast({
          title: "Error",
          description: "Failed to load animal data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setBreedingLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Filter animals based on current filters
  useEffect(() => {
    let filtered = animals;

    if (filters.search) {
      filtered = filtered.filter(
        (animal) =>
          animal.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          animal.breed.toLowerCase().includes(filters.search.toLowerCase()) ||
          animal.markings?.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    if (filters.type) {
      filtered = filtered.filter((animal) => animal.type === filters.type);
    }

    if (filters.gender) {
      filtered = filtered.filter((animal) => animal.gender === filters.gender);
    }

    if (filters.status) {
      filtered = filtered.filter((animal) => animal.status === filters.status);
    }

    if (filters.breed) {
      filtered = filtered.filter((animal) => animal.breed === filters.breed);
    }

    setFilteredAnimals(filtered);
  }, [animals, filters]);

  // Get unique values for filter dropdowns
  const uniqueBreeds = [...new Set(animals.map((a) => a.breed))];

  const handleAddAnimal = async (
    newAnimal: Omit<AnimalRecord, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const createdAnimal = await animalApi.createAnimal(newAnimal);
      setAnimals((prev) => [createdAnimal, ...prev]);
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Animal added successfully",
      });
    } catch (error) {
      console.error("Error adding animal:", error);
      toast({
        title: "Error",
        description: "Failed to add animal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditAnimal = async (updatedAnimal: AnimalRecord) => {
    try {
      const updated = await animalApi.updateAnimal(
        updatedAnimal.id,
        updatedAnimal,
      );
      setAnimals((prev) =>
        prev.map((animal) => (animal.id === updated.id ? updated : animal)),
      );
      setEditingAnimal(null);
      toast({
        title: "Success",
        description: "Animal updated successfully",
      });
    } catch (error) {
      console.error("Error updating animal:", error);
      toast({
        title: "Error",
        description: "Failed to update animal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAnimal = async (id: string) => {
    try {
      await animalApi.deleteAnimal(id);
      setAnimals((prev) => prev.filter((animal) => animal.id !== id));
      toast({
        title: "Success",
        description: "Animal deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting animal:", error);
      toast({
        title: "Error",
        description: "Failed to delete animal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: AnimalStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "ready_to_sell":
        return "bg-yellow-100 text-yellow-800";
      case "dead":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: AnimalStatus) => {
    switch (status) {
      case "active":
        return "Active";
      case "sold":
        return "Sold";
      case "ready_to_sell":
        return "Ready to Sell";
      case "dead":
        return "Dead";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading animal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Bija Animal Tracker
            </h1>
            <p className="text-slate-600">
              Comprehensive livestock management system
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Animals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {summary.totalAnimals}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {summary.activeAnimals}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ready to Sell
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {summary.readyToSell}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-900">
                  {formatCurrency(summary.totalInvestment)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-indigo-900">
                  {formatCurrency(summary.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`bg-gradient-to-br border ${
                summary.profitLoss >= 0
                  ? "from-emerald-50 to-emerald-100 border-emerald-200"
                  : "from-red-50 to-red-100 border-red-200"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle
                  className={`text-sm font-medium flex items-center gap-2 ${
                    summary.profitLoss >= 0
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Profit/Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-lg font-bold ${
                    summary.profitLoss >= 0
                      ? "text-emerald-900"
                      : "text-red-900"
                  }`}
                >
                  {formatCurrency(summary.profitLoss)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Bar */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, breed, or markings..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-10 w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="goat">Goat</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.gender || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        gender: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="ready_to_sell">
                        Ready to Sell
                      </SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="dead">Dead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Animal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Animal</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new animal in your livestock.
                      </DialogDescription>
                    </DialogHeader>
                    <AnimalForm
                      onSubmit={handleAddAnimal}
                      onCancel={() => setIsAddDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>

                <BulkHealthRecordsManager animals={animals} />

                {hasBreedingData && !breedingLoading && (
                  <Link to="/breeding-history">
                    <Button
                      variant="outline"
                      className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                    >
                      <Baby className="h-4 w-4 mr-2" />
                      Breeding History
                    </Button>
                  </Link>
                )}

                <ExportCSVButton
                  data={filteredAnimals}
                  config={createAnimalExportConfig()}
                  disabled={filteredAnimals.length === 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Records Management Section */}
        <Card>
          <Collapsible.Root
            open={isHealthSectionExpanded}
            onOpenChange={setIsHealthSectionExpanded}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                    Health Records Management
                  </CardTitle>
                  <CardDescription>
                    Manage health records for all animals in your livestock
                    {!isHealthSectionExpanded && (
                      <span className="ml-2 text-xs text-blue-600 font-medium">
                        (Click to expand)
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Collapsible.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:bg-gray-100 rounded-md p-2"
                    title={
                      isHealthSectionExpanded
                        ? "Minimize section"
                        : "Expand section"
                    }
                  >
                    {isHealthSectionExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </Collapsible.Trigger>
              </div>
            </CardHeader>
            <Collapsible.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <CardContent>
                <HealthRecordsOverview animals={animals} />
              </CardContent>
            </Collapsible.Content>
          </Collapsible.Root>
        </Card>

        {/* Animals Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnimals.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No animals found</p>
                  <p className="text-gray-400">
                    Try adjusting your filters or add a new animal.
                  </p>
                </CardContent>
              </Card>
            ) : (
              animalsPagination.data.map((animal) => (
                <Card
                  key={animal.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{animal.name}</CardTitle>
                        <CardDescription>
                          {animal.breed} • {animal.type}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(animal.status)}>
                        {getStatusText(animal.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <div className="font-medium capitalize">
                          {animal.gender}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <div className="font-medium">
                          {animal.currentWeight
                            ? `${animal.currentWeight} kg`
                            : "N/A"}
                        </div>
                      </div>
                      {animal.purchasePrice && (
                        <div>
                          <span className="text-gray-500">Purchase:</span>
                          <div className="font-medium">
                            {formatCurrency(animal.purchasePrice)}
                          </div>
                        </div>
                      )}
                      {animal.salePrice && (
                        <div>
                          <span className="text-gray-500">Sale:</span>
                          <div className="font-medium">
                            {formatCurrency(animal.salePrice)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingAnimal(animal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingAnimal(animal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {animal.gender === "female" &&
                        animal.status === "active" && (
                          <BreedingManager
                            mother={animal}
                            allAnimals={animals}
                            onUpdateAnimals={async () => {
                              try {
                                const [animalsData, summaryData] =
                                  await Promise.all([
                                    animalApi.fetchAnimals(),
                                    animalApi.fetchAnimalSummary(),
                                  ]);
                                setAnimals(animalsData);
                                setFilteredAnimals(animalsData);
                                setSummary(summaryData);
                              } catch (error) {
                                console.error(
                                  "Error refreshing animal data:",
                                  error,
                                );
                              }
                            }}
                          />
                        )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAnimal(animal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredAnimals.length > 0 && (
            <Pagination
              currentPage={animalsPagination.pagination.page}
              totalPages={animalsPagination.totalPages}
              totalItems={animalsPagination.pagination.total}
              pageSize={animalsPagination.pagination.pageSize}
              onPageChange={animalsPagination.goToPage}
              onPageSizeChange={animalsPagination.changePageSize}
            />
          )}
        </div>

        {/* Edit Animal Dialog */}
        {editingAnimal && (
          <Dialog open={true} onOpenChange={() => setEditingAnimal(null)}>
            <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Animal</DialogTitle>
                <DialogDescription>
                  Update the details for {editingAnimal.name}.
                </DialogDescription>
              </DialogHeader>
              <AnimalForm
                animal={editingAnimal}
                onSubmit={handleEditAnimal}
                onCancel={() => setEditingAnimal(null)}
                isEditing={true}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* View Animal Dialog */}
        {viewingAnimal && (
          <Dialog open={true} onOpenChange={() => setViewingAnimal(null)}>
            <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <VisuallyHidden>
                <DialogTitle>View Animal - {viewingAnimal.name}</DialogTitle>
              </VisuallyHidden>
              <AnimalView
                animal={viewingAnimal}
                allAnimals={animals}
                onEdit={() => {
                  setEditingAnimal(viewingAnimal);
                  setViewingAnimal(null);
                }}
                onClose={() => setViewingAnimal(null)}
                onUpdate={async () => {
                  try {
                    const [animalsData, summaryData] = await Promise.all([
                      animalApi.fetchAnimals(),
                      animalApi.fetchAnimalSummary(),
                    ]);
                    setAnimals(animalsData);
                    setFilteredAnimals(animalsData);
                    setSummary(summaryData);
                  } catch (error) {
                    console.error("Error refreshing animal data:", error);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

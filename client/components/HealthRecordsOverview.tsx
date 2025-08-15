import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Stethoscope,
  Calendar,
  User,
  IndianRupee,
  AlertCircle,
  FileText,
  Clock,
  Pill,
  Activity,
  Search,
  TrendingUp,
  Heart,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { AnimalRecord, HealthRecord } from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "@/components/ui/pagination";

interface HealthRecordsOverviewProps {
  animals: AnimalRecord[];
}

interface HealthFormData {
  recordType: string;
  date: string;
  description: string;
  veterinarianName: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  cost: string;
  nextCheckupDate: string;
  notes: string;
}

export default function HealthRecordsOverview({
  animals,
}: HealthRecordsOverviewProps) {
  const [healthRecords, setHealthRecords] = useState<
    (HealthRecord & { animalName: string; animalId: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [animalFilter, setAnimalFilter] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<
    (HealthRecord & { animalName: string; animalId: string }) | null
  >(null);
  const [editFormData, setEditFormData] = useState<HealthFormData>({
    recordType: "checkup",
    date: new Date().toISOString().split("T")[0],
    description: "",
    veterinarianName: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    cost: "",
    nextCheckupDate: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAllHealthRecords();
  }, [animals]);

  const loadAllHealthRecords = async () => {
    try {
      setLoading(true);
      const allRecords: (HealthRecord & {
        animalName: string;
        animalId: string;
      })[] = [];

      // Load health records for all animals
      await Promise.all(
        animals.map(async (animal) => {
          try {
            const records = await animalApi.fetchHealthRecords(animal.id);
            records.forEach((record) => {
              allRecords.push({
                ...record,
                animalName: animal.name,
                animalId: animal.id,
              });
            });
          } catch (error) {
            console.error(
              `Error loading health records for ${animal.name}:`,
              error,
            );
          }
        }),
      );

      // Sort by date desc (newest first)
      setHealthRecords(
        allRecords.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error loading health records:", error);
      toast({
        title: "Error",
        description: "Failed to load health records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter health records
  const filteredRecords = healthRecords.filter((record) => {
    const matchesSearch =
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.veterinarianName &&
        record.veterinarianName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesType =
      typeFilter === "all" || record.recordType === typeFilter;
    const matchesAnimal =
      animalFilter === "all" || record.animalId === animalFilter;

    return matchesSearch && matchesType && matchesAnimal;
  });

  // Group records by date first, then by description within each date
  const groupedRecords = filteredRecords.reduce(
    (groups, record) => {
      const dateKey = record.date;
      const descriptionKey = record.description;

      if (!groups[dateKey]) {
        groups[dateKey] = {};
      }

      if (!groups[dateKey][descriptionKey]) {
        groups[dateKey][descriptionKey] = [];
      }

      groups[dateKey][descriptionKey].push(record);

      return groups;
    },
    {} as Record<
      string,
      Record<
        string,
        (HealthRecord & { animalName: string; animalId: string })[]
      >
    >,
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getRecordTypeInfo = (type: string) => {
    switch (type) {
      case "checkup":
        return {
          icon: Stethoscope,
          color: "bg-green-100 text-green-800",
          label: "Checkup",
        };
      case "treatment":
        return {
          icon: Pill,
          color: "bg-blue-100 text-blue-800",
          label: "Treatment",
        };
      case "illness":
        return {
          icon: AlertCircle,
          color: "bg-red-100 text-red-800",
          label: "Illness",
        };
      case "injury":
        return {
          icon: Activity,
          color: "bg-orange-100 text-orange-800",
          label: "Injury",
        };
      default:
        return {
          icon: FileText,
          color: "bg-gray-100 text-gray-800",
          label: "Other",
        };
    }
  };

  // Get statistics
  const getHealthStats = () => {
    if (healthRecords.length === 0) return null;

    const totalCost = healthRecords.reduce(
      (sum, record) => sum + (record.cost || 0),
      0,
    );

    const recentRecords = healthRecords.filter((record) => {
      const recordDate = new Date(record.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    });

    const upcomingCheckups = healthRecords.filter(
      (record) =>
        record.nextCheckupDate && new Date(record.nextCheckupDate) > new Date(),
    );

    const overdueCheckups = healthRecords.filter(
      (record) =>
        record.nextCheckupDate && new Date(record.nextCheckupDate) < new Date(),
    );

    return {
      totalRecords: healthRecords.length,
      totalCost,
      recentRecords: recentRecords.length,
      upcomingCheckups: upcomingCheckups.length,
      overdueCheckups: overdueCheckups.length,
    };
  };

  const stats = getHealthStats();

  // Convert grouped records to a flat array for pagination and add state management
  const flatGroupedRecords = Object.entries(groupedRecords).map(
    ([date, descriptions]) => ({
      date,
      descriptions: Object.entries(descriptions).map(
        ([description, records]) => ({
          description,
          records,
          id: `${date}-${description}`, // Unique ID for each group
        }),
      ),
    }),
  );

  // State for managing collapsed/expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleEditRecord = (
    record: HealthRecord & { animalName: string; animalId: string },
  ) => {
    setEditingRecord(record);
    setEditFormData({
      recordType: record.recordType,
      date: record.date,
      description: record.description,
      veterinarianName: record.veterinarianName || "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      medications: record.medications || "",
      cost: record.cost?.toString() || "",
      nextCheckupDate: record.nextCheckupDate || "",
      notes: record.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !editingRecord ||
      !editFormData.recordType ||
      !editFormData.date ||
      !editFormData.description
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedRecord = await animalApi.updateHealthRecord(
        editingRecord.id,
        {
          ...editingRecord,
          recordType: editFormData.recordType as
            | "checkup"
            | "treatment"
            | "illness"
            | "injury"
            | "other",
          date: editFormData.date,
          description: editFormData.description,
          veterinarianName: editFormData.veterinarianName || undefined,
          diagnosis: editFormData.diagnosis || undefined,
          treatment: editFormData.treatment || undefined,
          medications: editFormData.medications || undefined,
          cost: editFormData.cost ? parseFloat(editFormData.cost) : undefined,
          nextCheckupDate: editFormData.nextCheckupDate || undefined,
          notes: editFormData.notes || undefined,
        },
      );

      setHealthRecords((prev) =>
        prev.map((record) =>
          record.id === editingRecord.id
            ? {
                ...updatedRecord,
                animalName: editingRecord.animalName,
                animalId: editingRecord.animalId,
              }
            : record,
        ),
      );

      setIsEditDialogOpen(false);
      setEditingRecord(null);

      toast({
        title: "Success",
        description: "Health record updated successfully.",
      });
    } catch (error) {
      console.error("Error updating health record:", error);
      toast({
        title: "Error",
        description: "Failed to update health record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async (
    record: HealthRecord & { animalName: string; animalId: string },
  ) => {
    if (!confirm("Are you sure you want to delete this health record?")) {
      return;
    }

    try {
      await animalApi.deleteHealthRecord(record.id);
      setHealthRecords((prev) => prev.filter((r) => r.id !== record.id));

      toast({
        title: "Success",
        description: "Health record deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting health record:", error);
      toast({
        title: "Error",
        description: "Failed to delete health record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Pagination for grouped records
  const {
    data: paginatedGroupedRecords,
    pagination,
    hasNextPage,
    hasPreviousPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
  } = usePagination(flatGroupedRecords, 5); // Reduce page size since we're showing groups

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading health records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Total Records</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {stats.totalRecords}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Total Cost</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {formatCurrency(stats.totalCost)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Recent (30d)</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {stats.recentRecords}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Upcoming</span>
              </div>
              <div className="text-xl font-bold text-orange-900">
                {stats.upcomingCheckups}
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              stats.overdueCheckups > 0 ? "border-red-200 bg-red-50" : ""
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle
                  className={`h-4 w-4 ${stats.overdueCheckups > 0 ? "text-red-600" : "text-gray-400"}`}
                />
                <span
                  className={`text-sm ${stats.overdueCheckups > 0 ? "text-red-600" : "text-gray-600"}`}
                >
                  Overdue
                </span>
              </div>
              <div
                className={`text-xl font-bold ${stats.overdueCheckups > 0 ? "text-red-900" : "text-gray-900"}`}
              >
                {stats.overdueCheckups}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by description, animal name, or veterinarian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Record Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={animalFilter} onValueChange={setAnimalFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Animal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Animals</SelectItem>
                  {animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Health Records Overview
          </CardTitle>
          <CardDescription>
            All health records across your livestock ({filteredRecords.length}{" "}
            records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No health records found</p>
              <p className="text-sm text-gray-400">
                {healthRecords.length === 0
                  ? "Add health records to start tracking medical history."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedGroupedRecords.map((dateGroup) => (
                  <div
                    key={dateGroup.date}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Date Header */}
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(dateGroup.date)}
                        </h3>
                        <span className="text-sm text-gray-600 ml-2">
                          (
                          {dateGroup.descriptions.reduce(
                            (sum, desc) => sum + desc.records.length,
                            0,
                          )}{" "}
                          records)
                        </span>
                      </div>
                    </div>

                    {/* Descriptions within this date - Collapsible */}
                    <div className="divide-y">
                      {dateGroup.descriptions.map((descriptionGroup) => {
                        const isExpanded = expandedGroups.has(
                          descriptionGroup.id,
                        );

                        // Get unique veterinarians for this group
                        const vets = [
                          ...new Set(
                            descriptionGroup.records
                              .map((r) => r.veterinarianName)
                              .filter(Boolean),
                          ),
                        ];

                        return (
                          <Collapsible key={descriptionGroup.id}>
                            <CollapsibleTrigger
                              onClick={() => toggleGroup(descriptionGroup.id)}
                              className="w-full p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-left">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                  <div>
                                    <h4 className="text-md font-medium text-gray-800">
                                      {descriptionGroup.description}
                                    </h4>
                                    {vets.length > 0 && (
                                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                        <User className="h-3 w-3" />
                                        <span>Vet: {vets.join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    {descriptionGroup.records.length} animal
                                    {descriptionGroup.records.length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-3">
                                {descriptionGroup.records.map((record) => {
                                  const typeInfo = getRecordTypeInfo(
                                    record.recordType,
                                  );
                                  const TypeIcon = typeInfo.icon;

                                  return (
                                    <div
                                      key={`${record.animalId}-${record.id}`}
                                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors ml-6"
                                    >
                                      <div className="space-y-3">
                                        {/* Animal Info - Prominent Display */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <Badge className={typeInfo.color}>
                                              <TypeIcon className="h-3 w-3 mr-1" />
                                              {typeInfo.label}
                                            </Badge>
                                            <div className="text-lg font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                                              {record.animalName}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {record.cost && (
                                              <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                                                <IndianRupee className="h-3 w-3" />
                                                {formatCurrency(record.cost)}
                                              </div>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleEditRecord(record)
                                              }
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleDeleteRecord(record)
                                              }
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          {record.nextCheckupDate && (
                                            <div className="flex items-center gap-1 text-gray-600">
                                              <Clock className="h-3 w-3" />
                                              <span className="font-medium">
                                                Next checkup:
                                              </span>{" "}
                                              {formatDate(
                                                record.nextCheckupDate,
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Clinical Information */}
                                        {(record.diagnosis ||
                                          record.treatment ||
                                          record.medications) && (
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-white p-3 rounded border">
                                            {record.diagnosis && (
                                              <div>
                                                <span className="font-medium text-gray-700">
                                                  Diagnosis:
                                                </span>
                                                <p className="text-gray-600 mt-1">
                                                  {record.diagnosis}
                                                </p>
                                              </div>
                                            )}

                                            {record.treatment && (
                                              <div>
                                                <span className="font-medium text-gray-700">
                                                  Treatment:
                                                </span>
                                                <p className="text-gray-600 mt-1">
                                                  {record.treatment}
                                                </p>
                                              </div>
                                            )}

                                            {record.medications && (
                                              <div>
                                                <span className="font-medium text-gray-700">
                                                  Medications:
                                                </span>
                                                <p className="text-gray-600 mt-1">
                                                  {record.medications}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Notes */}
                                        {record.notes && (
                                          <div className="flex items-start gap-1 text-sm text-gray-700 bg-blue-50 p-3 rounded">
                                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <span className="font-medium">
                                                Notes:
                                              </span>
                                              <p className="mt-1">
                                                {record.notes}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredRecords.length > 0 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={changePageSize}
                  pageSizeOptions={[3, 5, 10, 15]}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Health Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Health Record</DialogTitle>
            <DialogDescription>
              Update the health record details for {editingRecord?.animalName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recordType">Record Type *</Label>
                <Select
                  value={editFormData.recordType}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, recordType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkup">Checkup</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="illness">Illness</SelectItem>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="Brief description of the health record"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="veterinarianName">Veterinarian Name</Label>
              <Input
                id="veterinarianName"
                placeholder="Name of the veterinarian"
                value={editFormData.veterinarianName}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    veterinarianName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Diagnosis details"
                  value={editFormData.diagnosis}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      diagnosis: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Treatment</Label>
                <Textarea
                  id="treatment"
                  placeholder="Treatment provided"
                  value={editFormData.treatment}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      treatment: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Medications</Label>
              <Textarea
                id="medications"
                placeholder="Medications prescribed or administered"
                value={editFormData.medications}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    medications: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.cost}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      cost: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextCheckupDate">Next Checkup Date</Label>
                <Input
                  id="nextCheckupDate"
                  type="date"
                  value={editFormData.nextCheckupDate}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      nextCheckupDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or observations"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Update Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

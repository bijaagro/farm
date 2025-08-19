import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Stethoscope,
  Users,
  CheckSquare,
  Square,
  Search,
  Filter,
} from "lucide-react";
import { AnimalRecord } from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";
import { useToast } from "@/hooks/use-toast";

interface BulkHealthRecordsManagerProps {
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

export default function BulkHealthRecordsManager({
  animals,
}: BulkHealthRecordsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<HealthFormData>({
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

  // Filter animals based on search and status
  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch =
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || animal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedAnimals.length === filteredAnimals.length) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(filteredAnimals.map((animal) => animal.id));
    }
  };

  const handleSelectAnimal = (animalId: string) => {
    setSelectedAnimals((prev) =>
      prev.includes(animalId)
        ? prev.filter((id) => id !== animalId)
        : [...prev, animalId],
    );
  };

  const resetForm = () => {
    setFormData({
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
    setSelectedAnimals([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAnimals.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one animal.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.recordType || !formData.date || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create health records for all selected animals
      const createPromises = selectedAnimals.map((animalId) =>
        animalApi.createHealthRecord({
          animalId,
          recordType: formData.recordType as
            | "checkup"
            | "treatment"
            | "illness"
            | "injury"
            | "other",
          date: formData.date,
          description: formData.description,
          veterinarianName: formData.veterinarianName || undefined,
          diagnosis: formData.diagnosis || undefined,
          treatment: formData.treatment || undefined,
          medications: formData.medications || undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          nextCheckupDate: formData.nextCheckupDate || undefined,
          notes: formData.notes || undefined,
        }),
      );

      await Promise.all(createPromises);

      toast({
        title: "Success",
        description: `Health records added for ${selectedAnimals.length} animals successfully.`,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding bulk health records:", error);
      toast({
        title: "Error",
        description: "Failed to add health records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Stethoscope className="h-4 w-4 mr-2" />
          Manage Health Records
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[100vw] sm:w-[95vw] max-w-4xl h-[100vh] sm:h-[90vh] max-h-[100vh] sm:max-h-[90vh] overflow-hidden p-0 sm:p-6 m-0 sm:m-4 rounded-none sm:rounded-lg">
        <div className="p-4 sm:p-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Stethoscope className="h-5 w-5" />
              Bulk Health Records Management
            </DialogTitle>
            <DialogDescription className="text-sm">
              Add health records to multiple animals at once
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator className="mx-4 sm:mx-0" />

        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedAnimals.length === 0}
              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
            >
              {isSubmitting
                ? "Adding..."
                : `Add Records (${selectedAnimals.length})`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0 h-[calc(100vh-200px)] sm:h-[calc(90vh-160px)] overflow-hidden">
          {/* Animal Selection Panel */}
          <div className="space-y-3 sm:space-y-4 overflow-hidden flex-1 lg:flex-none min-h-0">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Select Animals</h3>
                <Badge variant="secondary" className="text-xs">
                  {selectedAnimals.length} of {filteredAnimals.length} selected
                </Badge>
              </div>

              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search animals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ready_to_sell">Ready to Sell</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="dead">Dead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Select All Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="w-full"
              >
                {selectedAnimals.length === filteredAnimals.length ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All ({filteredAnimals.length})
                  </>
                )}
              </Button>
            </div>

            {/* Animals List */}
            <ScrollArea className="h-64 sm:h-80 border rounded-md p-2 sm:p-3">
              <div className="space-y-1 sm:space-y-2">
                {filteredAnimals.map((animal) => (
                  <div
                    key={animal.id}
                    className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAnimals.includes(animal.id)
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectAnimal(animal.id)}
                  >
                    <Checkbox
                      checked={selectedAnimals.includes(animal.id)}
                      onChange={() => handleSelectAnimal(animal.id)}
                      className="scale-90 sm:scale-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {animal.name}
                        </p>
                        <Badge
                          className={`${getStatusColor(animal.status)} text-xs`}
                          size="sm"
                        >
                          {animal.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {animal.breed} • {animal.type} • {animal.gender}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredAnimals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No animals found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Health Record Form */}
          <div className="space-y-3 sm:space-y-4 overflow-hidden flex-1 lg:flex-none min-h-0">
            <h3 className="text-base sm:text-lg font-semibold">Health Record Details</h3>

            <ScrollArea className="h-64 sm:h-80 lg:h-80">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pr-2 sm:pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="recordType" className="text-sm">Record Type *</Label>
                    <Select
                      value={formData.recordType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, recordType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkup">Routine Checkup</SelectItem>
                        <SelectItem value="treatment">Treatment</SelectItem>
                        <SelectItem value="illness">Illness</SelectItem>
                        <SelectItem value="injury">Injury</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="date" className="text-sm">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="description" className="text-sm">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the health record"
                    required
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="veterinarianName" className="text-sm">Veterinarian</Label>
                    <Input
                      id="veterinarianName"
                      value={formData.veterinarianName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          veterinarianName: e.target.value,
                        }))
                      }
                      placeholder="Dr. Name"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="cost" className="text-sm">Cost per animal (₹)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cost: e.target.value,
                        }))
                      }
                      placeholder="Treatment cost"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="diagnosis" className="text-sm">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        diagnosis: e.target.value,
                      }))
                    }
                    placeholder="Veterinarian's diagnosis"
                    rows={2}
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="treatment" className="text-sm">Treatment</Label>
                  <Textarea
                    id="treatment"
                    value={formData.treatment}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        treatment: e.target.value,
                      }))
                    }
                    placeholder="Treatment provided"
                    rows={2}
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="medications" className="text-sm">Medications</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medications: e.target.value,
                      }))
                    }
                    placeholder="Medications prescribed"
                    rows={2}
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="nextCheckupDate" className="text-sm">Next Checkup Date</Label>
                  <Input
                    id="nextCheckupDate"
                    type="date"
                    value={formData.nextCheckupDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nextCheckupDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="notes" className="text-sm">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Any additional notes"
                    rows={2}
                  />
                </div>
              </form>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

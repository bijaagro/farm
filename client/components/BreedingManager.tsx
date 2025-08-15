import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Baby,
  Heart,
  Calendar,
  User,
  FileText,
  Trash2,
  Edit,
  Users,
  Rabbit,
  ChevronDown,
  ChevronRight,
  Save,
  X,
} from "lucide-react";
import {
  AnimalRecord,
  BreedingRecord,
  AnimalGender,
  AnimalStatus,
} from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";
import { useToast } from "@/hooks/use-toast";
import KidForm from "./KidForm";

interface BreedingManagerProps {
  mother: AnimalRecord;
  allAnimals: AnimalRecord[];
  onUpdateAnimals: () => void;
}

interface KidFormData {
  name: string;
  gender: AnimalGender;
  weight: string;
  status: "alive" | "stillborn" | "died_after_birth";
  markings: string;
  notes: string;
}

interface BreedingFormData {
  fatherId: string;
  breedingDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  breedingMethod: "natural" | "artificial_insemination";
  veterinarianName: string;
  complications: string;
  notes: string;
  kids: KidFormData[];
}

export default function BreedingManager({
  mother,
  allAnimals,
  onUpdateAnimals,
}: BreedingManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  const [editingKid, setEditingKid] = useState<{
    recordId: string;
    kidIndex: number;
  } | null>(null);
  const [editKidData, setEditKidData] = useState<any>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(
    new Set(),
  );
  const [isKidFormOpen, setIsKidFormOpen] = useState(false);
  const [editingKidIndex, setEditingKidIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<BreedingFormData>({
    fatherId: "unknown",
    breedingDate: "",
    expectedDeliveryDate: "",
    actualDeliveryDate: new Date().toISOString().split("T")[0],
    breedingMethod: "natural",
    veterinarianName: "",
    complications: "",
    notes: "",
    kids: [],
  });
  const { toast } = useToast();

  // Get male animals for father selection
  const maleAnimals = allAnimals.filter(
    (animal) =>
      animal.type === mother.type &&
      animal.gender === "male" &&
      animal.status === "active",
  );

  useEffect(() => {
    if (isDialogOpen) {
      loadBreedingRecords();
    }
  }, [isDialogOpen, mother.id]);

  const loadBreedingRecords = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshingHistory(true);
      } else {
        setLoading(true);
      }
      const records = await animalApi.fetchBreedingRecords(mother.id);
      setBreedingRecords(records);
    } catch (error) {
      console.error("Error loading breeding records:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding records.",
        variant: "destructive",
      });
    } finally {
      if (isRefresh) {
        setRefreshingHistory(false);
      } else {
        setLoading(false);
      }
    }
  };

  const addKidFromForm = (kidData: KidFormData) => {
    setFormData((prev) => ({
      ...prev,
      kids: [...prev.kids, kidData],
    }));
  };

  const removeKid = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      kids: prev.kids.filter((_, i) => i !== index),
    }));
  };

  const updateKid = (index: number, kidData: KidFormData) => {
    setFormData((prev) => ({
      ...prev,
      kids: prev.kids.map((kid, i) => (i === index ? kidData : kid)),
    }));
    setEditingKidIndex(null);
  };

  const startEditingKid = (index: number) => {
    setEditingKidIndex(index);
    setIsKidFormOpen(true);
  };

  const calculateExpectedDelivery = (breedingDate: string) => {
    if (breedingDate) {
      const breeding = new Date(breedingDate);
      const expectedDays = mother.type === "goat" ? 150 : 147; // Goat: ~150 days, Sheep: ~147 days
      breeding.setDate(breeding.getDate() + expectedDays);
      return breeding.toISOString().split("T")[0];
    }
    return "";
  };

  const handleBreedingDateChange = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      breedingDate: date,
      expectedDeliveryDate: calculateExpectedDelivery(date),
    }));
  };

  const getFatherName = (fatherId?: string) => {
    if (!fatherId) return "Unknown";
    const father = allAnimals.find((a) => a.id === fatherId);
    return father ? father.name : "Unknown";
  };

  const toggleRecordExpansion = (recordId: string) => {
    setExpandedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const startEditingHistoryKid = (
    recordId: string,
    kidIndex: number,
    kidData: any,
  ) => {
    setEditingKid({ recordId, kidIndex });
    setEditKidData({ ...kidData });
  };

  const cancelEditingHistoryKid = () => {
    setEditingKid(null);
    setEditKidData(null);
  };

  const saveKidEdit = async () => {
    if (!editingKid || !editKidData) return;

    try {
      // Find the breeding record
      const record = breedingRecords.find((r) => r.id === editingKid.recordId);
      if (!record || !record.kidDetails) return;

      // Get the animal ID
      const animalId = record.kidDetails[editingKid.kidIndex];
      if (!animalId) return;

      // Find the current animal record
      const currentAnimal = allAnimals.find((a) => a.id === animalId);
      if (!currentAnimal) return;

      // Determine new status based on editKidData.status
      let newStatus: AnimalStatus;
      let deathDate: string | undefined;
      let deathCause: string | undefined;

      switch (editKidData.status) {
        case "alive":
          newStatus = "active";
          deathDate = undefined;
          deathCause = undefined;
          break;
        case "stillborn":
          newStatus = "dead";
          deathDate = currentAnimal.dateOfBirth;
          deathCause = "stillborn";
          break;
        case "died_after_birth":
          newStatus = "dead";
          deathDate = currentAnimal.dateOfBirth;
          deathCause = "died after birth";
          break;
        default:
          newStatus = currentAnimal.status;
      }

      // Update the animal record
      const updatedAnimal = {
        ...currentAnimal,
        name: editKidData.name || currentAnimal.name,
        gender: editKidData.gender,
        currentWeight: editKidData.currentWeight
          ? parseFloat(String(editKidData.currentWeight))
          : currentAnimal.currentWeight,
        status: newStatus,
        deathDate,
        deathCause,
        updatedAt: new Date().toISOString(),
      };

      await animalApi.updateAnimal(animalId, updatedAnimal);

      // Refresh the records and animals
      await loadBreedingRecords(true);
      onUpdateAnimals(); // This will refresh the allAnimals list

      toast({
        title: "Kid Updated Successfully",
        description: "Kid information has been updated.",
      });

      cancelEditingHistoryKid();
    } catch (error) {
      console.error("Error updating kid:", error);
      toast({
        title: "Error",
        description: "Failed to update kid information.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.actualDeliveryDate) {
      toast({
        title: "Birth Date Required",
        description: "Please select the birth date before saving the record.",
        variant: "destructive",
      });
      return;
    }

    if (formData.kids.length === 0) {
      toast({
        title: "No Kids Added",
        description:
          "Please click 'Add Kid' to add at least one offspring. For multiple births, click 'Add Kid' multiple times.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create animal records for all kids first
      const newAnimalIds: string[] = [];
      for (let index = 0; index < formData.kids.length; index++) {
        const kid = formData.kids[index];
        try {
          // Generate default name if none provided
          const kidName =
            kid.name ||
            `${mother.name}-Kid-${index + 1}-${new Date(formData.actualDeliveryDate).getFullYear()}`;

          // Determine status based on kid status
          let animalStatus: AnimalStatus;
          switch (kid.status) {
            case "alive":
              animalStatus = "active";
              break;
            case "stillborn":
            case "died_after_birth":
              animalStatus = "dead";
              break;
            default:
              animalStatus = "active";
          }

          const newAnimal = await animalApi.createAnimal({
            name: kidName,
            type: mother.type,
            breed: mother.breed,
            gender: kid.gender,
            dateOfBirth: formData.actualDeliveryDate,
            photos: [],
            status: animalStatus,
            currentWeight: kid.weight ? parseFloat(kid.weight) : undefined,
            markings: kid.markings || undefined,
            motherId: mother.id,
            fatherId:
              formData.fatherId !== "unknown" ? formData.fatherId : undefined,
            offspring: [],
            insured: false,
            notes: kid.notes || undefined,
            // Add death details for non-alive kids
            deathDate:
              kid.status !== "alive" ? formData.actualDeliveryDate : undefined,
            deathCause:
              kid.status === "stillborn"
                ? "stillborn"
                : kid.status === "died_after_birth"
                  ? "died after birth"
                  : undefined,
          });
          newAnimalIds.push(newAnimal.id);
        } catch (error) {
          console.error(
            `Error creating animal record for Kid #${index + 1}:`,
            error,
          );
          // Show user-friendly error message
          toast({
            title: "Error Creating Animal Record",
            description: `Failed to create animal record for Kid #${index + 1}. Please try again.`,
            variant: "destructive",
          });
          return; // Stop processing if any kid fails
        }
      }

      // Create breeding record with animal IDs
      const breedingRecord = await animalApi.createBreedingRecord({
        motherId: mother.id,
        fatherId:
          formData.fatherId !== "unknown" ? formData.fatherId : undefined,
        breedingDate: formData.breedingDate || formData.actualDeliveryDate,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        actualDeliveryDate: formData.actualDeliveryDate,
        totalKids: formData.kids.length,
        maleKids: formData.kids.filter((kid) => kid.gender === "male").length,
        femaleKids: formData.kids.filter((kid) => kid.gender === "female")
          .length,
        breedingMethod: formData.breedingMethod,
        veterinarianName: formData.veterinarianName || undefined,
        complications: formData.complications || undefined,
        notes: formData.notes || undefined,
        kidDetails: newAnimalIds, // Store only animal IDs
      });

      // Update breeding record ID in all created animals
      for (const animalId of newAnimalIds) {
        try {
          const animal = await animalApi
            .fetchAnimals()
            .then((animals) => animals.find((a) => a.id === animalId));
          if (animal) {
            await animalApi.updateAnimal(animalId, {
              ...animal,
              breedingRecordId: breedingRecord.id,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(
            `Error updating breeding record ID for animal ${animalId}:`,
            error,
          );
        }
      }

      // Update mother's offspring list
      if (newAnimalIds.length > 0) {
        try {
          const updatedMother = {
            ...mother,
            offspring: [...(mother.offspring || []), ...newAnimalIds],
            updatedAt: new Date().toISOString(),
          };
          await animalApi.updateAnimal(mother.id, updatedMother);
        } catch (error) {
          console.error("Error updating mother's offspring:", error);
        }
      }

      // Update father's offspring list if father is selected
      if (
        formData.fatherId !== "unknown" &&
        formData.fatherId &&
        newAnimalIds.length > 0
      ) {
        try {
          const father = allAnimals.find((a) => a.id === formData.fatherId);
          if (father) {
            const updatedFather = {
              ...father,
              offspring: [...(father.offspring || []), ...newAnimalIds],
              updatedAt: new Date().toISOString(),
            };
            await animalApi.updateAnimal(formData.fatherId, updatedFather);
          }
        } catch (error) {
          console.error("Error updating father's offspring:", error);
        }
      }

      toast({
        title: "Birth Record Created Successfully! 🎉",
        description: `Added ${formData.kids.length} kid${formData.kids.length !== 1 ? "s" : ""} to breeding history and livestock. All kids are now visible in the Animal Tracker and breeding history.`,
      });

      // Refresh breeding records and keep dialog open to show updated history
      await loadBreedingRecords(true);
      resetForm();
      onUpdateAnimals();

      // Optional: close dialog after a short delay to show the updated history
      // You can remove the timeout if you want to keep the dialog open
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Error creating breeding record:", error);
      toast({
        title: "Error",
        description: "Failed to create breeding record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fatherId: "unknown",
      breedingDate: "",
      expectedDeliveryDate: "",
      actualDeliveryDate: new Date().toISOString().split("T")[0],
      breedingMethod: "natural",
      veterinarianName: "",
      complications: "",
      notes: "",
      kids: [],
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
            title="Breeding & Birth Records - Click to record new births and view breeding history"
          >
            <Rabbit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Breeding & Offspring Management - {mother.name}
            </DialogTitle>
            <DialogDescription>
              Record births and manage offspring for {mother.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(95vh-120px)]">
            {/* Breeding History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-600" />
                  Breeding History
                </h3>
                {breedingRecords.length > 0 && (
                  <Badge className="bg-pink-100 text-pink-800">
                    {breedingRecords.length} record
                    {breedingRecords.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-[calc(95vh-300px)] min-h-[400px] border rounded-md p-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-pink-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">
                      Loading breeding records...
                    </p>
                  </div>
                ) : refreshingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-green-600">
                      Updating breeding history...
                    </p>
                  </div>
                ) : breedingRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Baby className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No breeding records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {breedingRecords.map((record) => (
                      <Card key={record.id} className="border-pink-200">
                        <Collapsible
                          open={expandedRecords.has(record.id)}
                          onOpenChange={() => toggleRecordExpansion(record.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader className="p-4 pb-2 cursor-pointer hover:bg-pink-50/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {expandedRecords.has(record.id) ? (
                                    <ChevronDown className="h-4 w-4 text-pink-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-pink-600" />
                                  )}
                                  <Badge className="bg-pink-100 text-pink-800">
                                    {record.totalKids} Kid
                                    {record.totalKids !== 1 ? "s" : ""}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {formatDate(
                                      record.actualDeliveryDate ||
                                        record.breedingDate,
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm space-y-1 text-left">
                                <p>
                                  <strong>Father:</strong>{" "}
                                  {getFatherName(record.fatherId)}
                                </p>
                                {record.maleKids !== undefined &&
                                  record.femaleKids !== undefined && (
                                    <p>
                                      <strong>Gender:</strong> {record.maleKids}
                                      M / {record.femaleKids}F
                                    </p>
                                  )}
                                {record.breedingMethod && (
                                  <p>
                                    <strong>Method:</strong>{" "}
                                    {record.breedingMethod.replace("_", " ")}
                                  </p>
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="p-4 pt-0">
                              {record.kidDetails &&
                              record.kidDetails.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Baby className="h-4 w-4 text-pink-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Individual Kids:
                                    </span>
                                  </div>
                                  {record.kidDetails.map(
                                    (animalId, kidIndex) => {
                                      // Find the animal by ID from allAnimals
                                      const kid = allAnimals.find(
                                        (a) => a.id === animalId,
                                      );
                                      if (!kid) return null;

                                      const isEditing =
                                        editingKid?.recordId === record.id &&
                                        editingKid?.kidIndex === kidIndex;

                                      return (
                                        <Card
                                          key={kidIndex}
                                          className="border-blue-200 bg-blue-50/30"
                                        >
                                          <CardContent className="p-3">
                                            {isEditing ? (
                                              <div className="space-y-3">
                                                <div className="flex items-center justify-between mb-2">
                                                  <span className="text-sm font-medium text-blue-700">
                                                    Editing Kid #{kidIndex + 1}
                                                  </span>
                                                  <div className="flex gap-1">
                                                    <Button
                                                      size="sm"
                                                      onClick={saveKidEdit}
                                                      className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                                    >
                                                      <Save className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={
                                                        cancelEditingHistoryKid
                                                      }
                                                      className="h-7 px-2"
                                                    >
                                                      <X className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                  <div className="space-y-1">
                                                    <Label className="text-xs">
                                                      Name
                                                    </Label>
                                                    <Input
                                                      value={
                                                        editKidData.name || ""
                                                      }
                                                      onChange={(e) =>
                                                        setEditKidData(
                                                          (prev) => ({
                                                            ...prev,
                                                            name: e.target
                                                              .value,
                                                          }),
                                                        )
                                                      }
                                                      placeholder="Kid name"
                                                    />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <Label className="text-xs">
                                                      Gender
                                                    </Label>
                                                    <Select
                                                      value={editKidData.gender}
                                                      onValueChange={(value) =>
                                                        setEditKidData(
                                                          (prev) => ({
                                                            ...prev,
                                                            gender: value,
                                                          }),
                                                        )
                                                      }
                                                    >
                                                      <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="female">
                                                          Female
                                                        </SelectItem>
                                                        <SelectItem value="male">
                                                          Male
                                                        </SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  <div className="space-y-1">
                                                    <Label className="text-xs">
                                                      Weight (kg)
                                                    </Label>
                                                    <Input
                                                      type="number"
                                                      step="0.1"
                                                      value={
                                                        editKidData.currentWeight ||
                                                        ""
                                                      }
                                                      onChange={(e) =>
                                                        setEditKidData(
                                                          (prev) => ({
                                                            ...prev,
                                                            currentWeight:
                                                              e.target.value,
                                                          }),
                                                        )
                                                      }
                                                      placeholder="Weight"
                                                    />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <Label className="text-xs">
                                                      Status
                                                    </Label>
                                                    <Select
                                                      value={
                                                        editKidData.status ===
                                                        "active"
                                                          ? "alive"
                                                          : editKidData.deathCause ===
                                                              "stillborn"
                                                            ? "stillborn"
                                                            : editKidData.deathCause ===
                                                                "died after birth"
                                                              ? "died_after_birth"
                                                              : "alive"
                                                      }
                                                      onValueChange={(value) =>
                                                        setEditKidData(
                                                          (prev) => ({
                                                            ...prev,
                                                            status: value,
                                                          }),
                                                        )
                                                      }
                                                    >
                                                      <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="alive">
                                                          Alive
                                                        </SelectItem>
                                                        <SelectItem value="stillborn">
                                                          Stillborn
                                                        </SelectItem>
                                                        <SelectItem value="died_after_birth">
                                                          Died After Birth
                                                        </SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Baby className="h-3 w-3 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-700">
                                                      Kid #{kidIndex + 1}
                                                    </span>
                                                    {kid.name && (
                                                      <span className="text-sm text-blue-600">
                                                        - {kid.name}
                                                      </span>
                                                    )}
                                                    <Badge
                                                      variant={
                                                        kid.status === "active"
                                                          ? "default"
                                                          : "destructive"
                                                      }
                                                      className="text-xs px-1 py-0"
                                                    >
                                                      {kid.status === "active"
                                                        ? "alive"
                                                        : kid.deathCause ===
                                                            "stillborn"
                                                          ? "stillborn"
                                                          : kid.deathCause ===
                                                              "died after birth"
                                                            ? "died after birth"
                                                            : "dead"}
                                                    </Badge>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                      startEditingHistoryKid(
                                                        record.id,
                                                        kidIndex,
                                                        kid,
                                                      )
                                                    }
                                                    className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Gender:
                                                    </span>
                                                    <span className="ml-1 capitalize">
                                                      {kid.gender} (
                                                      {kid.gender === "male"
                                                        ? "M"
                                                        : "F"}
                                                      )
                                                    </span>
                                                  </div>
                                                  {kid.currentWeight && (
                                                    <div>
                                                      <span className="text-gray-500">
                                                        Weight:
                                                      </span>
                                                      <span className="ml-1">
                                                        {kid.currentWeight} kg
                                                      </span>
                                                    </div>
                                                  )}
                                                  {kid.markings && (
                                                    <div className="col-span-2">
                                                      <span className="text-gray-500">
                                                        Markings:
                                                      </span>
                                                      <span className="ml-1">
                                                        {kid.markings}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      );
                                    },
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-sm text-gray-500">
                                  <Baby className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                                  No individual kid details recorded
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* New Breeding Record Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Add New Birth Record
              </h3>
              <ScrollArea className="h-[calc(95vh-300px)] min-h-[400px]">
                <form onSubmit={handleSubmit} className="space-y-4 pr-3">
                  {/* Breeding Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Breeding Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherId">Father (Optional)</Label>
                        <Select
                          value={formData.fatherId}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              fatherId: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select father" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unknown">
                              Unknown/No Record
                            </SelectItem>
                            {maleAnimals.map((male) => (
                              <SelectItem key={male.id} value={male.id}>
                                {male.name} ({male.breed})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="breedingDate">
                          Breeding Date (Optional)
                        </Label>
                        <Input
                          id="breedingDate"
                          type="date"
                          value={formData.breedingDate}
                          onChange={(e) =>
                            handleBreedingDateChange(e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="actualDeliveryDate">Birth Date *</Label>
                        <Input
                          id="actualDeliveryDate"
                          type="date"
                          value={formData.actualDeliveryDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              actualDeliveryDate: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="breedingMethod">Breeding Method</Label>
                        <Select
                          value={formData.breedingMethod}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              breedingMethod: value as
                                | "natural"
                                | "artificial_insemination",
                            }))
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
                    </div>
                  </div>

                  <Separator />

                  {/* Kids Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Baby className="h-4 w-4 text-pink-600" />
                        Kids Information
                        <Badge
                          variant={
                            formData.kids.length > 1 ? "default" : "secondary"
                          }
                          className={
                            formData.kids.length > 1
                              ? "bg-green-100 text-green-800 text-xs"
                              : "text-xs"
                          }
                        >
                          {formData.kids.length} Kid
                          {formData.kids.length !== 1 ? "s" : ""}
                          {formData.kids.length > 1 && " (Multiple Birth)"}
                        </Badge>
                      </h4>
                      <Button
                        type="button"
                        onClick={() => setIsKidFormOpen(true)}
                        size="sm"
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                        title="Click to add a new kid"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Kid
                      </Button>
                    </div>

                    {/* Kids Grid */}
                    {formData.kids.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-pink-200 rounded-lg bg-pink-50/30">
                        <Baby className="h-8 w-8 mx-auto mb-2 text-pink-400" />
                        <p className="text-pink-600 font-medium mb-1">
                          No kids added yet
                        </p>
                        <p className="text-pink-500 text-sm mb-2">
                          Click "Add Kid" to record offspring details
                        </p>
                        <p className="text-pink-400 text-xs">
                          💡 For multiple births (twins, triplets, etc.), click
                          "Add Kid" multiple times
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {formData.kids.map((kid, index) => (
                          <Card
                            key={index}
                            className="border-pink-200 bg-pink-50/30"
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Baby className="h-4 w-4 text-pink-600" />
                                    <span className="text-sm font-medium text-pink-700">
                                      Kid #{index + 1}
                                    </span>
                                    {kid.name && (
                                      <span className="text-sm text-pink-600">
                                        - {kid.name}
                                      </span>
                                    )}
                                    <Badge
                                      variant={
                                        kid.status === "alive"
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="text-xs px-1 py-0"
                                    >
                                      {kid.status}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditingKid(index)}
                                      className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeKid(index)}
                                      className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  <div>
                                    <span className="text-gray-500">
                                      Gender:
                                    </span>
                                    <span className="ml-1 capitalize">
                                      {kid.gender} (
                                      {kid.gender === "male" ? "M" : "F"})
                                    </span>
                                  </div>
                                  {kid.weight && (
                                    <div>
                                      <span className="text-gray-500">
                                        Weight:
                                      </span>
                                      <span className="ml-1">
                                        {kid.weight} kg
                                      </span>
                                    </div>
                                  )}
                                  {kid.markings && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500">
                                        Markings:
                                      </span>
                                      <span className="ml-1">
                                        {kid.markings}
                                      </span>
                                    </div>
                                  )}
                                  <div className="col-span-2">
                                    <span className="text-green-600 text-xs">
                                      ✓ Will create animal record
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Additional Information
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="veterinarianName">Veterinarian</Label>
                        <Input
                          id="veterinarianName"
                          value={formData.veterinarianName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              veterinarianName: e.target.value,
                            }))
                          }
                          placeholder="Attending veterinarian"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complications">Complications</Label>
                        <Textarea
                          id="complications"
                          value={formData.complications}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              complications: e.target.value,
                            }))
                          }
                          placeholder="Any birth complications"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {submitting ? "Creating..." : "Create Birth Record"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kid Form Dialog */}
      <KidForm
        isOpen={isKidFormOpen}
        onClose={() => {
          setIsKidFormOpen(false);
          setEditingKidIndex(null);
        }}
        onAdd={
          editingKidIndex !== null
            ? (kidData) => updateKid(editingKidIndex, kidData)
            : addKidFromForm
        }
        motherName={mother.name}
        birthDate={formData.actualDeliveryDate}
        kidNumber={
          editingKidIndex !== null
            ? editingKidIndex + 1
            : formData.kids.length + 1
        }
      />
    </>
  );
}

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
  const [submitting, setSubmitting] = useState(false);
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

      // Reset form and close dialog
      resetForm();
      onUpdateAnimals();
      setIsDialogOpen(false);
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
            title="Add Kids - Click to record new births for this animal"
          >
            <Rabbit className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add Kids</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Baby className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Add Kids - {mother.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record new births and add kids for {mother.name}. The breeding summary will appear on the animal card after saving.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(95vh-160px)] overflow-hidden">
            <ScrollArea className="h-[600px] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Birth Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-pink-600" />
                      Birth Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>

                  <Separator />

                  {/* Kids Information */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                        <Baby className="h-4 w-4 text-pink-600" />
                        <span>Kids Details</span>
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
                        className="bg-pink-600 hover:bg-pink-700 text-white self-start sm:self-auto"
                        title="Click to add a new kid"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Add Kid</span>
                        <span className="sm:hidden">Add</span>
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
                          Click "Add Kid" to record each offspring
                        </p>
                        <p className="text-pink-400 text-xs">
                          💡 For twins, triplets, etc., add each kid separately
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-80 sm:max-h-96 overflow-y-auto">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                                    <div className="sm:col-span-2">
                                      <span className="text-gray-500">
                                        Markings:
                                      </span>
                                      <span className="ml-1">
                                        {kid.markings}
                                      </span>
                                    </div>
                                  )}
                                  <div className="sm:col-span-2">
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

                  {/* Notes Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      Additional Notes (Optional)
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Birth Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Any additional information about the birth..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={submitting || formData.kids.length === 0}
                      className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto"
                    >
                      {submitting ? "Adding Kids..." : `Add ${formData.kids.length} Kid${formData.kids.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
            </ScrollArea>
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

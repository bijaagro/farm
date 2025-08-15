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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AnimalRecord,
  AnimalType,
  AnimalGender,
  AnimalStatus,
} from "@shared/animal-types";
import { fetchAnimals } from "@/lib/animal-api";

interface AnimalFormProps {
  animal?: AnimalRecord | null;
  onSubmit: (
    animal: Omit<AnimalRecord, "id" | "createdAt" | "updatedAt"> | AnimalRecord,
  ) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isOffspring?: boolean;
  parentMotherId?: string;
  parentFatherId?: string;
}

export default function AnimalForm({
  animal,
  onSubmit,
  onCancel,
  isEditing = false,
  isOffspring = false,
  parentMotherId,
  parentFatherId,
}: AnimalFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "goat" as AnimalType,
    breed: "",
    gender: "female" as AnimalGender,
    dateOfBirth: "",
    status: "active" as AnimalStatus,
    currentWeight: "",
    markings: "",
    purchaseDate: "",
    purchasePrice: "",
    purchaseLocation: "",
    previousOwner: "",
    saleDate: "",
    salePrice: "",
    buyerName: "",
    saleNotes: "",
    insured: false,
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceAmount: "",
    insuranceExpiryDate: "",
    notes: "",
    motherId: "",
    fatherId: "",
  });

  const [availableAnimals, setAvailableAnimals] = useState<AnimalRecord[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  useEffect(() => {
    if (animal) {
      setFormData({
        name: animal.name || "",
        type: animal.type || "goat",
        breed: animal.breed || "",
        gender: animal.gender || "female",
        dateOfBirth: animal.dateOfBirth || "",
        status: animal.status || "active",
        currentWeight: animal.currentWeight?.toString() || "",
        markings: animal.markings || "",
        purchaseDate: animal.purchaseDate || "",
        purchasePrice: animal.purchasePrice?.toString() || "",
        purchaseLocation: animal.purchaseLocation || "",
        previousOwner: animal.previousOwner || "",
        saleDate: animal.saleDate || "",
        salePrice: animal.salePrice?.toString() || "",
        buyerName: animal.buyerName || "",
        saleNotes: animal.saleNotes || "",
        insured: animal.insured || false,
        insuranceProvider: animal.insuranceProvider || "",
        insurancePolicyNumber: animal.insurancePolicyNumber || "",
        insuranceAmount: animal.insuranceAmount?.toString() || "",
        insuranceExpiryDate: animal.insuranceExpiryDate || "",
        notes: animal.notes || "",
        motherId: animal.motherId || "",
        fatherId: animal.fatherId || "",
      });
    } else if (isOffspring) {
      setFormData((prev) => ({
        ...prev,
        motherId: parentMotherId || "",
        fatherId: parentFatherId || "",
        status: "active" as AnimalStatus,
      }));
    }
  }, [animal, isOffspring, parentMotherId, parentFatherId]);

  useEffect(() => {
    const loadAnimals = async () => {
      if (isOffspring && !isEditing) {
        setLoadingAnimals(true);
        try {
          const animals = await fetchAnimals();
          setAvailableAnimals(animals.filter((a) => a.status === "active"));
        } catch (error) {
          console.error("Failed to fetch animals:", error);
        } finally {
          setLoadingAnimals(false);
        }
      }
    };
    loadAnimals();
  }, [isOffspring, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const animalData = {
      name: formData.name,
      type: formData.type,
      breed: formData.breed,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth || undefined,
      photos: animal?.photos || [],
      status: formData.status,
      currentWeight: formData.currentWeight
        ? parseFloat(formData.currentWeight)
        : undefined,
      markings: formData.markings || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchasePrice: formData.purchasePrice
        ? parseFloat(formData.purchasePrice)
        : undefined,
      purchaseLocation: formData.purchaseLocation || undefined,
      previousOwner: formData.previousOwner || undefined,
      saleDate: formData.saleDate || undefined,
      salePrice: formData.salePrice
        ? parseFloat(formData.salePrice)
        : undefined,
      buyerName: formData.buyerName || undefined,
      saleNotes: formData.saleNotes || undefined,
      insured: formData.insured,
      insuranceProvider: formData.insuranceProvider || undefined,
      insurancePolicyNumber: formData.insurancePolicyNumber || undefined,
      insuranceAmount: formData.insuranceAmount
        ? parseFloat(formData.insuranceAmount)
        : undefined,
      insuranceExpiryDate: formData.insuranceExpiryDate || undefined,
      notes: formData.notes || undefined,
      motherId: formData.motherId || undefined,
      fatherId: formData.fatherId || undefined,
      offspring: animal?.offspring || [],
    };

    if (isEditing && animal) {
      onSubmit({
        ...animalData,
        id: animal.id,
        createdAt: animal.createdAt,
        updatedAt: new Date().toISOString(),
      } as AnimalRecord);
    } else {
      onSubmit(animalData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[70vh] overflow-y-auto"
    >
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isOffspring ? "Offspring Information" : "Basic Information"}
        </h3>

        {isOffspring && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              🐑 Creating offspring record
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Parent relationships will be automatically established
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              placeholder="Enter animal name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goat">Goat</SelectItem>
                <SelectItem value="sheep">Sheep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Breed *</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) => handleInputChange("breed", e.target.value)}
              required
              placeholder="Enter breed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ready_to_sell">Ready to Sell</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="markings">Markings</Label>
          <Textarea
            id="markings"
            value={formData.markings}
            onChange={(e) => handleInputChange("markings", e.target.value)}
            placeholder="Describe physical markings"
            rows={2}
          />
        </div>
      </div>

      {/* Parent Information (for offspring) */}
      {isOffspring && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Parent Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motherId">Mother *</Label>
              <Select
                value={formData.motherId}
                onValueChange={(value) => handleInputChange("motherId", value)}
                disabled={loadingAnimals}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mother" />
                </SelectTrigger>
                <SelectContent>
                  {availableAnimals
                    .filter((animal) => animal.gender === "female")
                    .map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name} ({animal.breed})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherId">Father</Label>
              <Select
                value={formData.fatherId}
                onValueChange={(value) => handleInputChange("fatherId", value)}
                disabled={loadingAnimals}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select father (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No father selected</SelectItem>
                  {availableAnimals
                    .filter((animal) => animal.gender === "male")
                    .map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name} ({animal.breed})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Physical Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Physical Information
        </h3>
        <div className="space-y-2">
          <Label htmlFor="currentWeight">Current Weight (kg)</Label>
          <Input
            id="currentWeight"
            type="number"
            step="0.1"
            value={formData.currentWeight}
            onChange={(e) => handleInputChange("currentWeight", e.target.value)}
            placeholder="Enter weight in kg"
          />
        </div>
      </div>

      {/* Purchase Information - Hidden for offspring */}
      {!isOffspring && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Purchase Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  handleInputChange("purchaseDate", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) =>
                  handleInputChange("purchasePrice", e.target.value)
                }
                placeholder="Enter purchase price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseLocation">Purchase Location</Label>
              <Input
                id="purchaseLocation"
                value={formData.purchaseLocation}
                onChange={(e) =>
                  handleInputChange("purchaseLocation", e.target.value)
                }
                placeholder="Where was it purchased"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousOwner">Previous Owner</Label>
              <Input
                id="previousOwner"
                value={formData.previousOwner}
                onChange={(e) =>
                  handleInputChange("previousOwner", e.target.value)
                }
                placeholder="Previous owner name"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sale Information (only if status is sold) */}
      {formData.status === "sold" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Sale Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date</Label>
              <Input
                id="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleInputChange("saleDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (₹)</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => handleInputChange("salePrice", e.target.value)}
                placeholder="Enter sale price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerName">Buyer Name</Label>
              <Input
                id="buyerName"
                value={formData.buyerName}
                onChange={(e) => handleInputChange("buyerName", e.target.value)}
                placeholder="Buyer name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleNotes">Sale Notes</Label>
            <Textarea
              id="saleNotes"
              value={formData.saleNotes}
              onChange={(e) => handleInputChange("saleNotes", e.target.value)}
              placeholder="Additional sale notes"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Insurance Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Insurance Information
        </h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="insured"
            checked={formData.insured}
            onCheckedChange={(checked) =>
              handleInputChange("insured", checked as boolean)
            }
          />
          <Label htmlFor="insured">This animal is insured</Label>
        </div>

        {formData.insured && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Input
                id="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={(e) =>
                  handleInputChange("insuranceProvider", e.target.value)
                }
                placeholder="Insurance company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
              <Input
                id="insurancePolicyNumber"
                value={formData.insurancePolicyNumber}
                onChange={(e) =>
                  handleInputChange("insurancePolicyNumber", e.target.value)
                }
                placeholder="Policy number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceAmount">Insurance Amount (₹)</Label>
              <Input
                id="insuranceAmount"
                type="number"
                step="0.01"
                value={formData.insuranceAmount}
                onChange={(e) =>
                  handleInputChange("insuranceAmount", e.target.value)
                }
                placeholder="Insurance coverage amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceExpiryDate">Expiry Date</Label>
              <Input
                id="insuranceExpiryDate"
                type="date"
                value={formData.insuranceExpiryDate}
                onChange={(e) =>
                  handleInputChange("insuranceExpiryDate", e.target.value)
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Additional Notes
        </h3>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Any additional notes about this animal"
            rows={3}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          {isEditing
            ? "Update Animal"
            : isOffspring
              ? "Add Offspring"
              : "Add Animal"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

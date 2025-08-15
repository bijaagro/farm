import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimalRecord, AnimalStatus } from "@shared/animal-types";
import {
  CalendarDays,
  MapPin,
  User,
  Weight,
  Shield,
  IndianRupee,
  Edit,
  FileText,
  Eye,
  Activity,
  Stethoscope,
  Users,
  Baby,
  Heart,
  Plus,
} from "lucide-react";
import WeightTracker from "@/components/WeightTracker";
import AnimalForm from "@/components/AnimalForm";
import * as animalApi from "@/lib/animal-api";
import { useToast } from "@/hooks/use-toast";

interface AnimalViewProps {
  animal: AnimalRecord;
  allAnimals?: AnimalRecord[];
  onEdit: () => void;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function AnimalView({
  animal,
  allAnimals = [],
  onEdit,
  onClose,
  onUpdate,
}: AnimalViewProps) {
  const [isAddOffspringDialogOpen, setIsAddOffspringDialogOpen] =
    useState(false);
  const { toast } = useToast();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMilliseconds = now.getTime() - birth.getTime();
    const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));

    if (ageInDays < 30) {
      return `${ageInDays} days`;
    } else if (ageInDays < 365) {
      const months = Math.floor(ageInDays / 30);
      return `${months} month${months > 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(ageInDays / 365);
      const remainingMonths = Math.floor((ageInDays % 365) / 30);
      return `${years} year${years > 1 ? "s" : ""}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}` : ""}`;
    }
  };

  const handleAddOffspring = async (
    newOffspring: Omit<AnimalRecord, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const createdOffspring = await animalApi.createAnimal(newOffspring);

      // Update parent's offspring list
      const updatedParent = {
        ...animal,
        offspring: [...(animal.offspring || []), createdOffspring.id],
        updatedAt: new Date().toISOString(),
      };
      await animalApi.updateAnimal(animal.id, updatedParent);

      // Update father's offspring list if father is specified
      if (newOffspring.fatherId) {
        const father = allAnimals.find((a) => a.id === newOffspring.fatherId);
        if (father) {
          const updatedFather = {
            ...father,
            offspring: [...(father.offspring || []), createdOffspring.id],
            updatedAt: new Date().toISOString(),
          };
          await animalApi.updateAnimal(father.id, updatedFather);
        }
      }

      setIsAddOffspringDialogOpen(false);
      toast({
        title: "Success",
        description: "Offspring added successfully",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding offspring:", error);
      toast({
        title: "Error",
        description: "Failed to add offspring. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{animal.name}</h2>
            <Badge className={getStatusColor(animal.status)}>
              {getStatusText(animal.status)}
            </Badge>
          </div>
          <p className="text-gray-600">
            {animal.breed} • {animal.type} • {animal.gender}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="weight" className="flex items-center gap-2">
            <Weight className="h-4 w-4" />
            Weight Tracking
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {animal.dateOfBirth && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Date of Birth & Age
                      </p>
                      <p className="font-medium">
                        {formatDate(animal.dateOfBirth)} (
                        {calculateAge(animal.dateOfBirth)})
                      </p>
                    </div>
                  </div>
                )}

                {animal.currentWeight && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Current Weight</p>
                      <p className="font-medium">{animal.currentWeight} kg</p>
                    </div>
                  </div>
                )}
              </div>

              {animal.markings && (
                <div>
                  <p className="text-sm text-gray-500">Markings</p>
                  <p className="font-medium">{animal.markings}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Information */}
          {(animal.purchaseDate ||
            animal.purchasePrice ||
            animal.purchaseLocation ||
            animal.previousOwner) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {animal.purchaseDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Purchase Date</p>
                        <p className="font-medium">
                          {formatDate(animal.purchaseDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {animal.purchasePrice && (
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Purchase Price</p>
                        <p className="font-medium">
                          {formatCurrency(animal.purchasePrice)}
                        </p>
                      </div>
                    </div>
                  )}

                  {animal.purchaseLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">
                          Purchase Location
                        </p>
                        <p className="font-medium">{animal.purchaseLocation}</p>
                      </div>
                    </div>
                  )}

                  {animal.previousOwner && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Previous Owner</p>
                        <p className="font-medium">{animal.previousOwner}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sale Information */}
          {animal.status === "sold" &&
            (animal.saleDate || animal.salePrice || animal.buyerName) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sale Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {animal.saleDate && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Sale Date</p>
                          <p className="font-medium">
                            {formatDate(animal.saleDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    {animal.salePrice && (
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Sale Price</p>
                          <p className="font-medium">
                            {formatCurrency(animal.salePrice)}
                          </p>
                        </div>
                      </div>
                    )}

                    {animal.buyerName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Buyer</p>
                          <p className="font-medium">{animal.buyerName}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {animal.saleNotes && (
                    <div>
                      <p className="text-sm text-gray-500">Sale Notes</p>
                      <p className="font-medium">{animal.saleNotes}</p>
                    </div>
                  )}

                  {/* Profit/Loss Calculation */}
                  {animal.purchasePrice && animal.salePrice && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Profit/Loss:
                        </span>
                        <span
                          className={`font-bold ${
                            animal.salePrice - animal.purchasePrice >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            animal.salePrice - animal.purchasePrice,
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Insurance Information */}
          {animal.insured && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {animal.insuranceProvider && (
                    <div>
                      <p className="text-sm text-gray-500">
                        Insurance Provider
                      </p>
                      <p className="font-medium">{animal.insuranceProvider}</p>
                    </div>
                  )}

                  {animal.insurancePolicyNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Policy Number</p>
                      <p className="font-medium">
                        {animal.insurancePolicyNumber}
                      </p>
                    </div>
                  )}

                  {animal.insuranceAmount && (
                    <div>
                      <p className="text-sm text-gray-500">Coverage Amount</p>
                      <p className="font-medium">
                        {formatCurrency(animal.insuranceAmount)}
                      </p>
                    </div>
                  )}

                  {animal.insuranceExpiryDate && (
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="font-medium">
                        {formatDate(animal.insuranceExpiryDate)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family Relationships */}
          {(animal.motherId ||
            animal.fatherId ||
            (animal.offspring && animal.offspring.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Family Relationships
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parents */}
                {(animal.motherId || animal.fatherId) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Parents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {animal.motherId && (
                        <div className="flex items-center gap-2 p-2 bg-pink-50 rounded">
                          <Baby className="h-4 w-4 text-pink-600" />
                          <div>
                            <p className="text-sm text-gray-500">Mother</p>
                            <p className="font-medium">
                              {allAnimals.find((a) => a.id === animal.motherId)
                                ?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      )}
                      {animal.fatherId && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <User className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-500">Father</p>
                            <p className="font-medium">
                              {allAnimals.find((a) => a.id === animal.fatherId)
                                ?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Offspring */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Baby className="h-4 w-4 text-green-600" />
                      Offspring ({animal.offspring?.length || 0})
                    </h4>
                    {(animal.gender === "female" || animal.gender === "male") &&
                      animal.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddOffspringDialogOpen(true)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Offspring
                        </Button>
                      )}
                  </div>
                  {animal.offspring && animal.offspring.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {animal.offspring.map((offspringId) => {
                        const offspring = allAnimals.find(
                          (a) => a.id === offspringId,
                        );
                        if (!offspring) return null;
                        return (
                          <div
                            key={offspringId}
                            className="flex items-center gap-2 p-2 bg-green-50 rounded"
                          >
                            <Baby className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium">{offspring.name}</p>
                              <p className="text-sm text-gray-500">
                                {offspring.gender} • {offspring.breed}
                                {offspring.dateOfBirth && (
                                  <>
                                    {" "}
                                    • Born {formatDate(offspring.dateOfBirth)}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      No offspring recorded yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {animal.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {animal.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(animal.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(animal.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weight Tracking Tab */}
        <TabsContent value="weight" className="mt-6">
          <WeightTracker
            animalId={animal.id}
            animalName={animal.name}
            currentWeight={animal.currentWeight}
          />
        </TabsContent>
      </Tabs>

      {/* Add Offspring Dialog */}
      <Dialog
        open={isAddOffspringDialogOpen}
        onOpenChange={setIsAddOffspringDialogOpen}
      >
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Offspring for {animal.name}</DialogTitle>
            <DialogDescription>
              Create a new animal record as offspring of {animal.name}. Parent
              relationships will be automatically established.
            </DialogDescription>
          </DialogHeader>
          <AnimalForm
            onSubmit={handleAddOffspring}
            onCancel={() => setIsAddOffspringDialogOpen(false)}
            isOffspring={true}
            parentMotherId={animal.gender === "female" ? animal.id : undefined}
            parentFatherId={animal.gender === "male" ? animal.id : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

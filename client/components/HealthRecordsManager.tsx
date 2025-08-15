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
import {
  Plus,
  Stethoscope,
  Calendar,
  User,
  FileText,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Clock,
  Pill,
  Activity,
} from "lucide-react";
import { HealthRecord } from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";
import { useToast } from "@/hooks/use-toast";

interface HealthRecordsManagerProps {
  animalId: string;
  animalName: string;
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

export default function HealthRecordsManager({
  animalId,
  animalName,
}: HealthRecordsManagerProps) {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  useEffect(() => {
    loadHealthRecords();
  }, [animalId]);

  const loadHealthRecords = async () => {
    try {
      setLoading(true);
      const records = await animalApi.fetchHealthRecords(animalId);
      // Sort by date desc (newest first)
      setHealthRecords(
        records.sort(
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

  const handleAddHealthRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recordType || !formData.date || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newRecord = await animalApi.createHealthRecord({
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
      });

      setHealthRecords((prev) => [newRecord, ...prev]);
      setIsAddDialogOpen(false);
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

      toast({
        title: "Success",
        description: "Health record added successfully.",
      });
    } catch (error) {
      console.error("Error adding health record:", error);
      toast({
        title: "Error",
        description: "Failed to add health record. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const getHealthStats = () => {
    if (healthRecords.length === 0) return null;

    const totalCost = healthRecords.reduce(
      (sum, record) => sum + (record.cost || 0),
      0,
    );
    const lastCheckup = healthRecords.find(
      (record) => record.recordType === "checkup",
    );
    const upcomingCheckups = healthRecords.filter(
      (record) =>
        record.nextCheckupDate && new Date(record.nextCheckupDate) > new Date(),
    );

    return {
      totalRecords: healthRecords.length,
      totalCost,
      lastCheckupDate: lastCheckup?.date,
      upcomingCheckups: upcomingCheckups.length,
    };
  };

  const getOverdueCheckups = () => {
    const today = new Date();
    return healthRecords
      .filter(
        (record) =>
          record.nextCheckupDate && new Date(record.nextCheckupDate) < today,
      )
      .slice(0, 3); // Show max 3 overdue checkups
  };

  const stats = getHealthStats();
  const overdueCheckups = getOverdueCheckups();

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
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Health Records for {animalName}
          </h3>
          <p className="text-sm text-gray-600">
            Medical history, treatments, and checkup schedules
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Health Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
              <DialogDescription>
                Record medical information for {animalName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddHealthRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recordType">Record Type *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Dr. Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cost: e.target.value }))
                    }
                    placeholder="Treatment cost"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
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

              <div className="space-y-2">
                <Label htmlFor="treatment">Treatment</Label>
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

              <div className="space-y-2">
                <Label htmlFor="medications">Medications</Label>
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

              <div className="space-y-2">
                <Label htmlFor="nextCheckupDate">Next Checkup Date</Label>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any additional notes"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Record
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Health Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(stats.totalCost)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Last Checkup</span>
              </div>
              <div className="text-sm font-bold text-purple-900">
                {stats.lastCheckupDate
                  ? formatDate(stats.lastCheckupDate)
                  : "None"}
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
        </div>
      )}

      {/* Overdue Checkups Alert */}
      {overdueCheckups.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Overdue Checkups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueCheckups.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between bg-white rounded p-2"
                >
                  <span className="text-sm">
                    Next checkup was due on{" "}
                    {formatDate(record.nextCheckupDate!)}
                  </span>
                  <Badge variant="destructive">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(record.nextCheckupDate!).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days overdue
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medical History</CardTitle>
          <CardDescription>
            Complete health records ({healthRecords.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthRecords.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No health records found</p>
              <p className="text-sm text-gray-400">
                Add the first health record to start tracking medical history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {healthRecords.map((record) => {
                const typeInfo = getRecordTypeInfo(record.recordType);
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={typeInfo.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.date)}
                          </div>
                        </div>

                        {record.cost && (
                          <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                            <IndianRupee className="h-3 w-3" />
                            {formatCurrency(record.cost)}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {record.description}
                        </h4>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {record.veterinarianName && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="h-3 w-3" />
                            <span className="font-medium">Vet:</span>{" "}
                            {record.veterinarianName}
                          </div>
                        )}

                        {record.nextCheckupDate && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">
                              Next checkup:
                            </span>{" "}
                            {formatDate(record.nextCheckupDate)}
                          </div>
                        )}
                      </div>

                      {/* Clinical Information */}
                      {(record.diagnosis ||
                        record.treatment ||
                        record.medications) && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                        </>
                      )}

                      {/* Notes */}
                      {record.notes && (
                        <>
                          <Separator />
                          <div className="flex items-start gap-1 text-sm text-gray-700">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Notes:</span>
                              <p className="mt-1">{record.notes}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

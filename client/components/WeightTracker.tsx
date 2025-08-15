import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Weight,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  BarChart3,
} from "lucide-react";
import { WeightRecord } from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";
import { useToast } from "@/hooks/use-toast";

interface WeightTrackerProps {
  animalId: string;
  animalName: string;
  currentWeight?: number;
}

interface WeightFormData {
  weight: string;
  date: string;
  notes: string;
  recordedBy: string;
}

export default function WeightTracker({
  animalId,
  animalName,
  currentWeight,
}: WeightTrackerProps) {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<WeightFormData>({
    weight: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    recordedBy: "Farm Manager",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWeightRecords();
  }, [animalId]);

  const loadWeightRecords = async () => {
    try {
      setLoading(true);
      const records = await animalApi.fetchWeightRecords(animalId);
      // Sort by date desc (newest first)
      setWeightRecords(
        records.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error loading weight records:", error);
      toast({
        title: "Error",
        description: "Failed to load weight records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weight || !formData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newRecord = await animalApi.createWeightRecord({
        animalId,
        weight: parseFloat(formData.weight),
        date: formData.date,
        notes: formData.notes || undefined,
        recordedBy: formData.recordedBy || undefined,
      });

      setWeightRecords((prev) => [newRecord, ...prev]);
      setIsAddDialogOpen(false);
      setFormData({
        weight: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        recordedBy: "Farm Manager",
      });

      toast({
        title: "Success",
        description: "Weight record added successfully.",
      });
    } catch (error) {
      console.error("Error adding weight record:", error);
      toast({
        title: "Error",
        description: "Failed to add weight record. Please try again.",
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

  const getWeightTrend = () => {
    if (weightRecords.length < 2) return null;

    const latest = weightRecords[0];
    const previous = weightRecords[1];
    const change = latest.weight - previous.weight;
    const percentChange = (change / previous.weight) * 100;

    return {
      change,
      percentChange,
      isPositive: change >= 0,
    };
  };

  const getWeightStats = () => {
    if (weightRecords.length === 0) return null;

    const weights = weightRecords.map((r) => r.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

    return {
      minWeight,
      maxWeight,
      avgWeight,
      totalRecords: weightRecords.length,
    };
  };

  const generateChartData = () => {
    if (weightRecords.length === 0) return [];

    // Get last 12 records or all if less than 12
    const chartRecords = weightRecords.slice(0, 12).reverse();
    return chartRecords.map((record, index) => ({
      date: record.date,
      weight: record.weight,
      formattedDate: formatDate(record.date),
      index,
    }));
  };

  const trend = getWeightTrend();
  const stats = getWeightStats();
  const chartData = generateChartData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading weight records...</p>
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
            <Weight className="h-5 w-5 text-blue-600" />
            Weight Tracking for {animalName}
          </h3>
          <p className="text-sm text-gray-600">
            Monitor weight progress and growth patterns
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Weight Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Weight Record</DialogTitle>
              <DialogDescription>
                Record a new weight measurement for {animalName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddWeight} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weight: e.target.value,
                      }))
                    }
                    placeholder="Enter weight"
                    required
                  />
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
                <Label htmlFor="recordedBy">Recorded By</Label>
                <Input
                  id="recordedBy"
                  value={formData.recordedBy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recordedBy: e.target.value,
                    }))
                  }
                  placeholder="Who recorded this weight?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Optional notes about this measurement"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Current</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {currentWeight || weightRecords[0]?.weight || "N/A"} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Average</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {stats.avgWeight.toFixed(1)} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Max</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {stats.maxWeight} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Min</span>
              </div>
              <div className="text-xl font-bold text-orange-900">
                {stats.minWeight} kg
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weight Trend */}
      {trend && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {trend.isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Recent Weight Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`text-2xl font-bold ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.change.toFixed(1)} kg
              </div>
              <div
                className={`text-lg ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
              >
                ({trend.isPositive ? "+" : ""}
                {trend.percentChange.toFixed(1)}%)
              </div>
              <Badge variant={trend.isPositive ? "default" : "destructive"}>
                {trend.isPositive ? "Growing" : "Losing Weight"}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Compared to previous measurement
            </p>
          </CardContent>
        </Card>
      )}

      {/* Simple Weight Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weight History Chart</CardTitle>
            <CardDescription>
              Last {chartData.length} weight measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
                {chartData.map((point, index) => {
                  const maxWeight = Math.max(...chartData.map((d) => d.weight));
                  const minWeight = Math.min(...chartData.map((d) => d.weight));
                  const range = maxWeight - minWeight || 1;
                  const height = ((point.weight - minWeight) / range) * 80 + 10; // 10% minimum height

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center group"
                    >
                      <div className="relative">
                        <div
                          className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-sm w-8 group-hover:w-10 transition-all duration-200"
                          style={{ height: `${height}%` }}
                          title={`${point.weight} kg on ${point.formattedDate}`}
                        />
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-1 py-0.5 rounded">
                          {point.weight} kg
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 w-12 text-center">
                        {point.formattedDate.split(" ").slice(0, 2).join(" ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weight Records History</CardTitle>
          <CardDescription>
            Complete list of weight measurements ({weightRecords.length}{" "}
            records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weightRecords.length === 0 ? (
            <div className="text-center py-8">
              <Weight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No weight records found</p>
              <p className="text-sm text-gray-400">
                Add the first weight measurement to start tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {weightRecords.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-blue-900">
                          {record.weight} kg
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(record.date)}
                        </div>
                      </div>

                      {record.recordedBy && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          Recorded by {record.recordedBy}
                        </div>
                      )}

                      {record.notes && (
                        <div className="flex items-start gap-1 text-sm text-gray-700 mt-2">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{record.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

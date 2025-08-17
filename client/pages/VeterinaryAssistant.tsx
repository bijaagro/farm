import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Stethoscope,
  AlertTriangle,
  Clock,
  Pill,
  Activity,
  Heart,
  Thermometer,
  Eye,
  ArrowLeft,
  Search,
  Brain,
  Calendar,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as vetApi from "@/lib/veterinary-api";
import { AnimalRecord } from "@shared/animal-types";
import * as animalApi from "@/lib/animal-api";

interface DiagnosisResult {
  id: string;
  diseaseName: string;
  confidence: number;
  severity: "low" | "medium" | "high" | "emergency";
  description: string;
  symptoms: string[];
  treatment: string;
  medications: string[];
  preventionTips: string[];
  whenToCallVet: string;
  estimatedRecoveryTime: string;
}

const commonSymptoms = [
  "Loss of appetite",
  "Lethargy/weakness",
  "Difficulty breathing",
  "Coughing",
  "Fever",
  "Diarrhea",
  "Constipation",
  "Vomiting",
  "Weight loss",
  "Limping",
  "Swelling",
  "Discharge from eyes",
  "Discharge from nose",
  "Unusual behavior",
  "Pale gums",
  "Rapid breathing",
  "Tremors/shaking",
  "Hair loss",
  "Skin irritation",
  "Excessive drooling",
];

export default function VeterinaryAssistant() {
  const [selectedAnimal, setSelectedAnimal] = useState<string>("");
  const [animalType, setAnimalType] = useState<"goat" | "sheep" | "">("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [additionalSymptoms, setAdditionalSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [environment, setEnvironment] = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);

  // Load animals on component mount
  useState(() => {
    const loadAnimals = async () => {
      try {
        const animalData = await animalApi.fetchAnimals();
        setAnimals(animalData.filter(a => a.status === "active"));
      } catch (error) {
        console.error("Error loading animals:", error);
      } finally {
        setLoadingAnimals(false);
      }
    };
    loadAnimals();
  });

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "emergency":
        return "bg-red-600 text-white";
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />;
      case "high":
        return <Heart className="h-4 w-4" />;
      case "medium":
        return <Activity className="h-4 w-4" />;
      case "low":
        return <Thermometer className="h-4 w-4" />;
      default:
        return <Stethoscope className="h-4 w-4" />;
    }
  };

  const handleDiagnosis = async () => {
    if (selectedSymptoms.length === 0 && !additionalSymptoms.trim()) {
      alert("Please select at least one symptom or describe additional symptoms.");
      return;
    }

    setLoading(true);
    try {
      const result = await vetApi.getDiagnosis({
        animalId: selectedAnimal,
        animalType: animalType,
        symptoms: [...selectedSymptoms, additionalSymptoms].filter(Boolean),
        duration,
        environment,
        recentChanges,
      });
      setDiagnosis(result);
    } catch (error) {
      console.error("Error getting diagnosis:", error);
      alert("Failed to get diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAnimal("");
    setAnimalType("");
    setSelectedSymptoms([]);
    setAdditionalSymptoms("");
    setDuration("");
    setEnvironment("");
    setRecentChanges("");
    setDiagnosis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-blue-900">
                  AI Veterinary Assistant
                </h1>
                <p className="text-blue-600">
                  Symptom analysis and treatment recommendations for your livestock
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-blue-600 font-medium">AI Powered</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Symptom Checker</span>
                </CardTitle>
                <CardDescription>
                  Select your animal and describe the symptoms you've observed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Animal Selection */}
                <div className="space-y-3">
                  <Label>Select Animal (Optional)</Label>
                  <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from your animals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific animal</SelectItem>
                      {loadingAnimals ? (
                        <SelectItem value="" disabled>Loading animals...</SelectItem>
                      ) : (
                        animals.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.name} - {animal.breed} {animal.type} ({animal.gender})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Animal Type */}
                <div className="space-y-3">
                  <Label>Animal Type *</Label>
                  <Select value={animalType} onValueChange={(value: "goat" | "sheep") => setAnimalType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select animal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goat">Goat</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Common Symptoms */}
                <div className="space-y-3">
                  <Label>Common Symptoms</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {commonSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={selectedSymptoms.includes(symptom)}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                        />
                        <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedSymptoms.length} symptoms
                  </p>
                </div>

                {/* Additional Symptoms */}
                <div className="space-y-3">
                  <Label htmlFor="additionalSymptoms">Additional Symptoms</Label>
                  <Textarea
                    id="additionalSymptoms"
                    placeholder="Describe any other symptoms you've noticed..."
                    value={additionalSymptoms}
                    onChange={(e) => setAdditionalSymptoms(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <Label htmlFor="duration">How long have you noticed these symptoms?</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 2 days, 1 week, since yesterday"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                {/* Environment */}
                <div className="space-y-3">
                  <Label htmlFor="environment">Environment & Living Conditions</Label>
                  <Textarea
                    id="environment"
                    placeholder="Describe housing, feed, weather conditions, etc."
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Recent Changes */}
                <div className="space-y-3">
                  <Label htmlFor="recentChanges">Any Recent Changes?</Label>
                  <Textarea
                    id="recentChanges"
                    placeholder="New feed, medication, location change, new animals, etc."
                    value={recentChanges}
                    onChange={(e) => setRecentChanges(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleDiagnosis} 
                    disabled={loading || !animalType}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Get AI Diagnosis
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {diagnosis ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Stethoscope className="h-5 w-5" />
                      <span>AI Diagnosis Result</span>
                    </span>
                    <Badge className={getSeverityColor(diagnosis.severity)}>
                      {getSeverityIcon(diagnosis.severity)}
                      <span className="ml-1">{diagnosis.severity.toUpperCase()}</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Diagnosis */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {diagnosis.diseaseName}
                    </h3>
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="text-sm text-muted-foreground">
                        Confidence: {Math.round(diagnosis.confidence)}%
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Recovery: {diagnosis.estimatedRecoveryTime}
                      </span>
                    </div>
                    <p className="text-slate-700">{diagnosis.description}</p>
                  </div>

                  <Separator />

                  {/* Matching Symptoms */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Matching Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {diagnosis.symptoms.map((symptom, index) => (
                        <Badge key={index} variant="secondary">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Treatment */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Recommended Treatment
                    </h4>
                    <p className="text-slate-700 mb-3">{diagnosis.treatment}</p>
                    
                    {diagnosis.medications.length > 0 && (
                      <div>
                        <h5 className="font-medium text-slate-800 mb-2 flex items-center">
                          <Pill className="h-4 w-4 mr-2" />
                          Medications
                        </h5>
                        <ul className="list-disc list-inside space-y-1">
                          {diagnosis.medications.map((med, index) => (
                            <li key={index} className="text-sm text-slate-600">{med}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Prevention Tips */}
                  {diagnosis.preventionTips.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Prevention Tips</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {diagnosis.preventionTips.map((tip, index) => (
                          <li key={index} className="text-sm text-slate-600">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* When to Call Vet */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      When to Call a Veterinarian
                    </h4>
                    <p className="text-yellow-700 text-sm">{diagnosis.whenToCallVet}</p>
                  </div>

                  {/* Emergency Warning */}
                  {diagnosis.severity === "emergency" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        EMERGENCY - Immediate Action Required
                      </h4>
                      <p className="text-red-700 text-sm font-medium">
                        Contact a veterinarian immediately. This condition requires urgent professional attention.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={resetForm} className="flex-1">
                      New Diagnosis
                    </Button>
                    {selectedAnimal && (
                      <Button variant="outline" className="flex-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Add to Health Records
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready for AI Diagnosis
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Fill out the symptom form and click "Get AI Diagnosis" to receive intelligent recommendations for your livestock health concerns.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Disclaimer:</strong> This AI assistant provides general guidance only. 
                      Always consult with a qualified veterinarian for professional diagnosis and treatment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export type AnimalType = "goat" | "sheep";
export type AnimalGender = "male" | "female";
export type AnimalStatus = "active" | "sold" | "dead" | "ready_to_sell";

export interface AnimalRecord {
  id: string;
  name: string;
  type: AnimalType;
  breed: string;
  gender: AnimalGender;
  dateOfBirth?: string;
  photos: string[]; // URLs or base64 encoded images
  status: AnimalStatus;
  currentWeight?: number;
  markings?: string; // Special markings for identification

  // Purchase details
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseLocation?: string;
  previousOwner?: string;

  // Sale details (when sold)
  saleDate?: string;
  salePrice?: number;
  buyerName?: string;
  saleNotes?: string;

  // Death details (when applicable)
  deathDate?: string;
  deathCause?: string;

  // Family relationships
  motherId?: string;
  fatherId?: string;
  breedingRecordId?: string; // Links to the breeding record that produced this animal
  offspring?: string[]; // Array of animal IDs that are offspring of this animal

  // Insurance
  insured: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceAmount?: number;
  insuranceExpiryDate?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface WeightRecord {
  id: string;
  animalId: string;
  weight: number;
  date: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface BreedingRecord {
  id: string;
  motherId: string;
  fatherId?: string;
  breedingDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;

  // Birth details
  totalKids?: number;
  maleKids?: number;
  femaleKids?: number;
  kidDetails?: string[]; // Array of animal IDs for all kids (alive, stillborn, died_after_birth)

  // Breeding notes
  breedingMethod?: "natural" | "artificial_insemination";
  veterinarianName?: string;
  complications?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface VaccinationRecord {
  id: string;
  animalId: string;
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  nextDueDate?: string;
  batchNumber?: string;
  veterinarianName?: string;
  dosage?: string;
  administrationMethod?: string; // injection, oral, etc.
  sideEffects?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  recordType: "checkup" | "treatment" | "illness" | "injury" | "other";
  date: string;
  description: string;
  veterinarianName?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  cost?: number;
  nextCheckupDate?: string;
  notes?: string;
  createdAt: string;
}

// Summary interfaces for dashboard/overview
export interface AnimalSummary {
  totalAnimals: number;
  totalGoats: number;
  totalSheep: number;
  totalMales: number;
  totalFemales: number;
  activeAnimals: number;
  soldAnimals: number;
  readyToSell: number;
  deadAnimals: number;
  averageWeight: number;
  totalInvestment: number;
  totalRevenue: number;
  profitLoss: number;
}

export interface AnimalFilters {
  search: string;
  type: string;
  gender: string;
  status: string;
  breed: string;
  ageRange: string;
  weightRange: string;
}

// Form data interfaces
export interface AnimalFormData {
  name: string;
  type: AnimalType;
  breed: string;
  gender: AnimalGender;
  dateOfBirth: string;
  photos: string[];
  status: AnimalStatus;
  currentWeight: string;
  markings: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseLocation: string;
  previousOwner: string;
  insured: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceAmount: string;
  insuranceExpiryDate: string;
  notes: string;
}

export interface WeightFormData {
  animalId: string;
  weight: string;
  date: string;
  notes: string;
  recordedBy: string;
}

export interface BreedingFormData {
  motherId: string;
  fatherId: string;
  breedingDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  totalKids: string;
  maleKids: string;
  femaleKids: string;
  breedingMethod: string;
  veterinarianName: string;
  complications: string;
  notes: string;
}

export interface VaccinationFormData {
  animalId: string;
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  nextDueDate: string;
  batchNumber: string;
  veterinarianName: string;
  dosage: string;
  administrationMethod: string;
  sideEffects: string;
  cost: string;
  notes: string;
}

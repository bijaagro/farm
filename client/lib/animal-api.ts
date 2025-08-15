import {
  AnimalRecord,
  WeightRecord,
  BreedingRecord,
  VaccinationRecord,
  HealthRecord,
  AnimalSummary,
} from "@shared/animal-types";
import { apiGet, apiPost, apiPut, apiDelete, apiCall } from "./api-config";

// Animal CRUD operations
export const fetchAnimals = async (): Promise<AnimalRecord[]> => {
  return apiGet("/animals");
};

export const createAnimal = async (
  animal: Omit<AnimalRecord, "id" | "createdAt" | "updatedAt">,
): Promise<AnimalRecord> => {
  return apiPost("/animals", animal);
};

export const updateAnimal = async (
  id: string,
  animal: AnimalRecord,
): Promise<AnimalRecord> => {
  return apiPut(`/animals/${id}`, animal);
};

export const deleteAnimal = async (id: string): Promise<void> => {
  return apiDelete(`/animals/${id}`);
};

// Weight records
export const fetchWeightRecords = async (
  animalId?: string,
): Promise<WeightRecord[]> => {
  const endpoint = animalId
    ? `/weight-records?animalId=${animalId}`
    : `/weight-records`;
  return apiGet(endpoint);
};

export const createWeightRecord = async (
  record: Omit<WeightRecord, "id" | "createdAt">,
): Promise<WeightRecord> => {
  return apiPost("/weight-records", record);
};

// Breeding records
export const fetchBreedingRecords = async (
  animalId?: string,
): Promise<BreedingRecord[]> => {
  const endpoint = animalId
    ? `/breeding-records?animalId=${animalId}`
    : `/breeding-records`;
  return apiGet(endpoint);
};

export const createBreedingRecord = async (
  record: Omit<BreedingRecord, "id" | "createdAt" | "updatedAt">,
): Promise<BreedingRecord> => {
  return apiPost("/breeding-records", record);
};

export const updateBreedingRecord = async (
  id: string,
  record: BreedingRecord,
): Promise<BreedingRecord> => {
  return apiPut(`/breeding-records/${id}`, record);
};

export const deleteBreedingRecord = async (id: string): Promise<void> => {
  return apiDelete(`/breeding-records/${id}`);
};

// Vaccination records
export const fetchVaccinationRecords = async (
  animalId?: string,
): Promise<VaccinationRecord[]> => {
  const endpoint = animalId
    ? `/vaccination-records?animalId=${animalId}`
    : `/vaccination-records`;
  return apiGet(endpoint);
};

export const createVaccinationRecord = async (
  record: Omit<VaccinationRecord, "id" | "createdAt">,
): Promise<VaccinationRecord> => {
  return apiPost("/vaccination-records", record);
};

// Health records
export const fetchHealthRecords = async (
  animalId?: string,
): Promise<HealthRecord[]> => {
  const endpoint = animalId
    ? `/health-records?animalId=${animalId}`
    : `/health-records`;
  return apiGet(endpoint);
};

export const createHealthRecord = async (
  record: Omit<HealthRecord, "id" | "createdAt">,
): Promise<HealthRecord> => {
  return apiPost("/health-records", record);
};

export const updateHealthRecord = async (
  id: string,
  record: HealthRecord,
): Promise<HealthRecord> => {
  return apiPut(`/health-records/${id}`, record);
};

export const deleteHealthRecord = async (id: string): Promise<void> => {
  return apiDelete(`/health-records/${id}`);
};

// Dashboard summary
export const fetchAnimalSummary = async (): Promise<AnimalSummary> => {
  return apiGet("/animals/summary");
};

// Backup
export const createAnimalBackup = async (): Promise<Blob> => {
  const response = await apiCall("/animals/backup");
  return response.blob();
};

export type {
  AnimalRecord,
  WeightRecord,
  BreedingRecord,
  VaccinationRecord,
  HealthRecord,
  AnimalSummary,
};

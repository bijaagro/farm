import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import API functions
import {
  fetchAnimals,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  fetchAnimalSummary,
  fetchWeightRecords,
  createWeightRecord,
  fetchBreedingRecords,
  createBreedingRecord,
  fetchVaccinationRecords,
  createVaccinationRecord,
  fetchHealthRecords,
  createHealthRecord,
} from "./animal-api";

describe("Animal API Functions", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Animal CRUD Operations", () => {
    it("fetchAnimals should make GET request to animals endpoint", async () => {
      const mockAnimals = [
        {
          id: "1",
          name: "Test Animal",
          type: "goat" as const,
          breed: "Test Breed",
          gender: "female" as const,
          status: "active" as const,
          currentWeight: 25,
          createdAt: "2024-01-15T00:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnimals,
      });

      const result = await fetchAnimals();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/animals?t="),
      );
      expect(result).toEqual(mockAnimals);
    });

    it("createAnimal should make POST request with animal data", async () => {
      const newAnimal = {
        name: "New Test Animal",
        type: "sheep" as const,
        breed: "Test Breed",
        gender: "male" as const,
        status: "active" as const,
        currentWeight: 30,
        photos: [],
        insured: false,
        notes: "Test animal",
      };

      const mockCreatedAnimal = {
        ...newAnimal,
        id: "123",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedAnimal,
      });

      const result = await createAnimal(newAnimal);

      expect(mockFetch).toHaveBeenCalledWith("/api/animals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAnimal),
      });
      expect(result).toEqual(mockCreatedAnimal);
    });

    it("updateAnimal should make PUT request with updated data", async () => {
      const updatedAnimal = {
        id: "123",
        name: "Updated Animal",
        type: "goat" as const,
        breed: "Updated Breed",
        gender: "female" as const,
        status: "active" as const,
        currentWeight: 35,
        photos: [],
        insured: true,
        notes: "Updated notes",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-01-16T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedAnimal,
      });

      const result = await updateAnimal("123", updatedAnimal);

      expect(mockFetch).toHaveBeenCalledWith("/api/animals/123", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAnimal),
      });
      expect(result).toEqual(updatedAnimal);
    });

    it("deleteAnimal should make DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteAnimal("123");

      expect(mockFetch).toHaveBeenCalledWith("/api/animals/123", {
        method: "DELETE",
      });
    });
  });

  describe("Animal Summary", () => {
    it("fetchAnimalSummary should return summary statistics", async () => {
      const mockSummary = {
        totalAnimals: 10,
        totalGoats: 6,
        totalSheep: 4,
        totalMales: 5,
        totalFemales: 5,
        activeAnimals: 8,
        soldAnimals: 1,
        readyToSell: 1,
        deadAnimals: 0,
        averageWeight: 35.5,
        totalInvestment: 50000,
        totalRevenue: 15000,
        profitLoss: -35000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await fetchAnimalSummary();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/animals/summary?t="),
      );
      expect(result).toEqual(mockSummary);
    });
  });

  describe("Weight Records", () => {
    it("fetchWeightRecords should get all weight records", async () => {
      const mockWeightRecords = [
        {
          id: "1",
          animalId: "1",
          weight: 30,
          date: "2024-01-15",
          notes: "Test weight",
          recordedBy: "Test User",
          createdAt: "2024-01-15T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeightRecords,
      });

      const result = await fetchWeightRecords();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/weight-records?t="),
      );
      expect(result).toEqual(mockWeightRecords);
    });

    it("fetchWeightRecords should filter by animal ID", async () => {
      const mockWeightRecords = [
        {
          id: "1",
          animalId: "123",
          weight: 30,
          date: "2024-01-15",
          notes: "Test weight",
          recordedBy: "Test User",
          createdAt: "2024-01-15T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeightRecords,
      });

      const result = await fetchWeightRecords("123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/weight-records?animalId=123&t="),
      );
      expect(result).toEqual(mockWeightRecords);
    });

    it("createWeightRecord should make POST request", async () => {
      const newWeightRecord = {
        animalId: "123",
        weight: 32,
        date: "2024-01-16",
        notes: "Monthly weight check",
        recordedBy: "Vet",
      };

      const mockCreatedRecord = {
        ...newWeightRecord,
        id: "456",
        createdAt: "2024-01-16T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedRecord,
      });

      const result = await createWeightRecord(newWeightRecord);

      expect(mockFetch).toHaveBeenCalledWith("/api/weight-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWeightRecord),
      });
      expect(result).toEqual(mockCreatedRecord);
    });
  });

  describe("Breeding Records", () => {
    it("fetchBreedingRecords should get breeding records", async () => {
      const mockBreedingRecords = [
        {
          id: "1",
          motherId: "123",
          fatherId: "124",
          breedingDate: "2024-01-01",
          expectedDeliveryDate: "2024-06-01",
          breedingMethod: "natural",
          notes: "Test breeding",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBreedingRecords,
      });

      const result = await fetchBreedingRecords();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/breeding-records?t="),
      );
      expect(result).toEqual(mockBreedingRecords);
    });

    it("createBreedingRecord should make POST request", async () => {
      const newBreedingRecord = {
        motherId: "123",
        fatherId: "124",
        breedingDate: "2024-01-15",
        expectedDeliveryDate: "2024-06-15",
        breedingMethod: "artificial_insemination",
        notes: "AI breeding",
      };

      const mockCreatedRecord = {
        ...newBreedingRecord,
        id: "789",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedRecord,
      });

      const result = await createBreedingRecord(newBreedingRecord);

      expect(mockFetch).toHaveBeenCalledWith("/api/breeding-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBreedingRecord),
      });
      expect(result).toEqual(mockCreatedRecord);
    });
  });

  describe("Vaccination Records", () => {
    it("fetchVaccinationRecords should get vaccination records", async () => {
      const mockVaccinationRecords = [
        {
          id: "1",
          animalId: "123",
          vaccineName: "PPR Vaccine",
          vaccineType: "Viral Protection",
          administrationDate: "2024-01-15",
          nextDueDate: "2025-01-15",
          veterinarianName: "Dr. Test",
          dosage: "1ml",
          cost: 150,
          notes: "Annual vaccination",
          createdAt: "2024-01-15T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVaccinationRecords,
      });

      const result = await fetchVaccinationRecords();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vaccination-records?t="),
      );
      expect(result).toEqual(mockVaccinationRecords);
    });

    it("createVaccinationRecord should make POST request", async () => {
      const newVaccinationRecord = {
        animalId: "123",
        vaccineName: "FMD Vaccine",
        vaccineType: "Viral Protection",
        administrationDate: "2024-01-15",
        nextDueDate: "2025-01-15",
        veterinarianName: "Dr. Test",
        dosage: "2ml",
        cost: 200,
        notes: "FMD vaccination",
      };

      const mockCreatedRecord = {
        ...newVaccinationRecord,
        id: "987",
        createdAt: "2024-01-15T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedRecord,
      });

      const result = await createVaccinationRecord(newVaccinationRecord);

      expect(mockFetch).toHaveBeenCalledWith("/api/vaccination-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newVaccinationRecord),
      });
      expect(result).toEqual(mockCreatedRecord);
    });
  });

  describe("Health Records", () => {
    it("fetchHealthRecords should get health records", async () => {
      const mockHealthRecords = [
        {
          id: "1",
          animalId: "123",
          recordType: "checkup",
          date: "2024-01-15",
          description: "Routine checkup",
          veterinarianName: "Dr. Test",
          diagnosis: "Healthy",
          treatment: "None",
          cost: 300,
          notes: "All good",
          createdAt: "2024-01-15T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthRecords,
      });

      const result = await fetchHealthRecords();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/health-records?t="),
      );
      expect(result).toEqual(mockHealthRecords);
    });

    it("createHealthRecord should make POST request", async () => {
      const newHealthRecord = {
        animalId: "123",
        recordType: "treatment" as const,
        date: "2024-01-15",
        description: "Injury treatment",
        veterinarianName: "Dr. Test",
        diagnosis: "Minor cut",
        treatment: "Cleaned and bandaged",
        cost: 250,
        notes: "Healing well",
      };

      const mockCreatedRecord = {
        ...newHealthRecord,
        id: "654",
        createdAt: "2024-01-15T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedRecord,
      });

      const result = await createHealthRecord(newHealthRecord);

      expect(mockFetch).toHaveBeenCalledWith("/api/health-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newHealthRecord),
      });
      expect(result).toEqual(mockCreatedRecord);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchAnimals()).rejects.toThrow("Network error");
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchAnimals()).rejects.toThrow("Failed to fetch animals");
    });

    it("should handle 404 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchAnimalSummary()).rejects.toThrow(
        "Failed to fetch animal summary",
      );
    });
  });
});

// API Configuration for external and local API calls

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

// Get API base URL from environment variables or use default
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Check for runtime environment variable (for production builds)
  if (typeof window !== "undefined" && (window as any).__API_BASE_URL__) {
    return (window as any).__API_BASE_URL__;
  }

  // Force mock mode for development environments
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isDevelopment =
      import.meta.env.DEV || import.meta.env.NODE_ENV === "development";
    const isBuilderDev =
      hostname.includes("fly.dev") || hostname.includes("builder.io");

    // Enable mock mode for development, localhost, or builder.io development environments
    if (isLocalhost || isDevelopment || isBuilderDev) {
      return "__MOCK_MODE__";
    }
  }

  // Use production API for GitHub Pages (only when specifically deployed there)
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes("github.io")
  ) {
    return "https://bijafarms-api.onrender.com/api";
  }

  // Default to mock mode for safety if we can't determine the environment
  return "__MOCK_MODE__";
};

// API Configuration
export const apiConfig: ApiConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Debug logging
if (typeof window !== "undefined") {
  console.log("🔧 API Configuration:", {
    baseUrl: apiConfig.baseUrl,
    mockMode: apiConfig.baseUrl === "__MOCK_MODE__",
    viteBaseUrl: import.meta.env.BASE_URL,
    currentPath: window.location.pathname,
    hostname: window.location.hostname,
    environment: import.meta.env.NODE_ENV || "development",
  });
}

// Mock mode detection
const isMockMode = () => apiConfig.baseUrl === "__MOCK_MODE__";

// Enhanced fetch wrapper with better error handling and configuration
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  // If in mock mode, return mock data
  if (isMockMode()) {
    return getMockResponse(endpoint, options);
  }

  const url = `${apiConfig.baseUrl}${endpoint}`;

  // Merge default headers with provided headers
  const headers = {
    ...apiConfig.headers,
    ...options.headers,
  };

  // Add timestamp to GET requests to prevent caching
  const finalUrl =
    options.method === "GET" || !options.method
      ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
      : url;

  const config: RequestInit = {
    ...options,
    headers,
    // Add timeout support
    signal: AbortSignal.timeout(apiConfig.timeout),
  };

  try {
    console.log(`🌐 API Call: ${options.method || "GET"} ${finalUrl}`);
    const response = await fetch(finalUrl, config);

    // Handle common HTTP errors
    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      console.error(
        `❌ API Error: ${response.status} ${response.statusText} for ${finalUrl}`,
      );
      throw new ApiError(
        `API call failed: ${response.status} ${response.statusText}`,
        response.status,
        errorMessage,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      // Auto-fallback to mock mode on timeout
      console.warn("⚠️ Request timeout, falling back to mock mode");
      enableDemoMode();
      return getMockResponse(endpoint, options);
    }
    if (error instanceof ApiError) {
      throw error;
    }

    // Auto-fallback to mock mode on network errors
    console.warn(
      "⚠️ Network error detected, falling back to mock mode:",
      error,
    );
    enableDemoMode();
    return getMockResponse(endpoint, options);
  }
};

// Custom API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to extract error message from response
const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data.message || data.error || "Unknown error";
    } else {
      return await response.text();
    }
  } catch {
    return "Unable to parse error response";
  }
};

// Helper functions for common API operations
export const apiGet = async (endpoint: string): Promise<any> => {
  const response = await apiCall(endpoint);
  return response.json();
};

export const apiPost = async (endpoint: string, data: any): Promise<any> => {
  const response = await apiCall(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.json();
};

export const apiPut = async (endpoint: string, data: any): Promise<any> => {
  const response = await apiCall(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.json();
};

export const apiDelete = async (endpoint: string): Promise<void> => {
  await apiCall(endpoint, {
    method: "DELETE",
  });
};

// Configuration helpers
export const setApiBaseUrl = (url: string): void => {
  apiConfig.baseUrl = url;
};

export const setApiTimeout = (timeout: number): void => {
  apiConfig.timeout = timeout;
};

export const addApiHeader = (key: string, value: string): void => {
  apiConfig.headers[key] = value;
};

export const removeApiHeader = (key: string): void => {
  delete apiConfig.headers[key];
};

// Demo mode helpers
export const enableDemoMode = (): void => {
  apiConfig.baseUrl = "__MOCK_MODE__";
  console.log("🎭 Demo mode enabled - using mock data");
};

export const disableDemoMode = (): void => {
  apiConfig.baseUrl = getApiBaseUrl();
  console.log("🔧 Demo mode disabled - using real API");
};

// Environment-specific configurations
export const configureForEnvironment = (
  env: "development" | "staging" | "production",
) => {
  switch (env) {
    case "development":
      setApiBaseUrl("/api");
      setApiTimeout(30000);
      break;
    case "staging":
      setApiBaseUrl("https://staging-api.bijafarms.com/api");
      setApiTimeout(20000);
      addApiHeader("X-Environment", "staging");
      break;
    case "production":
      setApiBaseUrl("https://api.bijafarms.com/api");
      setApiTimeout(15000);
      addApiHeader("X-Environment", "production");
      break;
  }
};

// Mock data for demo environments
const getMockResponse = async (
  endpoint: string,
  options: RequestInit,
): Promise<Response> => {
  console.log(`🎭 Mock mode: ${options.method || "GET"} ${endpoint}`);

  const mockData = getMockData(endpoint, options.method || "GET");

  return new Response(JSON.stringify(mockData), {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const getMockData = (endpoint: string, method: string) => {
  // Expenses mock data
  if (endpoint.includes("/expenses") && method === "GET") {
    return [
      {
        id: "1",
        date: "2024-01-15",
        type: "Income",
        description: "Goat Sale - Premium Boer",
        amount: 15000,
        paidBy: "Farm Owner",
        category: "Livestock Sales",
        subCategory: "Goats",
      },
      {
        id: "2",
        date: "2024-01-10",
        type: "Expense",
        description: "Veterinary Checkup",
        amount: 2500,
        paidBy: "Farm Owner",
        category: "Healthcare",
        subCategory: "Veterinary",
      },
      {
        id: "3",
        date: "2024-01-08",
        type: "Income",
        description: "Sheep Wool Sale",
        amount: 8000,
        paidBy: "Farm Owner",
        category: "Livestock Products",
        subCategory: "Wool",
      },
    ];
  }

  // Animals mock data
  if (endpoint.includes("/animals") && method === "GET") {
    if (endpoint.includes("/summary")) {
      return {
        totalAnimals: 5,
        totalGoats: 4,
        totalSheep: 1,
        totalMales: 2,
        totalFemales: 3,
        activeAnimals: 3,
        soldAnimals: 1,
        readyToSell: 1,
        deadAnimals: 1,
        averageWeight: 40.0,
        totalInvestment: 0,
        totalRevenue: 12000,
        profitLoss: 12000,
      };
    }
    return [
      {
        id: "1",
        name: "Radha",
        type: "goat",
        breed: "Boer",
        gender: "female",
        dateOfBirth: "2023-03-15",
        photos: [],
        status: "active",
        currentWeight: 45,
        markings: "White with brown patches",
        createdAt: "2023-03-15T10:30:00.000Z",
        updatedAt: "2024-01-15T14:20:00.000Z",
      },
      {
        id: "2",
        name: "Krishna",
        type: "goat",
        breed: "Boer",
        gender: "male",
        dateOfBirth: "2022-08-20",
        photos: [],
        status: "active",
        currentWeight: 55,
        markings: "Pure white with black spots",
        createdAt: "2022-08-20T09:15:00.000Z",
        updatedAt: "2024-01-10T11:45:00.000Z",
      },
      {
        id: "3",
        name: "Lakshmi",
        type: "sheep",
        breed: "Dorper",
        gender: "female",
        dateOfBirth: "2022-01-10",
        photos: [],
        status: "sold",
        currentWeight: 40,
        markings: "Black head, white body",
        salePrice: 12000,
        saleDate: "2024-01-20",
        createdAt: "2022-01-10T08:00:00.000Z",
        updatedAt: "2024-01-20T10:00:00.000Z",
      },
      {
        id: "4",
        name: "Ganga",
        type: "goat",
        breed: "Jamunapari",
        gender: "female",
        dateOfBirth: "2021-06-15",
        photos: [],
        status: "dead",
        currentWeight: 35,
        markings: "Brown with white spots",
        deathDate: "2024-01-05",
        deathReason: "Natural causes - old age",
        createdAt: "2021-06-15T12:00:00.000Z",
        updatedAt: "2024-01-05T16:30:00.000Z",
      },
      {
        id: "5",
        name: "Ravi",
        type: "goat",
        breed: "Boer",
        gender: "male",
        dateOfBirth: "2023-12-20",
        photos: [],
        status: "ready_to_sell",
        currentWeight: 25,
        markings: "White with brown ears",
        createdAt: "2023-12-20T14:30:00.000Z",
        updatedAt: "2024-01-25T09:15:00.000Z",
      },
    ];
  }

  // Tasks mock data
  if (endpoint.includes("/tasks") && method === "GET") {
    return [
      {
        id: "1",
        title: "Vaccination Schedule - Radha",
        description: "Annual vaccination for breeding goat",
        category: "animal-health",
        taskType: "vaccination",
        priority: "high",
        status: "pending",
        dueDate: "2024-02-15",
        assignedTo: "Farm Manager",
        notes: "Use FMD vaccine",
        createdAt: "2024-01-20T10:00:00.000Z",
      },
      {
        id: "2",
        title: "Weight Check - All Kids",
        description: "Monthly weight monitoring",
        category: "animal-health",
        taskType: "checkup",
        priority: "medium",
        status: "pending",
        dueDate: "2024-02-01",
        assignedTo: "Farm Owner",
        notes: "Record growth patterns",
        createdAt: "2024-01-18T14:30:00.000Z",
      },
      {
        id: "3",
        title: "Feed Preparation",
        description: "Prepare nutritious feed mix",
        category: "general",
        taskType: "feeding",
        priority: "medium",
        status: "in-progress",
        dueDate: "2024-01-25",
        assignedTo: "Farm Worker",
        notes: "Include protein supplements",
        createdAt: "2024-01-22T08:00:00.000Z",
      },
      {
        id: "4",
        title: "Barn Cleaning",
        description: "Weekly cleaning of animal shelter",
        category: "maintenance",
        taskType: "cleaning",
        priority: "low",
        status: "completed",
        dueDate: "2024-01-20",
        assignedTo: "Farm Worker",
        notes: "Disinfect after cleaning",
        createdAt: "2024-01-18T06:00:00.000Z",
        completedAt: "2024-01-20",
      },
    ];
  }

  // Weight records mock data
  if (endpoint.includes("/weight-records") && method === "GET") {
    return [
      {
        id: "1",
        animalId: "1",
        weight: 45,
        date: "2024-01-15",
        notes: "Good growth progress",
        recordedBy: "Farm Manager",
        createdAt: "2024-01-15T14:20:00.000Z",
      },
    ];
  }

  // Health records mock data
  if (endpoint.includes("/health-records") && method === "GET") {
    return [
      {
        id: "1",
        animalId: "1",
        recordType: "checkup",
        date: "2024-01-15",
        description: "Routine health checkup",
        veterinarianName: "Dr. Raghava",
        diagnosis: "Excellent health condition",
        treatment: "No treatment required",
        medications: "None",
        cost: 500,
        notes: "Animal in excellent condition",
        createdAt: "2024-01-15T14:20:00.000Z",
      },
    ];
  }

  // Default response for POST/PUT/DELETE
  if (method !== "GET") {
    return { success: true, message: "Demo mode - action simulated" };
  }

  return [];
};

// Debug information
export const getApiConfig = () => ({
  ...apiConfig,
  currentUrl: apiConfig.baseUrl,
  environment: import.meta.env.NODE_ENV || "development",
  mockMode: isMockMode(),
});

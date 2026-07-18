// PawonOS Common Types

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  lastLogin?: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Order types
export type OrderStatus = 
  | "DRAFT"
  | "CONFIRMED"
  | "PREPARING"
  | "COOKING"
  | "PACKAGING"
  | "READY"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";

export type ProductionStatus = 
  | "PENDING"
  | "PREPARING"
  | "COOKING"
  | "PACKAGING"
  | "READY"
  | "COMPLETED";

export type TransactionType = 
  | "PURCHASE"
  | "RESERVATION"
  | "CONSUMPTION"
  | "ADJUSTMENT"
  | "WASTE"
  | "RETURN";

export type PurchaseStatus = 
  | "DRAFT"
  | "SENT"
  | "PARTIAL"
  | "RECEIVED"
  | "CANCELLED";

export type DeliveryStatus = 
  | "SCHEDULED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

// HPP types
export interface HppBreakdown {
  materialCost: number;
  packagingCost: number;
  laborCost: number;
  utilityCost: number;
  overheadCost: number;
  totalCost: number;
}

export interface PricingSuggestion {
  hpp: number;
  targetMargin: number;
  suggestedPrice: number;
  foodCostPercentage: number;
}

// Optimization types
export interface OptimizationSuggestion {
  id: string;
  type: "ingredient" | "packaging" | "recipe" | "batch" | "supplier";
  description: string;
  savings: number;
  qualityImpact: "low" | "medium" | "high";
  confidence: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface TenderAnalysis {
  customerBudget: number;
  maxHpp: number;
  currentHpp: number;
  difference: number;
  isWithinBudget: boolean;
  suggestions: OptimizationSuggestion[];
}
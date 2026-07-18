import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  roleId: z.string().optional(),
});

// Ingredient schemas
export const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  unitId: z.string().min(1, "Unit is required"),
  purchasePrice: z.number().min(0, "Price must be positive"),
  minimumStock: z.number().min(0, "Minimum stock must be positive"),
  notes: z.string().optional(),
});

// Recipe schemas
export const recipeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const recipeVersionSchema = z.object({
  recipeId: z.string().min(1, "Recipe is required"),
  yield: z.number().min(1, "Yield must be at least 1"),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
});

export const recipeItemSchema = z.object({
  ingredientId: z.string().optional(),
  packagingId: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitId: z.string().min(1, "Unit is required"),
  notes: z.string().optional(),
});

// Menu item schema
export const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  recipeId: z.string().min(1, "Recipe is required"),
  recipeVersionId: z.string().min(1, "Recipe version is required"),
  sellingPrice: z.number().min(0, "Price must be positive"),
});

// Meal template schema
export const mealTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const mealTemplateItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

// Customer schema
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  picName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Order schema
export const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  mealTemplateId: z.string().min(1, "Meal template is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTime: z.string().optional(),
  deliveryAddress: z.string().optional(),
  specialNotes: z.string().optional(),
  sellingPrice: z.number().min(0, "Price must be positive"),
  deposit: z.number().min(0).optional(),
});

// Supplier schema
export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Purchase order schema
export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
});

export const purchaseOrderItemSchema = z.object({
  ingredientId: z.string().optional(),
  packagingId: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitCost: z.number().min(0, "Cost must be positive"),
  notes: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type IngredientInput = z.infer<typeof ingredientSchema>;
export type RecipeInput = z.infer<typeof recipeSchema>;
export type RecipeVersionInput = z.infer<typeof recipeVersionSchema>;
export type RecipeItemInput = z.infer<typeof recipeItemSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type MealTemplateInput = z.infer<typeof mealTemplateSchema>;
export type MealTemplateItemInput = z.infer<typeof mealTemplateItemSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
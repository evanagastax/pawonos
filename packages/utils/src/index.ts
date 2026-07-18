// PawonOS Utility Functions

// Format currency (Indonesian Rupiah)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with thousand separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
}

// Calculate margin
export function calculateMargin(sellingPrice: number, cost: number): number {
  if (sellingPrice === 0) return 0;
  return Math.round(((sellingPrice - cost) / sellingPrice) * 100 * 100) / 100;
}

// Calculate food cost percentage
export function calculateFoodCost(cost: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return Math.round((cost / sellingPrice) * 100 * 100) / 100;
}

// Calculate suggested selling price based on target margin
export function calculateSellingPrice(hpp: number, targetMargin: number): number {
  if (targetMargin >= 1) return 0;
  return Math.ceil(hpp / (1 - targetMargin));
}

// Calculate maximum allowable HPP from budget
export function calculateMaxHpp(budget: number, targetMargin: number): number {
  return Math.floor(budget * (1 - targetMargin));
}

// Generate order number
export function generateOrderNumber(prefix: string = "ORD"): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${year}${month}${day}${random}`;
}

// Generate batch number
export function generateBatchNumber(): string {
  return generateOrderNumber("BATCH");
}

// Generate purchase order number
export function generatePurchaseOrderNumber(): string {
  return generateOrderNumber("PO");
}

// Round to nearest value
export function roundToNearest(value: number, nearest: number = 100): number {
  return Math.round(value / nearest) * nearest;
}

// Round up to nearest value
export function roundUpToNearest(value: number, nearest: number = 100): number {
  return Math.ceil(value / nearest) * nearest;
}

// Round down to nearest value
export function roundDownToNearest(value: number, nearest: number = 100): number {
  return Math.floor(value / nearest) * nearest;
}

// Calculate weighted average cost
export function calculateWeightedAverage(
  currentStock: number,
  currentCost: number,
  newQuantity: number,
  newCost: number
): number {
  const totalValue = currentStock * currentCost + newQuantity * newCost;
  const totalQuantity = currentStock + newQuantity;
  if (totalQuantity === 0) return 0;
  return Math.round((totalValue / totalQuantity) * 100) / 100;
}

// Date utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[0-9+\-\s()]+$/.test(phone);
}
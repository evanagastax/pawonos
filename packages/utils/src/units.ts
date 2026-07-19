// Unit conversion utilities for PawonOS
// Base units: kg, l, pcs

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
}

// Conversion factors to base units
const UNIT_TO_BASE: Record<string, { base: string; factor: number }> = {
  // Weight -> kg
  kg: { base: "kg", factor: 1 },
  g: { base: "kg", factor: 0.001 },
  mg: { base: "kg", factor: 0.000001 },
  
  // Volume -> l
  l: { base: "l", factor: 1 },
  ml: { base: "l", factor: 0.001 },
  
  // Count -> pcs
  pcs: { base: "pcs", factor: 1 },
  pack: { base: "pcs", factor: 1 },
  box: { base: "pcs", factor: 1 },
  sachet: { base: "pcs", factor: 1 },
  unit: { base: "pcs", factor: 1 },
};

/**
 * Convert quantity from one unit to another
 * Returns null if conversion is not possible (e.g., converting kg to l)
 */
export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number | null {
  const from = UNIT_TO_BASE[fromUnit.toLowerCase()];
  const to = UNIT_TO_BASE[toUnit.toLowerCase()];
  
  if (!from || !to) return null;
  
  // Can only convert within same base (kg->g, l->ml, etc.)
  if (from.base !== to.base) return null;
  
  // Convert: quantity * fromFactor / toFactor
  const baseQuantity = quantity * from.factor;
  return baseQuantity / to.factor;
}

/**
 * Calculate cost for a given quantity considering unit differences
 * purchasePrice is per purchaseUnit
 * quantity is in recipeUnit
 * Returns cost for the quantity
 */
export function calculateItemCost(
  purchasePrice: number,
  purchaseUnit: string,
  quantity: number,
  recipeUnit: string
): number {
  // If same unit, simple multiplication
  if (purchaseUnit.toLowerCase() === recipeUnit.toLowerCase()) {
    return purchasePrice * quantity;
  }
  
  // Try to convert recipe unit to purchase unit
  const convertedQty = convertUnit(quantity, recipeUnit, purchaseUnit);
  
  if (convertedQty !== null) {
    // Successfully converted - cost = price per purchase unit * converted quantity
    return purchasePrice * convertedQty;
  }
  
  // Cannot convert - assume 1:1 (fallback)
  console.warn(`Cannot convert ${recipeUnit} to ${purchaseUnit}, using 1:1`);
  return purchasePrice * quantity;
}

/**
 * Get base unit for a given unit symbol
 */
export function getBaseUnit(unitSymbol: string): string | null {
  const unit = UNIT_TO_BASE[unitSymbol.toLowerCase()];
  return unit?.base || null;
}

/**
 * Check if two units are compatible (can be converted)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const base1 = getBaseUnit(unit1);
  const base2 = getBaseUnit(unit2);
  return base1 !== null && base2 !== null && base1 === base2;
}
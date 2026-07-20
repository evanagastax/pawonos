import { describe, it, expect } from "vitest";
import { calculateItemCost, convertUnit, areUnitsCompatible } from "@pawonos/utils";

describe("Unit Conversion", () => {
  describe("convertUnit", () => {
    it("should convert kg to g", () => {
      const result = convertUnit(1, "kg", "g");
      expect(result).toBe(1000);
    });

    it("should convert g to kg", () => {
      const result = convertUnit(1000, "g", "kg");
      expect(result).toBe(1);
    });

    it("should convert l to ml", () => {
      const result = convertUnit(1, "l", "ml");
      expect(result).toBe(1000);
    });

    it("should convert ml to l", () => {
      const result = convertUnit(1000, "ml", "l");
      expect(result).toBe(1);
    });

    it("should return null for incompatible units", () => {
      const result = convertUnit(1, "kg", "l");
      expect(result).toBeNull();
    });

    it("should return null for unknown units", () => {
      const result = convertUnit(1, "unknown", "kg");
      expect(result).toBeNull();
    });
  });

  describe("areUnitsCompatible", () => {
    it("should return true for kg and g", () => {
      expect(areUnitsCompatible("kg", "g")).toBe(true);
    });

    it("should return true for l and ml", () => {
      expect(areUnitsCompatible("l", "ml")).toBe(true);
    });

    it("should return false for kg and l", () => {
      expect(areUnitsCompatible("kg", "l")).toBe(false);
    });
  });

  describe("calculateItemCost", () => {
    it("should calculate cost for same unit", () => {
      // 45000 per kg, 2 kg = 90000
      const result = calculateItemCost(45000, "kg", 2, "kg");
      expect(result).toBe(90000);
    });

    it("should calculate cost with unit conversion", () => {
      // 45000 per kg, 250g = 0.25kg = 11250
      const result = calculateItemCost(45000, "kg", 250, "g");
      expect(result).toBeCloseTo(11250, 0);
    });

    it("should calculate cost for ml to l", () => {
      // 15000 per l, 500ml = 0.5l = 7500
      const result = calculateItemCost(15000, "l", 500, "ml");
      expect(result).toBeCloseTo(7500, 0);
    });
  });
});
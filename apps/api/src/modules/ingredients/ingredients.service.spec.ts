import { describe, it, expect, beforeEach, vi } from "vitest";
import { IngredientsService } from "./ingredients.service";

const mockPrisma = {
  ingredient: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  ingredientCategory: {
    findMany: vi.fn(),
  },
  unit: {
    findMany: vi.fn(),
  },
  inventory: {
    create: vi.fn(),
  },
};

describe("IngredientsService", () => {
  let service: IngredientsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IngredientsService(mockPrisma as any);
  });

  describe("findAll", () => {
    it("should return paginated ingredients", async () => {
      const mockItems = [
        { id: "1", name: "Chicken", category: { name: "Meat" }, unit: { symbol: "kg" } },
      ];
      mockPrisma.ingredient.findMany.mockResolvedValue(mockItems);
      mockPrisma.ingredient.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("should filter by search", async () => {
      mockPrisma.ingredient.findMany.mockResolvedValue([]);
      mockPrisma.ingredient.count.mockResolvedValue(0);

      await service.findAll({ search: "chicken" });

      expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: "chicken", mode: "insensitive" } },
            ]),
          }),
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return ingredient by id", async () => {
      const mockIngredient = { id: "1", name: "Chicken" };
      mockPrisma.ingredient.findUnique.mockResolvedValue(mockIngredient);

      const result = await service.findOne("1");

      expect(result).toEqual(mockIngredient);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrisma.ingredient.findUnique.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow("Ingredient with ID 999 not found");
    });
  });

  describe("create", () => {
    it("should create ingredient and inventory", async () => {
      const dto = {
        name: "Chicken",
        categoryId: "cat-1",
        unitId: "unit-1",
        purchasePrice: 45000,
        minimumStock: 10,
      };

      mockPrisma.ingredient.create.mockResolvedValue({ id: "1", ...dto });
      mockPrisma.inventory.create.mockResolvedValue({ id: "inv-1" });

      const result = await service.create(dto);

      expect(result.name).toBe("Chicken");
      expect(mockPrisma.inventory.create).toHaveBeenCalled();
    });

    it("should throw ConflictException if SKU exists", async () => {
      const dto = { name: "Chicken", sku: "CHK-001", categoryId: "cat-1", unitId: "unit-1" };
      mockPrisma.ingredient.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.create(dto)).rejects.toThrow("already exists");
    });
  });

  describe("update", () => {
    it("should update ingredient", async () => {
      mockPrisma.ingredient.findUnique.mockResolvedValue({ id: "1", name: "Chicken" });
      mockPrisma.ingredient.update.mockResolvedValue({ id: "1", name: "Updated" });

      const result = await service.update("1", { name: "Updated" });

      expect(result.name).toBe("Updated");
    });
  });

  describe("remove", () => {
    it("should soft delete ingredient", async () => {
      mockPrisma.ingredient.findUnique.mockResolvedValue({ id: "1" });
      mockPrisma.ingredient.update.mockResolvedValue({ id: "1", isActive: false });

      const result = await service.remove("1");

      expect(result.isActive).toBe(false);
    });
  });

  describe("getCategories", () => {
    it("should return categories", async () => {
      const mockCategories = [{ id: "1", name: "Meat" }];
      mockPrisma.ingredientCategory.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result).toEqual(mockCategories);
    });
  });

  describe("getUnits", () => {
    it("should return units", async () => {
      const mockUnits = [{ id: "1", name: "Kilogram", symbol: "kg" }];
      mockPrisma.unit.findMany.mockResolvedValue(mockUnits);

      const result = await service.getUnits();

      expect(result).toEqual(mockUnits);
    });
  });
});
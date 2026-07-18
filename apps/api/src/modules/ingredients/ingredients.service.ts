import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { search, categoryId, supplierId, page = 1, pageSize = 50 } = params || {};

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [items, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        include: {
          category: true,
          unit: true,
          supplier: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
        supplier: true,
        inventory: true,
      },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }

    return ingredient;
  }

  async create(dto: CreateIngredientDto) {
    // Check if SKU already exists
    if (dto.sku) {
      const existing = await this.prisma.ingredient.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(`Ingredient with SKU ${dto.sku} already exists`);
      }
    }

    const ingredient = await this.prisma.ingredient.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        purchasePrice: dto.purchasePrice || 0,
        minimumStock: dto.minimumStock || 0,
        notes: dto.notes,
        supplierId: dto.supplierId,
      },
      include: {
        category: true,
        unit: true,
        supplier: true,
      },
    });

    // Create inventory record
    await this.prisma.inventory.create({
      data: {
        ingredientId: ingredient.id,
        currentStock: 0,
        reservedStock: 0,
        incomingStock: 0,
        averageCost: dto.purchasePrice || 0,
      },
    });

    return ingredient;
  }

  async update(id: string, dto: UpdateIngredientDto) {
    const ingredient = await this.findOne(id);

    // Check SKU uniqueness if changing
    if (dto.sku && dto.sku !== ingredient.sku) {
      const existing = await this.prisma.ingredient.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(`Ingredient with SKU ${dto.sku} already exists`);
      }
    }

    return this.prisma.ingredient.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        purchasePrice: dto.purchasePrice,
        minimumStock: dto.minimumStock,
        notes: dto.notes,
        supplierId: dto.supplierId,
      },
      include: {
        category: true,
        unit: true,
        supplier: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete - mark as inactive
    return this.prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCategories() {
    return this.prisma.ingredientCategory.findMany({
      orderBy: { name: "asc" },
    });
  }

  async getUnits() {
    return this.prisma.unit.findMany({
      orderBy: { name: "asc" },
    });
  }

  async getLowStock() {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { isActive: true },
      include: {
        category: true,
        unit: true,
        inventory: true,
      },
      orderBy: { name: "asc" },
    });

    return ingredients.filter(
      (inv) => inv.inventory && inv.inventory.currentStock <= inv.minimumStock,
    );
  }
}
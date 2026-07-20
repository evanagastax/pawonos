import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { CreateRecipeVersionDto } from "./dto/create-recipe-version.dto";
import { CreateRecipeItemDto } from "./dto/create-recipe-item.dto";
import { CreateRecipeStepDto } from "./dto/create-recipe-step.dto";

// Inline unit conversion (from @pawonos/utils)
const UNIT_TO_BASE: Record<string, { base: string; factor: number }> = {
  kg: { base: "kg", factor: 1 },
  g: { base: "kg", factor: 0.001 },
  mg: { base: "kg", factor: 0.000001 },
  l: { base: "l", factor: 1 },
  ml: { base: "l", factor: 0.001 },
  pcs: { base: "pcs", factor: 1 },
  pack: { base: "pcs", factor: 1 },
  box: { base: "pcs", factor: 1 },
  sachet: { base: "pcs", factor: 1 },
};

function calculateItemCost(purchasePrice: number, purchaseUnit: string, quantity: number, recipeUnit: string): number {
  if (purchaseUnit.toLowerCase() === recipeUnit.toLowerCase()) return purchasePrice * quantity;
  const from = UNIT_TO_BASE[recipeUnit.toLowerCase()];
  const to = UNIT_TO_BASE[purchaseUnit.toLowerCase()];
  if (!from || !to || from.base !== to.base) return purchasePrice * quantity;
  const convertedQty = (quantity * from.factor) / to.factor;
  return purchasePrice * convertedQty;
}

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // RECIPE CRUD
  // ============================================

  async findAll(params?: { search?: string; page?: number; pageSize?: number }) {
    const { search, page = 1, pageSize = 50 } = params || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        include: {
          versions: {
            where: { isActive: true },
            orderBy: { version: "desc" },
            take: 1,
          },
          _count: {
            select: { menuItems: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.recipe.count({ where }),
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
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          include: {
            items: {
              include: {
                ingredient: {
                  include: { unit: true },
                },
                packaging: {
                  include: { unit: true },
                },
                unit: true,
              },
            },
            steps: {
              orderBy: { stepNumber: "asc" },
            },
          },
        },
        menuItems: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    return recipe;
  }

  async create(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: CreateRecipeDto) {
    await this.findOne(id);

    return this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async remove(id: string) {
    const recipe = await this.findOne(id);

    // Check if recipe has menu items
    if (recipe.menuItems.length > 0) {
      throw new BadRequestException("Cannot delete recipe with menu items");
    }

    // Cascade delete: versions -> items/steps -> recipe
    for (const version of recipe.versions) {
      await this.prisma.recipeItem.deleteMany({ where: { recipeVersionId: version.id } });
      await this.prisma.recipeStep.deleteMany({ where: { recipeVersionId: version.id } });
    }
    await this.prisma.recipeVersion.deleteMany({ where: { recipeId: id } });

    return this.prisma.recipe.delete({
      where: { id },
    });
  }

  // ============================================
  // RECIPE VERSIONING
  // ============================================

  async createVersion(recipeId: string, dto: CreateRecipeVersionDto) {
    const recipe = await this.findOne(recipeId);

    // Get next version number
    const latestVersion = recipe.versions[0];
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    return this.prisma.recipeVersion.create({
      data: {
        recipeId,
        version: nextVersion,
        yield: dto.yield || 1,
        prepTime: dto.prepTime,
        cookTime: dto.cookTime,
        instructions: dto.instructions,
        notes: dto.notes,
      },
      include: {
        items: true,
        steps: true,
      },
    });
  }

  async getVersion(recipeId: string, versionId: string) {
    const version = await this.prisma.recipeVersion.findUnique({
      where: { id: versionId },
      include: {
        recipe: true,
        items: {
          include: {
            ingredient: {
              include: { unit: true },
            },
            packaging: {
              include: { unit: true },
            },
            unit: true,
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    if (!version || version.recipeId !== recipeId) {
      throw new NotFoundException("Recipe version not found");
    }

    return version;
  }

  async getVersions(recipeId: string) {
    return this.prisma.recipeVersion.findMany({
      where: { recipeId },
      orderBy: { version: "desc" },
      include: {
        _count: {
          select: { items: true, steps: true },
        },
      },
    });
  }

  // ============================================
  // RECIPE ITEMS (INGREDIENTS)
  // ============================================

  async addItem(recipeId: string, versionId: string, dto: CreateRecipeItemDto) {
    const version = await this.getVersion(recipeId, versionId);

    // Validate ingredient or packaging exists
    if (dto.ingredientId) {
      const ingredient = await this.prisma.ingredient.findUnique({
        where: { id: dto.ingredientId },
      });
      if (!ingredient) {
        throw new NotFoundException("Ingredient not found");
      }
    }

    if (dto.packagingId) {
      const packaging = await this.prisma.packaging.findUnique({
        where: { id: dto.packagingId },
      });
      if (!packaging) {
        throw new NotFoundException("Packaging not found");
      }
    }

    const item = await this.prisma.recipeItem.create({
      data: {
        recipeVersionId: versionId,
        ingredientId: dto.ingredientId,
        packagingId: dto.packagingId,
        quantity: dto.quantity,
        unitId: dto.unitId,
        notes: dto.notes,
      },
      include: {
        ingredient: {
          include: { unit: true },
        },
        packaging: {
          include: { unit: true },
        },
        unit: true,
      },
    });

    // Recalculate version cost
    await this.calculateVersionCost(recipeId, versionId);

    return item;
  }

  async updateItem(recipeId: string, versionId: string, itemId: string, dto: CreateRecipeItemDto) {
    await this.getVersion(recipeId, versionId);

    const item = await this.prisma.recipeItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.recipeVersionId !== versionId) {
      throw new NotFoundException("Recipe item not found");
    }

    const updated = await this.prisma.recipeItem.update({
      where: { id: itemId },
      data: {
        ingredientId: dto.ingredientId,
        packagingId: dto.packagingId,
        quantity: dto.quantity,
        unitId: dto.unitId,
        notes: dto.notes,
      },
      include: {
        ingredient: {
          include: { unit: true },
        },
        packaging: {
          include: { unit: true },
        },
        unit: true,
      },
    });

    // Recalculate version cost
    await this.calculateVersionCost(recipeId, versionId);

    return updated;
  }

  async removeItem(recipeId: string, versionId: string, itemId: string) {
    await this.getVersion(recipeId, versionId);

    const item = await this.prisma.recipeItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.recipeVersionId !== versionId) {
      throw new NotFoundException("Recipe item not found");
    }

    await this.prisma.recipeItem.delete({
      where: { id: itemId },
    });

    // Recalculate version cost
    await this.calculateVersionCost(recipeId, versionId);

    return { success: true };
  }

  // ============================================
  // RECIPE STEPS
  // ============================================

  async addStep(recipeId: string, versionId: string, dto: CreateRecipeStepDto) {
    await this.getVersion(recipeId, versionId);

    return this.prisma.recipeStep.create({
      data: {
        recipeVersionId: versionId,
        stepNumber: dto.stepNumber,
        instruction: dto.instruction,
        duration: dto.duration,
        notes: dto.notes,
      },
    });
  }

  async updateStep(recipeId: string, versionId: string, stepId: string, dto: CreateRecipeStepDto) {
    await this.getVersion(recipeId, versionId);

    const step = await this.prisma.recipeStep.findUnique({
      where: { id: stepId },
    });

    if (!step || step.recipeVersionId !== versionId) {
      throw new NotFoundException("Recipe step not found");
    }

    return this.prisma.recipeStep.update({
      where: { id: stepId },
      data: {
        stepNumber: dto.stepNumber,
        instruction: dto.instruction,
        duration: dto.duration,
        notes: dto.notes,
      },
    });
  }

  async removeStep(recipeId: string, versionId: string, stepId: string) {
    await this.getVersion(recipeId, versionId);

    const step = await this.prisma.recipeStep.findUnique({
      where: { id: stepId },
    });

    if (!step || step.recipeVersionId !== versionId) {
      throw new NotFoundException("Recipe step not found");
    }

    await this.prisma.recipeStep.delete({
      where: { id: stepId },
    });

    return { success: true };
  }

  // ============================================
  // COST CALCULATION
  // ============================================

  async calculateVersionCost(recipeId: string, versionId: string) {
    const version = await this.getVersion(recipeId, versionId);

    let materialCost = 0;
    let packagingCost = 0;

    // Calculate ingredient costs with unit conversion
    for (const item of version.items) {
      if (item.ingredient) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { ingredientId: item.ingredientId },
        });
        const purchasePrice = inventory?.averageCost || item.ingredient.purchasePrice || 0;
        const purchaseUnit = item.ingredient.unit?.symbol || "kg";
        const recipeUnit = item.unit?.symbol || "kg";
        
        // Use unit-aware cost calculation
        // purchasePrice is per purchaseUnit (e.g., per kg)
        // item.quantity is in recipeUnit (e.g., grams)
        materialCost += calculateItemCost(purchasePrice, purchaseUnit, item.quantity, recipeUnit);
      }
      if (item.packaging) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { packagingId: item.packagingId },
        });
        const unitCost = inventory?.averageCost || item.packaging.purchasePrice || 0;
        packagingCost += unitCost * item.quantity;
      }
    }

    // Calculate labor cost (default rates)
    const laborRate = await this.prisma.laborRate.findFirst({
      orderBy: { effectiveDate: "desc" },
    });
    const laborCost = laborRate ? laborRate.dailyRate / 100 : 0; // Assume 100 meals per day default

    // Calculate utility cost (default rates)
    const utilityRate = await this.prisma.utilityRate.findFirst({
      orderBy: { effectiveDate: "desc" },
    });
    const utilityCost = utilityRate ? utilityRate.costPerDay / 100 : 0;

    // Calculate overhead cost
    const costSettings = await this.prisma.costSettings.findFirst();
    const expectedMeals = costSettings?.expectedMonthlyMeals || 12000;
    const monthlyOverhead = await this.prisma.overheadCost.aggregate({
      _sum: { amount: true },
      where: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    });
    const overheadCost = (monthlyOverhead._sum.amount || 0) / expectedMeals;

    const totalCost = materialCost + packagingCost + laborCost + utilityCost + overheadCost;

    // Update version with costs
    await this.prisma.recipeVersion.update({
      where: { id: versionId },
      data: {
        materialCost: Math.round(materialCost * 100) / 100,
        packagingCost: Math.round(packagingCost * 100) / 100,
        laborCost: Math.round(laborCost * 100) / 100,
        utilityCost: Math.round(utilityCost * 100) / 100,
        overheadCost: Math.round(overheadCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
      },
    });

    return {
      materialCost: Math.round(materialCost * 100) / 100,
      packagingCost: Math.round(packagingCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      utilityCost: Math.round(utilityCost * 100) / 100,
      overheadCost: Math.round(overheadCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  // ============================================
  // INGREDIENT ALTERNATIVES
  // ============================================

  async getAlternatives(ingredientId: string) {
    return this.prisma.ingredientAlternative.findMany({
      where: { ingredientId },
      include: {
        alternative: {
          include: { unit: true },
        },
      },
    });
  }

  async addAlternative(ingredientId: string, alternativeId: string, data: {
    conversionRate?: number;
    costDifference?: number;
    qualityRating?: number;
    notes?: string;
  }) {
    // Prevent self-reference
    if (ingredientId === alternativeId) {
      throw new BadRequestException("Cannot add ingredient as its own alternative");
    }

    // Check both ingredients exist
    const [ingredient, alternative] = await Promise.all([
      this.prisma.ingredient.findUnique({ where: { id: ingredientId } }),
      this.prisma.ingredient.findUnique({ where: { id: alternativeId } }),
    ]);

    if (!ingredient || !alternative) {
      throw new NotFoundException("Ingredient not found");
    }

    return this.prisma.ingredientAlternative.upsert({
      where: {
        ingredientId_alternativeId: { ingredientId, alternativeId },
      },
      update: {
        conversionRate: data.conversionRate || 1,
        costDifference: data.costDifference || 0,
        qualityRating: data.qualityRating || 5,
        notes: data.notes,
      },
      create: {
        ingredientId,
        alternativeId,
        conversionRate: data.conversionRate || 1,
        costDifference: data.costDifference || 0,
        qualityRating: data.qualityRating || 5,
        notes: data.notes,
      },
      include: {
        alternative: true,
      },
    });
  }

  async removeAlternative(ingredientId: string, alternativeId: string) {
    return this.prisma.ingredientAlternative.delete({
      where: {
        ingredientId_alternativeId: { ingredientId, alternativeId },
      },
    });
  }
}
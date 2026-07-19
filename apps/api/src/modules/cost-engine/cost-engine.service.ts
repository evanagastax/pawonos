import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { calculateItemCost } from "@pawonos/utils";

@Injectable()
export class CostEngineService {
  constructor(private prisma: PrismaService) {}

  async calculateStandardHpp(recipeVersionId: string) {
    const version = await this.prisma.recipeVersion.findUnique({
      where: { id: recipeVersionId },
      include: {
        items: {
          include: {
            ingredient: { include: { unit: true } },
            packaging: { include: { unit: true } },
            unit: true,
          },
        },
      },
    });
    if (!version) throw new NotFoundException("Recipe version not found");

    let materialCost = 0;
    let packagingCost = 0;

    for (const item of version.items) {
      if (item.ingredient) {
        const inventory = await this.prisma.inventory.findUnique({ where: { ingredientId: item.ingredientId } });
        const purchasePrice = inventory?.averageCost || item.ingredient.purchasePrice || 0;
        const purchaseUnit = item.ingredient.unit?.symbol || "kg";
        const recipeUnit = item.unit?.symbol || "kg";
        
        // Use unit-aware cost calculation
        materialCost += calculateItemCost(purchasePrice, purchaseUnit, item.quantity, recipeUnit);
      }
      if (item.packaging) {
        const inventory = await this.prisma.inventory.findUnique({ where: { packagingId: item.packagingId } });
        const unitCost = inventory?.averageCost || item.packaging.purchasePrice || 0;
        packagingCost += unitCost * item.quantity;
      }
    }

    const laborRate = await this.prisma.laborRate.findFirst({ orderBy: { effectiveDate: "desc" } });
    const utilityRate = await this.prisma.utilityRate.findFirst({ orderBy: { effectiveDate: "desc" } });
    const costSettings = await this.prisma.costSettings.findFirst();
    const expectedMeals = costSettings?.expectedMonthlyMeals || 12000;

    const monthlyOverhead = await this.prisma.overheadCost.aggregate({
      _sum: { amount: true },
      where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    });

    const laborCost = laborRate ? laborRate.dailyRate / 100 : 0;
    const utilityCost = utilityRate ? utilityRate.costPerDay / 100 : 0;
    const overheadCost = (monthlyOverhead._sum.amount || 0) / expectedMeals;
    const totalCost = materialCost + packagingCost + laborCost + utilityCost + overheadCost;

    return {
      type: "STANDARD",
      materialCost: Math.round(materialCost * 100) / 100,
      packagingCost: Math.round(packagingCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      utilityCost: Math.round(utilityCost * 100) / 100,
      overheadCost: Math.round(overheadCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  async calculateActualHpp(productionBatchId: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: productionBatchId },
      include: {
        items: {
          include: {
            recipeVersion: {
              include: {
                items: { include: { ingredient: true, packaging: true } },
              },
            },
          },
        },
        order: true,
      },
    });
    if (!batch) throw new NotFoundException("Production batch not found");

    let materialCost = 0;
    let packagingCost = 0;

    for (const batchItem of batch.items) {
      for (const recipeItem of batchItem.recipeVersion.items) {
        if (recipeItem.ingredient) {
          const inventory = await this.prisma.inventory.findUnique({ where: { ingredientId: recipeItem.ingredientId } });
          const unitCost = inventory?.averageCost || recipeItem.ingredient.purchasePrice || 0;
          materialCost += unitCost * recipeItem.quantity * batchItem.quantity;
        }
        if (recipeItem.packaging) {
          const inventory = await this.prisma.inventory.findUnique({ where: { packagingId: recipeItem.packagingId } });
          const unitCost = inventory?.averageCost || recipeItem.packaging.purchasePrice || 0;
          packagingCost += unitCost * recipeItem.quantity * batchItem.quantity;
        }
      }
    }

    const laborRate = await this.prisma.laborRate.findFirst({ orderBy: { effectiveDate: "desc" } });
    const utilityRate = await this.prisma.utilityRate.findFirst({ orderBy: { effectiveDate: "desc" } });
    const laborCost = laborRate ? laborRate.dailyRate : 0;
    const utilityCost = utilityRate ? utilityRate.costPerDay : 0;

    const costSettings = await this.prisma.costSettings.findFirst();
    const expectedMeals = costSettings?.expectedMonthlyMeals || 12000;
    const monthlyOverhead = await this.prisma.overheadCost.aggregate({
      _sum: { amount: true },
      where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    });
    const overheadCost = ((monthlyOverhead._sum.amount || 0) / expectedMeals) * (batch.order?.quantity || 1);

    const totalCost = materialCost + packagingCost + laborCost + utilityCost + overheadCost;
    const totalMeals = batch.order?.quantity || 1;

    return {
      type: "ACTUAL",
      productionBatchId,
      totalMeals,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerMeal: Math.round((totalCost / totalMeals) * 100) / 100,
      materialCost: Math.round(materialCost * 100) / 100,
      packagingCost: Math.round(packagingCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      utilityCost: Math.round(utilityCost * 100) / 100,
      overheadCost: Math.round(overheadCost * 100) / 100,
    };
  }

  async calculateSellingPrice(hpp: number, targetMargin: number) {
    if (targetMargin >= 1) return 0;
    const price = hpp / (1 - targetMargin);
    return Math.ceil(price / 100) * 100; // Round up to nearest 100
  }

  async calculateMaxHpp(budget: number, targetMargin: number) {
    return Math.floor(budget * (1 - targetMargin));
  }

  async analyzePricing(menuItemId: string, sellingPrice: number) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { recipeVersion: true },
    });
    if (!menuItem) throw new NotFoundException("Menu item not found");

    const hpp = await this.calculateStandardHpp(menuItem.recipeVersionId);
    const foodCostPercentage = sellingPrice > 0 ? (hpp.totalCost / sellingPrice) * 100 : 0;
    const margin = sellingPrice > 0 ? ((sellingPrice - hpp.totalCost) / sellingPrice) * 100 : 0;
    const markup = hpp.totalCost > 0 ? ((sellingPrice - hpp.totalCost) / hpp.totalCost) * 100 : 0;

    const costSettings = await this.prisma.costSettings.findFirst();
    const targetMargin = (costSettings?.targetMargin || 0.35) * 100;
    const targetFoodCost = (costSettings?.targetFoodCost || 0.35) * 100;

    return {
      menuItemId,
      sellingPrice,
      hpp: hpp.totalCost,
      foodCostPercentage: Math.round(foodCostPercentage * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      markup: Math.round(markup * 100) / 100,
      grossProfit: sellingPrice - hpp.totalCost,
      isWithinTarget: foodCostPercentage <= targetFoodCost,
      targetMargin,
      targetFoodCost,
      suggestedPrice: await this.calculateSellingPrice(hpp.totalCost, targetMargin / 100),
    };
  }

  async getDashboardKpis(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await this.prisma.order.findMany({
      where: { deliveryDate: { gte: targetDate, lt: nextDay } },
      include: { items: true },
    });

    const revenue = orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);
    const totalMeals = orders.reduce((sum, o) => sum + o.quantity, 0);

    const inventoryValue = await this.prisma.inventory.findMany();
    const totalInventoryValue = inventoryValue.reduce((sum, inv) => sum + inv.currentStock * inv.averageCost, 0);

    const lowStock = await this.prisma.inventory.findMany({
      include: { ingredient: true, packaging: true },
    });
    const lowStockCount = lowStock.filter(inv => {
      if (inv.ingredient) return inv.currentStock <= inv.ingredient.minimumStock;
      if (inv.packaging) return inv.currentStock <= inv.packaging.minimumStock;
      return false;
    }).length;

    return {
      date: targetDate.toISOString().split("T")[0],
      totalOrders: orders.length,
      totalMeals,
      revenue,
      estimatedProfit: revenue * 0.3, // Simplified
      inventoryValue: totalInventoryValue,
      lowStockCount,
    };
  }

  async optimizeForBudget(recipeVersionId: string, budget: number, targetMargin: number) {
    const maxHpp = await this.calculateMaxHpp(budget, targetMargin);
    const currentHpp = await this.calculateStandardHpp(recipeVersionId);
    const difference = currentHpp.totalCost - maxHpp;

    if (difference <= 0) {
      return {
        withinBudget: true,
        budget,
        maxHpp,
        currentHpp: currentHpp.totalCost,
        savings: 0,
        suggestions: [],
      };
    }

    const version = await this.prisma.recipeVersion.findUnique({
      where: { id: recipeVersionId },
      include: {
        items: {
          include: {
            ingredient: { include: { unit: true } },
            packaging: { include: { unit: true } },
          },
        },
        recipe: true,
      },
    });

    const suggestions: any[] = [];

    // Check alternative recipe versions
    if (version) {
      const altVersions = await this.prisma.recipeVersion.findMany({
        where: { recipeId: version.recipeId, id: { not: recipeVersionId }, isActive: true },
      });
      for (const alt of altVersions) {
        const altHpp = await this.calculateStandardHpp(alt.id);
        if (altHpp.totalCost < currentHpp.totalCost) {
          suggestions.push({
            type: "RECIPE_VERSION",
            description: `Use ${version.recipe.name} v${alt.version}`,
            savings: currentHpp.totalCost - altHpp.totalCost,
            qualityImpact: "low",
            confidence: 0.9,
          });
        }
      }

      // Check ingredient alternatives
      for (const item of version.items) {
        if (item.ingredient) {
          const alternatives = await this.prisma.ingredientAlternative.findMany({
            where: { ingredientId: item.ingredientId },
            include: { alternative: true },
          });
          for (const alt of alternatives) {
            const savings = (item.ingredient.purchasePrice - alt.alternative.purchasePrice) * item.quantity;
            if (savings > 0) {
              suggestions.push({
                type: "INGREDIENT_ALTERNATIVE",
                description: `Replace ${item.ingredient.name} with ${alt.alternative.name}`,
                savings: Math.round(savings * 100) / 100,
                qualityImpact: alt.qualityRating >= 7 ? "low" : "medium",
                confidence: alt.qualityRating / 10,
              });
            }
          }
        }
      }
    }

    return {
      withinBudget: false,
      budget,
      maxHpp,
      currentHpp: currentHpp.totalCost,
      difference: Math.round(difference * 100) / 100,
      suggestions: suggestions.sort((a, b) => b.savings - a.savings),
    };
  }
}
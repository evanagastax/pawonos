import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ForecastService {
  constructor(private prisma: PrismaService) {}

  async forecastDemand(days = 7) {
    // Get historical order data (last 90 days)
    const start = new Date();
    start.setDate(start.getDate() - 90);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ["DELIVERED", "COMPLETED"] },
        deliveryDate: { gte: start },
      },
      include: { mealTemplate: true },
    });

    // Group by day of week
    const byDayOfWeek: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const order of orders) {
      const day = order.deliveryDate.getDay();
      byDayOfWeek[day].push(order.quantity);
    }

    // Calculate averages
    const forecast = [];
    const now = new Date();
    for (let i = 1; i <= days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const quantities = byDayOfWeek[dayOfWeek];

      const avg = quantities.length > 0
        ? Math.round(quantities.reduce((a, b) => a + b, 0) / quantities.length)
        : 0;

      forecast.push({
        date: date.toISOString().split("T")[0],
        dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
        predictedOrders: avg,
        confidence: Math.min(quantities.length / 10, 1), // More data = more confidence
      });
    }

    return { forecast, basedOnDays: 90, totalOrdersAnalyzed: orders.length };
  }

  async forecastIngredients(days = 7) {
    const demand = await this.forecastDemand(days);
    const totalMeals = demand.forecast.reduce((sum, f) => sum + f.predictedOrders, 0);

    // Get top menu items
    const topItems = await this.prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const ingredients: Record<string, { name: string; quantity: number; unit: string; estimatedCost: number }> = {};

    for (const item of topItems) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: {
          recipeVersion: {
            include: { items: { include: { ingredient: { include: { unit: true } }, unit: true } } },
          },
        },
      });

      if (menuItem?.recipeVersion) {
        const ratio = (item._sum.quantity || 0) / (demand.forecast.length || 1);
        for (const recipeItem of menuItem.recipeVersion.items) {
          if (recipeItem.ingredient) {
            const key = recipeItem.ingredientId!;
            if (!ingredients[key]) {
              ingredients[key] = {
                name: recipeItem.ingredient.name,
                quantity: 0,
                unit: recipeItem.unit?.symbol || "kg",
                estimatedCost: 0,
              };
            }
            const qty = recipeItem.quantity * ratio * days;
            ingredients[key].quantity += qty;
            ingredients[key].estimatedCost += qty * (recipeItem.ingredient.purchasePrice || 0);
          }
        }
      }
    }

    return {
      period: `${days} days`,
      totalMeals,
      ingredients: Object.values(ingredients)
        .map(i => ({ ...i, quantity: Math.round(i.quantity * 100) / 100, estimatedCost: Math.round(i.estimatedCost) }))
        .sort((a, b) => b.estimatedCost - a.estimatedCost),
    };
  }

  async forecastRevenue(days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - 90);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ["DELIVERED", "COMPLETED"] },
        deliveryDate: { gte: start },
      },
    });

    const dailyRevenue: Record<string, number> = {};
    for (const order of orders) {
      const day = order.deliveryDate.toISOString().split("T")[0];
      dailyRevenue[day] = (dailyRevenue[day] || 0) + order.sellingPrice * order.quantity;
    }

    const values = Object.values(dailyRevenue);
    const avgDaily = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      historicalAvgDaily: Math.round(avgDaily),
      forecastedTotal: Math.round(avgDaily * days),
      period: `${days} days`,
      basedOnDays: 90,
    };
  }

  async suggestMenuOptimization() {
    // Find low-margin items
    const menuItems = await this.prisma.menuItem.findMany({
      include: {
        recipeVersion: true,
      },
    });

    const suggestions = [];

    for (const item of menuItems) {
      if (item.recipeVersion) {
        const hpp = item.recipeVersion.totalCost;
        const margin = item.sellingPrice > 0
          ? ((item.sellingPrice - hpp) / item.sellingPrice) * 100
          : 0;

        if (margin < 20) {
          suggestions.push({
            menuItem: item.name,
            currentPrice: item.sellingPrice,
            hpp,
            margin: Math.round(margin * 10) / 10,
            suggestion: margin < 0 ? "Increase price or reduce cost" : "Low margin - consider optimization",
          });
        }
      }
    }

    return suggestions.sort((a, b) => a.margin - b.margin);
  }
}
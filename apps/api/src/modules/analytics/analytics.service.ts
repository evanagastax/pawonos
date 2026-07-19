import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(period?: string) {
    const now = new Date();
    const start = period === "week"
      ? new Date(now.setDate(now.getDate() - 7))
      : period === "year"
        ? new Date(now.getFullYear(), 0, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    const [orders, revenue, expenses, production] = await Promise.all([
      this.getOrderStats(start, end),
      this.getRevenueStats(start, end),
      this.getExpenseStats(start, end),
      this.getProductionStats(start, end),
    ]);

    return { period: { start, end }, orders, revenue, expenses, production };
  }

  async getOrderStats(start: Date, end: Date) {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { customer: true },
    });

    const byStatus: Record<string, number> = {};
    const byCustomer: Record<string, number> = {};
    let totalRevenue = 0;

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      byCustomer[order.customer?.name || "Unknown"] = (byCustomer[order.customer?.name || "Unknown"] || 0) + 1;
      totalRevenue += order.sellingPrice * order.quantity;
    }

    return {
      total: orders.length,
      totalRevenue,
      byStatus,
      topCustomers: Object.entries(byCustomer)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    };
  }

  async getRevenueStats(start: Date, end: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ["DELIVERED", "COMPLETED"] },
        deliveryDate: { gte: start, lte: end },
      },
    });

    const byDay: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const order of orders) {
      const day = order.deliveryDate.toISOString().split("T")[0];
      const month = order.deliveryDate.toISOString().slice(0, 7);
      const amount = order.sellingPrice * order.quantity;
      byDay[day] = (byDay[day] || 0) + amount;
      byMonth[month] = (byMonth[month] || 0) + amount;
    }

    return {
      total: orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0),
      byDay,
      byMonth,
    };
  }

  async getExpenseStats(start: Date, end: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true },
    });

    const byCategory: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const expense of expenses) {
      const cat = expense.category?.name || "Other";
      const day = expense.date.toISOString().split("T")[0];
      byCategory[cat] = (byCategory[cat] || 0) + expense.amount;
      byDay[day] = (byDay[day] || 0) + expense.amount;
    }

    return {
      total: expenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory,
      byDay,
    };
  }

  async getProductionStats(start: Date, end: Date) {
    const batches = await this.prisma.productionBatch.findMany({
      where: { createdAt: { gte: start, lte: end } },
    });

    const byStatus: Record<string, number> = {};
    for (const batch of batches) {
      byStatus[batch.status] = (byStatus[batch.status] || 0) + 1;
    }

    return {
      total: batches.length,
      byStatus,
    };
  }

  async getTopMenuItems(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const result = [];
    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      result.push({
        name: menuItem?.name || "Unknown",
        quantity: item._sum.quantity,
        revenue: item._sum.totalPrice,
      });
    }

    return result;
  }

  async getIngredientUsage(days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        type: "CONSUMPTION",
        createdAt: { gte: start },
      },
      include: { ingredient: true },
    });

    const usage: Record<string, { name: string; quantity: number; cost: number }> = {};
    for (const tx of transactions) {
      const name = tx.ingredient?.name || "Unknown";
      if (!usage[tx.ingredientId || ""]) {
        usage[tx.ingredientId || ""] = { name, quantity: 0, cost: 0 };
      }
      usage[tx.ingredientId || ""].quantity += Math.abs(tx.quantity);
      usage[tx.ingredientId || ""].cost += tx.totalCost;
    }

    return Object.values(usage).sort((a, b) => b.cost - a.cost);
  }

  async getProfitTrend(months = 6) {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [orders, expenses] = await Promise.all([
        this.prisma.order.findMany({
          where: {
            status: { in: ["DELIVERED", "COMPLETED"] },
            deliveryDate: { gte: start, lte: end },
          },
        }),
        this.prisma.expense.findMany({
          where: { date: { gte: start, lte: end } },
        }),
      ]);

      const revenue = orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      result.push({
        month: start.toISOString().slice(0, 7),
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
      });
    }

    return result;
  }
}
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // EXPENSE CATEGORIES
  // ============================================

  async getCategories() {
    return this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createCategory(name: string) {
    return this.prisma.expenseCategory.create({
      data: { name },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // EXPENSES
  // ============================================

  async getExpenses(params?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { categoryId, startDate, endDate, page = 1, pageSize = 50 } = params || {};

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!expense) throw new NotFoundException("Expense not found");
    return expense;
  }

  async createExpense(dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
      },
      include: { category: true },
    });
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    await this.getExpense(id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { category: true },
    });
  }

  async deleteExpense(id: string) {
    await this.getExpense(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  // ============================================
  // FINANCIAL REPORTS
  // ============================================

  async getCashFlow(params?: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params || {};
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get revenue from completed orders
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ["DELIVERED", "COMPLETED"] },
        deliveryDate: { gte: start, lte: end },
      },
    });
    const revenue = orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);

    // Get expenses
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get payments received
    const payments = await this.prisma.payment.findMany({
      where: { paymentDate: { gte: start, lte: end } },
    });
    const paymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      period: { start, end },
      revenue,
      expenses: totalExpenses,
      paymentsReceived,
      netCashFlow: paymentsReceived - totalExpenses,
      profit: revenue - totalExpenses,
      breakdown: {
        expensesByCategory: await this.getExpensesByCategory(start, end),
      },
    };
  }

  async getExpensesByCategory(start: Date, end: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true },
    });

    const byCategory: Record<string, number> = {};
    for (const expense of expenses) {
      const cat = expense.category?.name || "Uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + expense.amount;
    }

    return Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  async getProfitLoss(params?: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params || {};
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Revenue
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ["DELIVERED", "COMPLETED"] },
        deliveryDate: { gte: start, lte: end },
      },
    });
    const revenue = orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);

    // COGS (from HPP snapshots)
    const batches = await this.prisma.productionBatch.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: start, lte: end },
      },
      include: { hppSnapshot: true },
    });
    const cogs = batches.reduce((sum, b) => sum + (b.hppSnapshot?.totalCost || 0), 0);

    // Expenses
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      period: { start, end },
      revenue,
      cogs,
      grossProfit,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operatingExpenses: totalExpenses,
      netProfit,
      netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    };
  }
}
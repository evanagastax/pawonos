import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string; orderId?: string; page?: number; pageSize?: number }) {
    const { status, orderId, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;
    const [items, total] = await Promise.all([
      this.prisma.productionBatch.findMany({
        where,
        include: {
          order: { include: { customer: true, mealTemplate: true } },
          items: { include: { recipeVersion: { include: { recipe: true } } } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { scheduledDate: "desc" },
      }),
      this.prisma.productionBatch.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id },
      include: {
        order: { include: { customer: true, mealTemplate: true } },
        items: { include: { recipeVersion: { include: { recipe: true, items: { include: { ingredient: true, unit: true } } } } } },
        logs: { orderBy: { createdAt: "desc" } },
        hppSnapshot: true,
      },
    });
    if (!batch) throw new NotFoundException("Production batch not found");
    return batch;
  }

  async generateFromOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        mealTemplate: { include: { items: { include: { menuItem: { include: { recipeVersion: true } } } } } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "CONFIRMED") throw new BadRequestException("Order must be confirmed first");

    const existing = await this.prisma.productionBatch.findFirst({ where: { orderId } });
    if (existing) throw new BadRequestException("Production batch already exists for this order");

    const batchNumber = `BATCH${Date.now().toString().slice(-8)}`;

    const batch = await this.prisma.productionBatch.create({
      data: {
        batchNumber,
        orderId,
        status: "PENDING",
        scheduledDate: order.deliveryDate,
      },
    });

    // Create batch items from meal template
    for (const templateItem of order.mealTemplate.items) {
      if (templateItem.menuItem.recipeVersionId) {
        await this.prisma.productionBatchItem.create({
          data: {
            productionBatchId: batch.id,
            recipeVersionId: templateItem.menuItem.recipeVersionId,
            quantity: templateItem.quantity * order.quantity,
          },
        });
      }
    }

    // Update order status
    await this.prisma.order.update({ where: { id: orderId }, data: { status: "PREPARING" } });

    // Log
    await this.prisma.productionLog.create({
      data: { productionBatchId: batch.id, action: "BATCH_CREATED", details: { orderId } },
    });

    return this.findOne(batch.id);
  }

  async updateStatus(id: string, status: string) {
    const batch = await this.findOne(id);
    const validTransitions: Record<string, string[]> = {
      PENDING: ["PREPARING", "CANCELLED"],
      PREPARING: ["COOKING", "CANCELLED"],
      COOKING: ["PACKAGING", "CANCELLED"],
      PACKAGING: ["READY"],
      READY: ["COMPLETED"],
    };
    if (!validTransitions[batch.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${batch.status} to ${status}`);
    }

    const updateData: any = { status };
    if (status === "PREPARING") updateData.startedAt = new Date();
    if (status === "COMPLETED") updateData.completedAt = new Date();

    await this.prisma.productionBatch.update({ where: { id }, data: updateData });
    await this.prisma.productionLog.create({
      data: { productionBatchId: id, action: `STATUS_${status}`, details: { previousStatus: batch.status } },
    });

    // If completed, update order status
    if (status === "COMPLETED") {
      await this.prisma.order.update({ where: { id: batch.orderId }, data: { status: "READY" } });
    }

    return this.findOne(id);
  }

  async getDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const batches = await this.prisma.productionBatch.findMany({
      where: {
        scheduledDate: { gte: targetDate, lt: nextDay },
      },
      include: { order: true },
    });

    return {
      date: targetDate.toISOString().split("T")[0],
      totalBatches: batches.length,
      pending: batches.filter(b => b.status === "PENDING").length,
      preparing: batches.filter(b => b.status === "PREPARING").length,
      cooking: batches.filter(b => b.status === "COOKING").length,
      packaging: batches.filter(b => b.status === "PACKAGING").length,
      ready: batches.filter(b => b.status === "READY").length,
      completed: batches.filter(b => b.status === "COMPLETED").length,
      totalMeals: batches.reduce((sum, b) => sum + (b.order?.quantity || 0), 0),
    };
  }
}
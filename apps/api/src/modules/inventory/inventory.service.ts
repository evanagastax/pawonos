import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { type?: string; lowStock?: boolean; page?: number; pageSize?: number }) {
    const { type, lowStock, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (type === "ingredient") where.ingredientId = { not: null };
    if (type === "packaging") where.packagingId = { not: null };

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          ingredient: { include: { unit: true, category: true } },
          packaging: { include: { unit: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    let filtered = items;
    if (lowStock) {
      filtered = items.filter(item => {
        if (item.ingredient) return item.currentStock <= item.ingredient.minimumStock;
        if (item.packaging) return item.currentStock <= item.packaging.minimumStock;
        return false;
      });
    }

    return { items: filtered, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        ingredient: { include: { unit: true, category: true } },
        packaging: { include: { unit: true } },
        transactions: { orderBy: { createdAt: "desc" }, take: 50 },
        reservations: { include: { order: true } },
      },
    });
    if (!inventory) throw new NotFoundException("Inventory not found");
    return inventory;
  }

  async purchase(inventoryId: string, quantity: number, unitCost: number, referenceId?: string) {
    const inventory = await this.findOne(inventoryId);
    const totalCost = quantity * unitCost;

    // Calculate weighted average cost
    const currentValue = inventory.currentStock * inventory.averageCost;
    const newValue = quantity * unitCost;
    const newStock = inventory.currentStock + quantity;
    const newAverageCost = newStock > 0 ? (currentValue + newValue) / newStock : unitCost;

    await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventoryId },
        data: {
          currentStock: newStock,
          averageCost: Math.round(newAverageCost * 100) / 100,
          lastRestockDate: new Date(),
        },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId,
          type: "PURCHASE",
          quantity,
          unitCost,
          totalCost,
          referenceId,
          referenceType: "PURCHASE_ORDER",
          ingredientId: inventory.ingredientId,
          packagingId: inventory.packagingId,
        },
      }),
    ]);

    return this.findOne(inventoryId);
  }

  async reserve(inventoryId: string, orderId: string, quantity: number) {
    const inventory = await this.findOne(inventoryId);
    const available = inventory.currentStock - inventory.reservedStock;
    if (quantity > available) throw new BadRequestException(`Insufficient stock. Available: ${available}`);

    await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventoryId },
        data: { reservedStock: inventory.reservedStock + quantity },
      }),
      this.prisma.inventoryReservation.create({
        data: { inventoryId, orderId, quantity, status: "ACTIVE" },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId,
          type: "RESERVATION",
          quantity: -quantity,
          unitCost: inventory.averageCost,
          totalCost: quantity * inventory.averageCost,
          referenceId: orderId,
          referenceType: "ORDER",
          ingredientId: inventory.ingredientId,
          packagingId: inventory.packagingId,
        },
      }),
    ]);

    return this.findOne(inventoryId);
  }

  async consume(inventoryId: string, orderId: string, quantity: number) {
    const inventory = await this.findOne(inventoryId);
    if (quantity > inventory.currentStock) throw new BadRequestException("Insufficient stock");

    const reservation = await this.prisma.inventoryReservation.findFirst({
      where: { inventoryId, orderId, status: "ACTIVE" },
    });

    await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventoryId },
        data: {
          currentStock: inventory.currentStock - quantity,
          reservedStock: reservation ? inventory.reservedStock - quantity : inventory.reservedStock,
        },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId,
          type: "CONSUMPTION",
          quantity: -quantity,
          unitCost: inventory.averageCost,
          totalCost: quantity * inventory.averageCost,
          referenceId: orderId,
          referenceType: "ORDER",
          ingredientId: inventory.ingredientId,
          packagingId: inventory.packagingId,
        },
      }),
    ]);

    if (reservation) {
      await this.prisma.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: "CONSUMED" },
      });
    }

    return this.findOne(inventoryId);
  }

  async adjust(inventoryId: string, newStock: number, reason: string) {
    const inventory = await this.findOne(inventoryId);
    const difference = newStock - inventory.currentStock;

    await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: newStock },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId,
          type: "ADJUSTMENT",
          quantity: difference,
          unitCost: inventory.averageCost,
          totalCost: Math.abs(difference) * inventory.averageCost,
          notes: reason,
          ingredientId: inventory.ingredientId,
          packagingId: inventory.packagingId,
        },
      }),
    ]);

    return this.findOne(inventoryId);
  }

  async waste(inventoryId: string, quantity: number, reason: string) {
    const inventory = await this.findOne(inventoryId);
    if (quantity > inventory.currentStock) throw new BadRequestException("Insufficient stock");

    await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: inventory.currentStock - quantity },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId,
          type: "WASTE",
          quantity: -quantity,
          unitCost: inventory.averageCost,
          totalCost: quantity * inventory.averageCost,
          notes: reason,
          ingredientId: inventory.ingredientId,
          packagingId: inventory.packagingId,
        },
      }),
    ]);

    return this.findOne(inventoryId);
  }

  async getTransactions(inventoryId: string, page = 1, pageSize = 50) {
    const [items, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: { inventoryId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.inventoryTransaction.count({ where: { inventoryId } }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getLowStock() {
    const inventories = await this.prisma.inventory.findMany({
      include: {
        ingredient: { include: { unit: true } },
        packaging: { include: { unit: true } },
      },
    });
    return inventories.filter(inv => {
      if (inv.ingredient) return inv.currentStock <= inv.ingredient.minimumStock;
      if (inv.packaging) return inv.currentStock <= inv.packaging.minimumStock;
      return false;
    });
  }

  async getInventoryValue() {
    const inventories = await this.prisma.inventory.findMany();
    return inventories.reduce((sum, inv) => sum + inv.currentStock * inv.averageCost, 0);
  }
}
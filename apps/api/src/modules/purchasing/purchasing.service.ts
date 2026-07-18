import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PurchasingService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string; supplierId?: string; page?: number; pageSize?: number }) {
    const { status, supplierId, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: { include: { ingredient: true, packaging: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { ingredient: { include: { unit: true } }, packaging: { include: { unit: true } } } },
        goodsReceipts: true,
      },
    });
    if (!po) throw new NotFoundException("Purchase order not found");
    return po;
  }

  async create(dto: { supplierId: string; expectedDate?: string; notes?: string; items: Array<{ ingredientId?: string; packagingId?: string; quantity: number; unitCost: number }> }) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException("Supplier not found");

    const orderNumber = `PO${Date.now().toString().slice(-8)}`;
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: dto.supplierId,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        totalAmount,
        notes: dto.notes,
        status: "DRAFT",
      },
    });

    for (const item of dto.items) {
      await this.prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: po.id,
          ingredientId: item.ingredientId,
          packagingId: item.packagingId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        },
      });
    }

    return this.findOne(po.id);
  }

  async updateStatus(id: string, status: string) {
    const po = await this.findOne(id);
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SENT", "CANCELLED"],
      SENT: ["PARTIAL", "RECEIVED", "CANCELLED"],
      PARTIAL: ["RECEIVED", "CANCELLED"],
    };
    if (!validTransitions[po.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${status}`);
    }
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: status as any } });
  }

  async receive(id: string, items: Array<{ itemId: string; receivedQty: number }>) {
    const po = await this.findOne(id);
    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      throw new BadRequestException("Cannot receive this order");
    }

    for (const item of items) {
      const poItem = po.items.find(i => i.id === item.itemId);
      if (!poItem) continue;

      await this.prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: { receivedQty: item.receivedQty },
      });

      // Update inventory
      if (poItem.ingredientId) {
        const inventory = await this.prisma.inventory.findUnique({ where: { ingredientId: poItem.ingredientId } });
        if (inventory) {
          const currentValue = inventory.currentStock * inventory.averageCost;
          const newValue = item.receivedQty * poItem.unitCost;
          const newStock = inventory.currentStock + item.receivedQty;
          const newAvg = newStock > 0 ? (currentValue + newValue) / newStock : poItem.unitCost;

          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: { currentStock: newStock, averageCost: Math.round(newAvg * 100) / 100, lastRestockDate: new Date() },
          });
          await this.prisma.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: "PURCHASE",
              quantity: item.receivedQty,
              unitCost: poItem.unitCost,
              totalCost: item.receivedQty * poItem.unitCost,
              referenceId: id,
              referenceType: "PURCHASE_ORDER",
              ingredientId: poItem.ingredientId,
            },
          });
        }
      }

      if (poItem.packagingId) {
        const inventory = await this.prisma.inventory.findUnique({ where: { packagingId: poItem.packagingId } });
        if (inventory) {
          const currentValue = inventory.currentStock * inventory.averageCost;
          const newValue = item.receivedQty * poItem.unitCost;
          const newStock = inventory.currentStock + item.receivedQty;
          const newAvg = newStock > 0 ? (currentValue + newValue) / newStock : poItem.unitCost;

          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: { currentStock: newStock, averageCost: Math.round(newAvg * 100) / 100, lastRestockDate: new Date() },
          });
          await this.prisma.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: "PURCHASE",
              quantity: item.receivedQty,
              unitCost: poItem.unitCost,
              totalCost: item.receivedQty * poItem.unitCost,
              referenceId: id,
              referenceType: "PURCHASE_ORDER",
              packagingId: poItem.packagingId,
            },
          });
        }
      }
    }

    await this.prisma.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED", receivedDate: new Date() } });
    await this.prisma.goodsReceipt.create({
      data: { receiptNumber: `GR${Date.now().toString().slice(-8)}`, purchaseOrderId: id },
    });

    return this.findOne(id);
  }

  async generateSuggestions() {
    const lowStock = await this.prisma.inventory.findMany({
      include: { ingredient: { include: { supplier: true } }, packaging: true },
    });

    const suggestions = lowStock
      .filter(inv => {
        if (inv.ingredient) return inv.currentStock <= inv.ingredient.minimumStock;
        if (inv.packaging) return inv.currentStock <= inv.packaging.minimumStock;
        return false;
      })
      .map(inv => ({
        inventoryId: inv.id,
        name: inv.ingredient?.name || inv.packaging?.name,
        currentStock: inv.currentStock,
        minimumStock: inv.ingredient?.minimumStock || inv.packaging?.minimumStock || 0,
        suggestedQuantity: (inv.ingredient?.minimumStock || inv.packaging?.minimumStock || 0) * 2 - inv.currentStock,
        supplier: inv.ingredient?.supplier,
        estimatedCost: ((inv.ingredient?.minimumStock || inv.packaging?.minimumStock || 0) * 2 - inv.currentStock) * inv.averageCost,
      }));

    return suggestions;
  }
}
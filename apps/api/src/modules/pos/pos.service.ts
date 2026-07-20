import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async getMenu() {
    return this.prisma.menuItem.findMany({
      where: { isActive: true },
      include: { recipeVersion: true },
      orderBy: { name: "asc" },
    });
  }

  async createWalkInOrder(items: Array<{ menuItemId: string; quantity: number }>) {
    if (!items.length) throw new BadRequestException("No items");

    // Get or create walk-in customer
    let customer = await this.prisma.customer.findFirst({ where: { name: "Walk-in" } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: "Walk-in", phone: "-" },
      });
    }

    // Get default meal template or create one
    let template = await this.prisma.mealTemplate.findFirst({ where: { name: "Walk-in Order" } });
    if (!template) {
      template = await this.prisma.mealTemplate.create({
        data: { name: "Walk-in Order", description: "POS walk-in orders" },
      });
    }

    const orderNumber = `POS${Date.now().toString().slice(-8)}`;
    let totalAmount = 0;

    // Calculate total
    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      if (!menuItem) throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
      totalAmount += menuItem.sellingPrice * item.quantity;
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        mealTemplateId: template.id,
        quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        deliveryDate: new Date(),
        sellingPrice: totalAmount / items.reduce((sum, i) => sum + i.quantity, 0),
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    // Create order items
    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem!.sellingPrice,
          totalPrice: menuItem!.sellingPrice * item.quantity,
        },
      });
    }

    // Create payment
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        paymentMethod: "cash",
        paymentDate: new Date(),
      },
    });

    return this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        items: { include: { menuItem: true } },
        payments: true,
      },
    });
  }

  async getDailySales(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: targetDate, lt: nextDay },
        status: { not: "CANCELLED" },
      },
      include: { items: true },
    });

    const totalSales = orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    return {
      date: targetDate.toISOString().split("T")[0],
      totalSales,
      totalOrders,
      totalItems,
      averageOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
    };
  }
}
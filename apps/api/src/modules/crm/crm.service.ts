import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          include: { items: { include: { menuItem: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) throw new NotFoundException("Customer not found");

    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);
    const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Favorite items
    const itemCounts: Record<string, { name: string; count: number }> = {};
    for (const order of customer.orders) {
      for (const item of order.items) {
        if (!itemCounts[item.menuItemId]) {
          itemCounts[item.menuItemId] = { name: item.menuItem?.name || "Unknown", count: 0 };
        }
        itemCounts[item.menuItemId].count += item.quantity;
      }
    }

    const favoriteItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
      },
      stats: {
        totalOrders,
        totalSpent,
        averageOrder: Math.round(averageOrder),
        lastOrderDate: customer.orders[0]?.createdAt || null,
      },
      favoriteItems,
      recentOrders: customer.orders.slice(0, 10).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        quantity: o.quantity,
        amount: o.sellingPrice * o.quantity,
        status: o.status,
        date: o.createdAt,
      })),
    };
  }

  async getTopCustomers(limit = 10) {
    const customers = await this.prisma.customer.findMany({
      where: { isActive: true },
      include: {
        orders: {
          where: { status: { in: ["DELIVERED", "COMPLETED"] } },
        },
      },
    });

    return customers
      .map(c => ({
        id: c.id,
        name: c.name,
        company: c.company,
        totalOrders: c.orders.length,
        totalSpent: c.orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  async getInactiveCustomers(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const customers = await this.prisma.customer.findMany({
      where: { isActive: true },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return customers
      .filter(c => !c.orders[0] || c.orders[0].createdAt < cutoff)
      .map(c => ({
        id: c.id,
        name: c.name,
        company: c.company,
        lastOrderDate: c.orders[0]?.createdAt || null,
        daysSinceLastOrder: c.orders[0]
          ? Math.floor((Date.now() - c.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }));
  }

  async getCustomerSegmentation() {
    const customers = await this.prisma.customer.findMany({
      where: { isActive: true },
      include: {
        orders: {
          where: { status: { in: ["DELIVERED", "COMPLETED"] } },
        },
      },
    });

    const segments = {
      vip: { count: 0, customers: [] as any[] }, // > 50 orders
      regular: { count: 0, customers: [] as any[] }, // 10-50 orders
      occasional: { count: 0, customers: [] as any[] }, // 3-9 orders
      new: { count: 0, customers: [] as any[] }, // 1-2 orders
    };

    for (const c of customers) {
      const orderCount = c.orders.length;
      const totalSpent = c.orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0);
      const data = { id: c.id, name: c.name, orderCount, totalSpent };

      if (orderCount > 50) {
        segments.vip.count++;
        segments.vip.customers.push(data);
      } else if (orderCount >= 10) {
        segments.regular.count++;
        segments.regular.customers.push(data);
      } else if (orderCount >= 3) {
        segments.occasional.count++;
        segments.occasional.customers.push(data);
      } else {
        segments.new.count++;
        segments.new.customers.push(data);
      }
    }

    return segments;
  }
}
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; status?: string; customerId?: string; page?: number; pageSize?: number }) {
    const { search, status, customerId, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          mealTemplate: true,
          items: { include: { menuItem: true } },
          productionBatches: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        mealTemplate: { include: { items: { include: { menuItem: true } } } },
        items: { include: { menuItem: true } },
        productionBatches: { include: { items: true } },
        delivery: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async create(dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    const template = await this.prisma.mealTemplate.findUnique({
      where: { id: dto.mealTemplateId },
      include: { items: { include: { menuItem: true } } },
    });
    if (!template) throw new NotFoundException("Meal template not found");

    const orderNumber = this.generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: dto.customerId,
        mealTemplateId: dto.mealTemplateId,
        quantity: dto.quantity,
        deliveryDate: new Date(dto.deliveryDate),
        deliveryTime: dto.deliveryTime,
        deliveryAddress: dto.deliveryAddress,
        specialNotes: dto.specialNotes,
        sellingPrice: dto.sellingPrice,
        deposit: dto.deposit || 0,
        status: "DRAFT",
      },
      include: { customer: true, mealTemplate: true },
    });

    // Create order items from meal template
    for (const templateItem of template.items) {
      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: templateItem.menuItemId,
          quantity: templateItem.quantity * dto.quantity,
          unitPrice: templateItem.menuItem.sellingPrice,
          totalPrice: templateItem.menuItem.sellingPrice * templateItem.quantity * dto.quantity,
        },
      });
    }

    return this.findOne(order.id);
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.findOne(id);
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      throw new BadRequestException("Cannot update completed or cancelled order");
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        mealTemplateId: dto.mealTemplateId,
        quantity: dto.quantity,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        deliveryTime: dto.deliveryTime,
        deliveryAddress: dto.deliveryAddress,
        specialNotes: dto.specialNotes,
        sellingPrice: dto.sellingPrice,
        deposit: dto.deposit,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const order = await this.findOne(id);
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["COOKING", "CANCELLED"],
      COOKING: ["PACKAGING", "CANCELLED"],
      PACKAGING: ["READY", "CANCELLED"],
      READY: ["DELIVERING", "CANCELLED"],
      DELIVERING: ["DELIVERED", "CANCELLED"],
      DELIVERED: ["COMPLETED"],
    };
    if (!validTransitions[order.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  async calculateIngredients(id: string) {
    const order = await this.findOne(id);
    const ingredients: Record<string, { name: string; quantity: number; unit: string }> = {};

    for (const item of order.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: {
          recipeVersion: {
            include: { items: { include: { ingredient: { include: { unit: true } }, unit: true } } },
          },
        },
      });
      if (menuItem?.recipeVersion) {
        for (const recipeItem of menuItem.recipeVersion.items) {
          if (recipeItem.ingredient) {
            const key = recipeItem.ingredientId!;
            if (!ingredients[key]) {
              ingredients[key] = {
                name: recipeItem.ingredient.name,
                quantity: 0,
                unit: recipeItem.unit.symbol,
              };
            }
            ingredients[key].quantity += recipeItem.quantity * item.quantity;
          }
        }
      }
    }
    return Object.values(ingredients);
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `ORD${year}${month}${day}${random}`;
  }
}
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateMealTemplateDto } from "./dto/create-meal-template.dto";
import { CreateMealTemplateItemDto } from "./dto/create-meal-template-item.dto";

@Injectable()
export class MealTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; page?: number; pageSize?: number }) {
    const { search, page = 1, pageSize = 50 } = params || {};
    const where: any = { isActive: true };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    const [items, total] = await Promise.all([
      this.prisma.mealTemplate.findMany({
        where,
        include: {
          items: {
            include: { menuItem: true },
          },
          _count: { select: { orders: true, calendar: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.mealTemplate.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const template = await this.prisma.mealTemplate.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: { include: { recipeVersion: true } } },
        },
        orders: { orderBy: { createdAt: "desc" }, take: 10 },
        calendar: { orderBy: { date: "desc" }, take: 30 },
      },
    });
    if (!template) throw new NotFoundException("Meal template not found");
    return template;
  }

  async create(dto: CreateMealTemplateDto) {
    return this.prisma.mealTemplate.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  async update(id: string, dto: CreateMealTemplateDto) {
    await this.findOne(id);
    return this.prisma.mealTemplate.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mealTemplate.update({ where: { id }, data: { isActive: false } });
  }

  async addItem(templateId: string, dto: CreateMealTemplateItemDto) {
    await this.findOne(templateId);
    return this.prisma.mealTemplateItem.create({
      data: {
        mealTemplateId: templateId,
        menuItemId: dto.menuItemId,
        quantity: dto.quantity || 1,
        notes: dto.notes,
      },
      include: { menuItem: true },
    });
  }

  async removeItem(templateId: string, itemId: string) {
    const item = await this.prisma.mealTemplateItem.findUnique({ where: { id: itemId } });
    if (!item || item.mealTemplateId !== templateId) throw new NotFoundException("Item not found");
    return this.prisma.mealTemplateItem.delete({ where: { id: itemId } });
  }
}
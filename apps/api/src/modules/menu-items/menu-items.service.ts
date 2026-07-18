import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";

@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; page?: number; pageSize?: number }) {
    const { search, page = 1, pageSize = 50 } = params || {};
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        include: {
          recipe: true,
          recipeVersion: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.menuItem.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        recipe: true,
        recipeVersion: {
          include: {
            items: {
              include: {
                ingredient: { include: { unit: true } },
                packaging: { include: { unit: true } },
                unit: true,
              },
            },
          },
        },
        mealTemplateItems: {
          include: { mealTemplate: true },
        },
      },
    });
    if (!item) throw new NotFoundException("Menu item not found");
    return item;
  }

  async create(dto: CreateMenuItemDto) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: dto.recipeId } });
    if (!recipe) throw new NotFoundException("Recipe not found");
    const version = await this.prisma.recipeVersion.findUnique({ where: { id: dto.recipeVersionId } });
    if (!version || version.recipeId !== dto.recipeId) throw new BadRequestException("Invalid recipe version");
    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        recipeId: dto.recipeId,
        recipeVersionId: dto.recipeVersionId,
        sellingPrice: dto.sellingPrice || 0,
      },
      include: { recipe: true, recipeVersion: true },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        recipeId: dto.recipeId,
        recipeVersionId: dto.recipeVersionId,
        sellingPrice: dto.sellingPrice,
      },
      include: { recipe: true, recipeVersion: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.menuItem.update({ where: { id }, data: { isActive: false } });
  }
}
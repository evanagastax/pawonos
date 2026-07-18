import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreatePackagingDto } from "./dto/create-packaging.dto";
import { UpdatePackagingDto } from "./dto/update-packaging.dto";

@Injectable()
export class PackagingService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; page?: number; pageSize?: number }) {
    const { search, page = 1, pageSize = 50 } = params || {};

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.packaging.findMany({
        where,
        include: {
          unit: true,
          inventory: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.packaging.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id },
      include: {
        unit: true,
        inventory: true,
      },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    return packaging;
  }

  async create(dto: CreatePackagingDto) {
    if (dto.sku) {
      const existing = await this.prisma.packaging.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(`Packaging with SKU ${dto.sku} already exists`);
      }
    }

    const packaging = await this.prisma.packaging.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        unitId: dto.unitId,
        purchasePrice: dto.purchasePrice || 0,
        minimumStock: dto.minimumStock || 0,
        notes: dto.notes,
      },
      include: {
        unit: true,
      },
    });

    // Create inventory record
    await this.prisma.inventory.create({
      data: {
        packagingId: packaging.id,
        currentStock: 0,
        reservedStock: 0,
        incomingStock: 0,
        averageCost: dto.purchasePrice || 0,
      },
    });

    return packaging;
  }

  async update(id: string, dto: UpdatePackagingDto) {
    const packaging = await this.findOne(id);

    if (dto.sku && dto.sku !== packaging.sku) {
      const existing = await this.prisma.packaging.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(`Packaging with SKU ${dto.sku} already exists`);
      }
    }

    return this.prisma.packaging.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        unitId: dto.unitId,
        purchasePrice: dto.purchasePrice,
        minimumStock: dto.minimumStock,
        notes: dto.notes,
      },
      include: {
        unit: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.packaging.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getLowStock() {
    const packaging = await this.prisma.packaging.findMany({
      where: { isActive: true },
      include: {
        unit: true,
        inventory: true,
      },
      orderBy: { name: "asc" },
    });

    return packaging.filter(
      (inv) => inv.inventory && inv.inventory.currentStock <= inv.minimumStock,
    );
  }
}
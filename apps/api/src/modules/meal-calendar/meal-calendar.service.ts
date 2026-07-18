import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateCalendarEntryDto } from "./dto/create-calendar-entry.dto";

@Injectable()
export class MealCalendarService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }) {
    const { startDate, endDate, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    const [items, total] = await Promise.all([
      this.prisma.mealCalendar.findMany({
        where,
        include: { mealTemplate: { include: { items: { include: { menuItem: true } } } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "asc" },
      }),
      this.prisma.mealCalendar.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const entry = await this.prisma.mealCalendar.findUnique({
      where: { id },
      include: { mealTemplate: { include: { items: { include: { menuItem: true } } } } },
    });
    if (!entry) throw new NotFoundException("Calendar entry not found");
    return entry;
  }

  async create(dto: CreateCalendarEntryDto) {
    const date = new Date(dto.date);
    const existing = await this.prisma.mealCalendar.findUnique({ where: { date } });
    if (existing) throw new ConflictException("Date already has a meal scheduled");
    return this.prisma.mealCalendar.create({
      data: { date, mealTemplateId: dto.mealTemplateId, notes: dto.notes },
      include: { mealTemplate: true },
    });
  }

  async update(id: string, dto: CreateCalendarEntryDto) {
    await this.findOne(id);
    return this.prisma.mealCalendar.update({
      where: { id },
      data: { date: new Date(dto.date), mealTemplateId: dto.mealTemplateId, notes: dto.notes },
      include: { mealTemplate: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mealCalendar.delete({ where: { id } });
  }
}
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.payroll.findMany({
        where,
        include: { items: { include: { employee: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payroll.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: { items: { include: { employee: true } } },
    });
    if (!payroll) throw new NotFoundException("Payroll not found");
    return payroll;
  }

  async generate(period: string, startDate: string, endDate: string) {
    // Check if payroll already exists
    const existing = await this.prisma.payroll.findUnique({ where: { period } });
    if (existing) throw new BadRequestException("Payroll already exists for this period");

    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });

    if (employees.length === 0) throw new BadRequestException("No active employees");

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate working days (simple: weekdays only)
    const workingDays = this.calculateWorkingDays(start, end);

    const payroll = await this.prisma.payroll.create({
      data: {
        period,
        startDate: start,
        endDate: end,
        status: "DRAFT",
      },
    });

    let totalAmount = 0;

    for (const emp of employees) {
      // Get attendance for period
      const attendance = await this.prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: start, lte: end },
        },
      });

      const presentDays = attendance.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
      const overtime = attendance.filter(a => a.status === "PRESENT").length > workingDays
        ? (attendance.filter(a => a.status === "PRESENT").length - workingDays) * (emp.salary / workingDays) * 1.5
        : 0;

      const baseSalary = emp.salary;
      const deductions = (workingDays - presentDays) * (emp.salary / workingDays);
      const netSalary = baseSalary + overtime - deductions;

      await this.prisma.payrollItem.create({
        data: {
          payrollId: payroll.id,
          employeeId: emp.id,
          baseSalary,
          overtime: Math.round(overtime),
          bonus: 0,
          deductions: Math.round(deductions),
          netSalary: Math.round(netSalary),
        },
      });

      totalAmount += netSalary;
    }

    await this.prisma.payroll.update({
      where: { id: payroll.id },
      data: { totalAmount: Math.round(totalAmount) },
    });

    return this.findOne(payroll.id);
  }

  async approve(id: string) {
    const payroll = await this.findOne(id);
    if (payroll.status !== "DRAFT") throw new BadRequestException("Can only approve draft payroll");

    return this.prisma.payroll.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { items: { include: { employee: true } } },
    });
  }

  async markPaid(id: string) {
    const payroll = await this.findOne(id);
    if (payroll.status !== "APPROVED") throw new BadRequestException("Can only pay approved payroll");

    return this.prisma.payroll.update({
      where: { id },
      data: { status: "PAID" },
      include: { items: { include: { employee: true } } },
    });
  }

  async cancel(id: string) {
    const payroll = await this.findOne(id);
    if (payroll.status === "PAID") throw new BadRequestException("Cannot cancel paid payroll");

    return this.prisma.payroll.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: { include: { employee: true } } },
    });
  }

  private calculateWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }
}
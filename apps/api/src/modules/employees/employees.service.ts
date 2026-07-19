import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; department?: string; page?: number; pageSize?: number }) {
    const { search, department, page = 1, pageSize = 50 } = params || {};
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
      ];
    }
    if (department) where.department = department;

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: { _count: { select: { attendance: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: { orderBy: { date: "desc" }, take: 30 },
        payrollItems: { include: { payroll: true }, orderBy: { createdAt: "desc" }, take: 12 },
      },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } });
    if (existing) throw new ConflictException("Employee code already exists");

    if (dto.email) {
      const emailExists = await this.prisma.employee.findUnique({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException("Email already exists");
    }

    return this.prisma.employee.create({
      data: {
        employeeCode: dto.employeeCode,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        position: dto.position,
        department: dto.department,
        joinDate: new Date(dto.joinDate),
        salary: dto.salary || 0,
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        position: dto.position,
        department: dto.department,
        salary: dto.salary,
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: { isActive: false } });
  }

  // Attendance
  async recordAttendance(employeeId: string, date: string, status: string, checkIn?: string, checkOut?: string, notes?: string) {
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: {
        status: status as any,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        notes,
      },
      create: {
        employeeId,
        date: new Date(date),
        status: status as any,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        notes,
      },
    });
  }

  async getAttendance(employeeId: string, startDate?: string, endDate?: string) {
    const where: any = { employeeId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    return this.prisma.attendance.findMany({ where, orderBy: { date: "desc" } });
  }

  async getDepartments() {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      select: { department: true },
      distinct: ["department"],
    });
    return employees.map(e => e.department).filter(Boolean);
  }
}
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  // Multi-branch is a future feature
  // For now, returns single branch info

  async findAll() {
    return [
      {
        id: "main",
        name: "Main Kitchen",
        address: "Main Location",
        isDefault: true,
        isActive: true,
      },
    ];
  }

  async findOne(id: string) {
    if (id !== "main") throw new NotFoundException("Branch not found");
    return {
      id: "main",
      name: "Main Kitchen",
      address: "Main Location",
      isDefault: true,
      isActive: true,
    };
  }

  async getStats(branchId: string) {
    // Get overall stats for the branch
    const [orders, inventory, employees] = await Promise.all([
      this.prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
      this.prisma.inventory.count(),
      this.prisma.employee.count({ where: { isActive: true } }),
    ]);

    return {
      branchId,
      totalOrders: orders,
      inventoryItems: inventory,
      activeEmployees: employees,
    };
  }
}
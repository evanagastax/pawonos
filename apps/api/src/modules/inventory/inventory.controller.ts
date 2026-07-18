import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { InventoryService } from "./inventory.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Inventory")
@Controller("inventory")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @ApiOperation({ summary: "Get all inventory items" })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "lowStock", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("type") type?: string, @Query("lowStock") lowStock?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ type, lowStock: lowStock === "true", page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Get low stock items" })
  async getLowStock() {
    return this.service.getLowStock();
  }

  @Get("value")
  @ApiOperation({ summary: "Get total inventory value" })
  async getInventoryValue() {
    return { value: await this.service.getInventoryValue() };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get inventory item by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/transactions")
  @ApiOperation({ summary: "Get inventory transactions" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async getTransactions(@Param("id") id: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.getTransactions(id, page ? Number(page) : 1, pageSize ? Number(pageSize) : 50);
  }

  @Post(":id/purchase")
  @ApiOperation({ summary: "Record inventory purchase" })
  async purchase(@Param("id") id: string, @Body() dto: { quantity: number; unitCost: number; referenceId?: string }) {
    return this.service.purchase(id, dto.quantity, dto.unitCost, dto.referenceId);
  }

  @Post(":id/reserve")
  @ApiOperation({ summary: "Reserve inventory for order" })
  async reserve(@Param("id") id: string, @Body() dto: { orderId: string; quantity: number }) {
    return this.service.reserve(id, dto.orderId, dto.quantity);
  }

  @Post(":id/consume")
  @ApiOperation({ summary: "Consume inventory" })
  async consume(@Param("id") id: string, @Body() dto: { orderId: string; quantity: number }) {
    return this.service.consume(id, dto.orderId, dto.quantity);
  }

  @Post(":id/adjust")
  @ApiOperation({ summary: "Adjust inventory" })
  async adjust(@Param("id") id: string, @Body() dto: { newStock: number; reason: string }) {
    return this.service.adjust(id, dto.newStock, dto.reason);
  }

  @Post(":id/waste")
  @ApiOperation({ summary: "Record inventory waste" })
  async waste(@Param("id") id: string, @Body() dto: { quantity: number; reason: string }) {
    return this.service.waste(id, dto.quantity, dto.reason);
  }
}
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { PurchasingService } from "./purchasing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Purchasing")
@Controller("purchasing")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasingController {
  constructor(private readonly service: PurchasingService) {}

  @Get()
  @ApiOperation({ summary: "Get all purchase orders" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "supplierId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("status") status?: string, @Query("supplierId") supplierId?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ status, supplierId, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get("suggestions")
  @ApiOperation({ summary: "Get purchase suggestions" })
  async getSuggestions() {
    return this.service.generateSuggestions();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get purchase order by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create purchase order" })
  async create(@Body() dto: { supplierId: string; expectedDate?: string; notes?: string; items: Array<{ ingredientId?: string; packagingId?: string; quantity: number; unitCost: number }> }) {
    return this.service.create(dto);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update purchase order status" })
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.updateStatus(id, status);
  }

  @Post(":id/receive")
  @ApiOperation({ summary: "Receive purchase order items" })
  async receive(@Param("id") id: string, @Body() dto: { items: Array<{ itemId: string; receivedQty: number }> }) {
    return this.service.receive(id, dto.items);
  }
}
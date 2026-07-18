import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ProductionService } from "./production.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Production")
@Controller("production")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  @Get()
  @ApiOperation({ summary: "Get all production batches" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "orderId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("status") status?: string, @Query("orderId") orderId?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ status, orderId, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get("daily-summary")
  @ApiOperation({ summary: "Get daily production summary" })
  @ApiQuery({ name: "date", required: false })
  async getDailySummary(@Query("date") date?: string) {
    return this.service.getDailySummary(date);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get production batch by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("generate/:orderId")
  @ApiOperation({ summary: "Generate production batch from order" })
  async generateFromOrder(@Param("orderId") orderId: string) {
    return this.service.generateFromOrder(orderId);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update production status" })
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.updateStatus(id, status);
  }
}
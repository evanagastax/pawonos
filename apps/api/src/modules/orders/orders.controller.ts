import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Get all orders" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "customerId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("search") search?: string, @Query("status") status?: string, @Query("customerId") customerId?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ search, status, customerId, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create order" })
  async create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update order" })
  async update(@Param("id") id: string, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update order status" })
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.updateStatus(id, status);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete order" })
  async remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Get(":id/ingredients")
  @ApiOperation({ summary: "Calculate ingredients needed" })
  async calculateIngredients(@Param("id") id: string) {
    return this.service.calculateIngredients(id);
  }
}
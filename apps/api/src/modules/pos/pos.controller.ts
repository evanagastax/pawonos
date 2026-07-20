import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { PosService } from "./pos.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("POS")
@Controller("pos")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PosController {
  constructor(private readonly service: PosService) {}

  @Get("menu")
  @ApiOperation({ summary: "Get POS menu" })
  async getMenu() {
    return this.service.getMenu();
  }

  @Post("order")
  @ApiOperation({ summary: "Create walk-in order" })
  async createOrder(@Body() dto: { items: Array<{ menuItemId: string; quantity: number }> }) {
    return this.service.createWalkInOrder(dto.items);
  }

  @Get("daily-sales")
  @ApiOperation({ summary: "Get daily sales" })
  @ApiQuery({ name: "date", required: false })
  async getDailySales(@Query("date") date?: string) {
    return this.service.getDailySales(date);
  }
}
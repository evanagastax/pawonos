import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { PayrollService } from "./payroll.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Payroll")
@Controller("payroll")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @ApiOperation({ summary: "Get all payrolls" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("status") status?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ status, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payroll by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("generate")
  @ApiOperation({ summary: "Generate payroll for period" })
  async generate(@Body() dto: { period: string; startDate: string; endDate: string }) {
    return this.service.generate(dto.period, dto.startDate, dto.endDate);
  }

  @Put(":id/approve")
  @ApiOperation({ summary: "Approve payroll" })
  async approve(@Param("id") id: string) {
    return this.service.approve(id);
  }

  @Put(":id/pay")
  @ApiOperation({ summary: "Mark payroll as paid" })
  async markPaid(@Param("id") id: string) {
    return this.service.markPaid(id);
  }

  @Put(":id/cancel")
  @ApiOperation({ summary: "Cancel payroll" })
  async cancel(@Param("id") id: string) {
    return this.service.cancel(id);
  }
}